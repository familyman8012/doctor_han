"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

const SESSION_QUERY_KEY = ["auth", "session"] as const;

export function useSession() {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            queryClient.setQueryData(SESSION_QUERY_KEY, session);
        });

        return () => subscription.unsubscribe();
    }, [queryClient, supabase]);

    return useQuery({
        queryKey: SESSION_QUERY_KEY,
        queryFn: async (): Promise<Session | null> => {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        },
        staleTime: Infinity,
    });
}

export async function signOut(): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

