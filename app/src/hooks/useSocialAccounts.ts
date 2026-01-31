"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserIdentity } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import type { SocialProviderId } from "@/lib/constants/oauth";

export function useSocialAccounts() {
    const queryClient = useQueryClient();

    const { data: identities = [], isLoading } = useQuery({
        queryKey: ["auth", "identities"],
        queryFn: async () => {
            const supabase = getSupabaseBrowserClient();
            const { data } = await supabase.auth.getUserIdentities();
            return data?.identities ?? [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const refetch = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["auth", "identities"] });
    }, [queryClient]);

    const isConnected = useCallback(
        (providerId: SocialProviderId) => identities.some((i: UserIdentity) => i.provider === providerId),
        [identities]
    );

    const getIdentity = useCallback(
        (providerId: SocialProviderId) => identities.find((i: UserIdentity) => i.provider === providerId),
        [identities]
    );

    return {
        identities,
        isLoading,
        isConnected,
        getIdentity,
        refetch,
    };
}
