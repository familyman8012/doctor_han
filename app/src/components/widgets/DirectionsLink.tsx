"use client";

import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button/button";

interface DirectionsLinkProps {
    name: string;
    latitude: number;
    longitude: number;
}

export function DirectionsLink({ name, latitude, longitude }: DirectionsLinkProps) {
    const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${latitude},${longitude}`;
    const naverUrl = `https://map.naver.com/v5/directions/-/-/-/transit?c=${longitude},${latitude},15,0,0,0,dh`;

    return (
        <div className="flex gap-2">
            <a href={kakaoUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button
                    variant="ghostSecondary"
                    size="sm"
                    LeadingIcon={<Navigation className="w-4 h-4" />}
                    className="w-full"
                    type="button"
                >
                    카카오맵
                </Button>
            </a>
            <a href={naverUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button
                    variant="ghostSecondary"
                    size="sm"
                    LeadingIcon={<Navigation className="w-4 h-4" />}
                    className="w-full"
                    type="button"
                >
                    네이버지도
                </Button>
            </a>
        </div>
    );
}
