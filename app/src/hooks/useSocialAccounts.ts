"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserIdentity } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import type { SocialProviderId } from "@/lib/constants/oauth";

interface SocialAccountState {
    identities: UserIdentity[];
    isLoading: boolean;
}

export function useSocialAccounts() {
    const [state, setState] = useState<SocialAccountState>({
        identities: [],
        isLoading: true,
    });

    const fetchIdentities = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true }));
        try {
            const supabase = getSupabaseBrowserClient();
            const { data } = await supabase.auth.getUserIdentities();
            setState({
                identities: data?.identities ?? [],
                isLoading: false,
            });
        } catch {
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    }, []);

    useEffect(() => {
        fetchIdentities();
    }, [fetchIdentities]);

    const isConnected = useCallback(
        (providerId: SocialProviderId) => state.identities.some((i) => i.provider === providerId),
        [state.identities]
    );

    const getIdentity = useCallback(
        (providerId: SocialProviderId) => state.identities.find((i) => i.provider === providerId),
        [state.identities]
    );

    return {
        identities: state.identities,
        isLoading: state.isLoading,
        isConnected,
        getIdentity,
        refetch: fetchIdentities,
    };
}
