import { useQuery } from "@tanstack/react-query";
import api from "@/api-client/client";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";

export function useFavoriteIds() {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const enabled = isAuthenticated && role === "doctor";

    return useQuery({
        queryKey: ["favorites", "ids"],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<{ data: { items: { vendor: { id: string } | null }[] } }>("/api/favorites");
            return (response.data.data.items ?? [])
                .map((item) => item.vendor?.id)
                .filter((id): id is string => Boolean(id));
        },
        staleTime: 60 * 1000,
        enabled,
    });
}
