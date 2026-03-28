import "server-only";

import type { DailyCheckMetrics, VendorGradeItem } from "@/lib/schema/beta-ops";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

import {
    countLeadsCreatedSince,
    countNotificationFailuresSince,
    countStuckSubmittedLeads,
    countUnviewedOver24h,
    fetchFirstStatusChanges,
    fetchLeadsInPeriod,
} from "./repository";

// ============================================
// Daily Check Metrics
// ============================================

export async function getDailyCheckMetrics(): Promise<DailyCheckMetrics> {
    const admin = createSupabaseAdminClient();

    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayStart = new Date(
        Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset,
    ).toISOString();

    const nowIso = now.toISOString();
    const minus48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const minus7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
        leadsCreatedToday,
        leadsIn7d,
        unviewedOver24h,
        notificationFailuresToday,
        stuckSubmittedLeads,
    ] = await Promise.all([
        countLeadsCreatedSince(admin, todayStart),
        fetchLeadsInPeriod(admin, minus7d, nowIso),
        countUnviewedOver24h(admin),
        countNotificationFailuresSince(admin, todayStart),
        countStuckSubmittedLeads(admin, minus48h),
    ]);

    // Response rate: leads with status != 'submitted' / total
    const totalLeads = leadsIn7d.length;
    const respondedLeads = leadsIn7d.filter((l) => l.status !== "submitted").length;
    const vendorResponseRate = totalLeads > 0 ? Math.round((respondedLeads / totalLeads) * 10000) / 10000 : 0;

    // Avg response time: fetch first status changes, compute average delta from lead creation
    let avgResponseTimeMinutes: number | null = null;

    if (totalLeads > 0) {
        const leadIds = leadsIn7d.map((l) => l.id);
        const firstChanges = await fetchFirstStatusChanges(admin, leadIds);

        if (firstChanges.length > 0) {
            const leadCreatedMap = new Map(leadsIn7d.map((l) => [l.id, l.created_at]));
            let totalMinutes = 0;
            let count = 0;

            for (const change of firstChanges) {
                const leadCreatedAt = leadCreatedMap.get(change.lead_id);
                if (leadCreatedAt) {
                    const delta =
                        (new Date(change.created_at).getTime() - new Date(leadCreatedAt).getTime()) / 60000;
                    totalMinutes += delta;
                    count++;
                }
            }

            if (count > 0) {
                avgResponseTimeMinutes = Math.round((totalMinutes / count) * 100) / 100;
            }
        }
    }

    return {
        leadsCreatedToday,
        vendorResponseRate,
        avgResponseTimeMinutes,
        unviewedOver24h,
        notificationFailuresToday,
        stuckSubmittedLeads,
    };
}

// ============================================
// Vendor Grade Metrics
// ============================================

export async function getVendorGradeMetrics(opts: {
    from?: string;
    to?: string;
}): Promise<VendorGradeItem[]> {
    const admin = createSupabaseAdminClient();

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const from = opts.from ?? defaultFrom;
    const to = opts.to ?? now.toISOString();

    // Fetch all leads in period
    const leads = await fetchLeadsInPeriod(admin, from, to);

    if (leads.length === 0) {
        return [];
    }

    // Fetch first status changes for response time
    const leadIds = leads.map((l) => l.id);
    const firstChanges = await fetchFirstStatusChanges(admin, leadIds);
    const firstChangeMap = new Map(firstChanges.map((c) => [c.lead_id, c]));

    // Fetch vendor names
    const vendorIds = [...new Set(leads.map((l) => l.vendor_id))];
    const { data: vendors, error: vendorError } = await admin
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

    if (vendorError) {
        // Non-critical: proceed with empty names
    }

    const vendorNameMap = new Map((vendors ?? []).map((v) => [v.id, v.name]));

    // Group by vendorId
    const minus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const vendorMap = new Map<
        string,
        {
            totalLeads: number;
            respondedLeads: number;
            responseTimes: number[];
            unviewedRepeatCount: number;
        }
    >();

    for (const lead of leads) {
        const vid = lead.vendor_id;
        if (!vendorMap.has(vid)) {
            vendorMap.set(vid, {
                totalLeads: 0,
                respondedLeads: 0,
                responseTimes: [],
                unviewedRepeatCount: 0,
            });
        }

        const entry = vendorMap.get(vid)!;
        entry.totalLeads++;

        if (lead.status !== "submitted") {
            entry.respondedLeads++;
        }

        // Response time
        const firstChange = firstChangeMap.get(lead.id);
        if (firstChange) {
            const delta =
                (new Date(firstChange.created_at).getTime() - new Date(lead.created_at).getTime()) / 60000;
            entry.responseTimes.push(delta);
        }

        // Unviewed repeat: viewed_at null and created_at < now-24h
        if (lead.viewed_at === null && lead.created_at < minus24h) {
            entry.unviewedRepeatCount++;
        }
    }

    // Build result
    const items: VendorGradeItem[] = [];

    for (const [vendorId, stats] of vendorMap) {
        const responseRate =
            stats.totalLeads > 0
                ? Math.round((stats.respondedLeads / stats.totalLeads) * 10000) / 10000
                : 0;

        const avgResponseTimeMinutes =
            stats.responseTimes.length > 0
                ? Math.round(
                      (stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length) * 100,
                  ) / 100
                : null;

        let grade: "A" | "B" | "C";
        if (responseRate >= 0.8) {
            grade = "A";
        } else if (responseRate >= 0.6) {
            grade = "B";
        } else {
            grade = "C";
        }

        items.push({
            vendorId,
            vendorName: vendorNameMap.get(vendorId) ?? "",
            totalLeads: stats.totalLeads,
            respondedLeads: stats.respondedLeads,
            responseRate,
            avgResponseTimeMinutes,
            unviewedRepeatCount: stats.unviewedRepeatCount,
            grade,
        });
    }

    // Sort: grade A first, then B, then C; within same grade by totalLeads desc
    const gradeOrder = { A: 0, B: 1, C: 2 };
    items.sort((a, b) => {
        const gradeDiff = gradeOrder[a.grade] - gradeOrder[b.grade];
        if (gradeDiff !== 0) return gradeDiff;
        return b.totalLeads - a.totalLeads;
    });

    return items;
}
