import { refreshAllBadges } from "@/server/badge/service";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const result = await refreshAllBadges();

    return Response.json({
        ok: true,
        totalVendors: result.totalVendors,
        updated: result.updated,
        unchanged: result.unchanged,
    });
}
