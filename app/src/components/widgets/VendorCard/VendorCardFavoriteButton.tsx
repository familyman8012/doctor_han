"use client";

import { Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/components/utils";
import api from "@/api-client/client";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";

interface VendorCardFavoriteButtonProps {
    vendorId: string;
    isFavorited: boolean;
}

export function VendorCardFavoriteButton({ vendorId, isFavorited }: VendorCardFavoriteButtonProps) {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const queryClient = useQueryClient();

    const favoriteMutation = useMutation({
        mutationFn: async () => {
            await api.post("/api/favorites/toggle", { vendorId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
        },
    });

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error("로그인이 필요합니다");
            return;
        }
        if (role !== "doctor") {
            toast.error("한의사 회원만 찜할 수 있습니다");
            return;
        }
        favoriteMutation.mutate();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center",
                "transition-all duration-200 hover:scale-110 active:scale-95",
                isFavorited
                    ? "bg-red-50 text-red-500"
                    : "bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50",
            )}
            aria-label={isFavorited ? "찜 해제" : "찜하기"}
        >
            <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>
    );
}
