"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/utils";

interface KakaoMapProps {
    latitude: number;
    longitude: number;
    label?: string;
    className?: string;
}

declare global {
    interface Window {
        kakao: {
            maps: {
                load: (callback: () => void) => void;
                LatLng: new (lat: number, lng: number) => unknown;
                Map: new (
                    container: HTMLElement,
                    options: { center: unknown; level: number },
                ) => {
                    relayout: () => void;
                };
                Marker: new (options: { map: unknown; position: unknown }) => unknown;
                InfoWindow: new (options: {
                    content: string;
                    removable?: boolean;
                }) => {
                    open: (map: unknown, marker: unknown) => void;
                };
            };
        };
    }
}

const KAKAO_SDK_URL = "//dapi.kakao.com/v2/maps/sdk.js";

let sdkLoadPromise: Promise<void> | null = null;

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function loadKakaoSdk(appKey: string): Promise<void> {
    if (sdkLoadPromise) return sdkLoadPromise;

    sdkLoadPromise = new Promise((resolve, reject) => {
        if (window.kakao?.maps) {
            window.kakao.maps.load(() => resolve());
            return;
        }

        const script = document.createElement("script");
        script.src = `${KAKAO_SDK_URL}?appkey=${appKey}&autoload=false`;
        script.async = true;
        script.onload = () => {
            window.kakao.maps.load(() => resolve());
        };
        script.onerror = () => {
            sdkLoadPromise = null;
            reject(new Error("Failed to load Kakao Maps SDK"));
        };
        document.head.appendChild(script);
    });

    return sdkLoadPromise;
}

export function KakaoMap({ latitude, longitude, label, className }: KakaoMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [loadError, setLoadError] = useState(!appKey);

    useEffect(() => {
        if (!appKey) return;

        loadKakaoSdk(appKey)
            .then(() => setSdkLoaded(true))
            .catch(() => setLoadError(true));
    }, [appKey]);

    useEffect(() => {
        if (!sdkLoaded || !containerRef.current) return;

        const { kakao } = window;
        const position = new kakao.maps.LatLng(latitude, longitude);
        const map = new kakao.maps.Map(containerRef.current, {
            center: position,
            level: 3,
        });

        const marker = new kakao.maps.Marker({
            map,
            position,
        });

        if (label) {
            const infoWindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:5px 10px;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</div>`,
                removable: true,
            });
            infoWindow.open(map, marker);
        }

        // Ensure map renders properly after container is visible
        setTimeout(() => map.relayout(), 100);
    }, [sdkLoaded, latitude, longitude, label]);

    if (!appKey || loadError) {
        return null;
    }

    if (!sdkLoaded) {
        return (
            <div
                className={cn(
                    "h-[200px] bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-400",
                    className,
                )}
            >
                지도를 불러오는 중...
            </div>
        );
    }

    return <div ref={containerRef} className={cn("h-[200px] rounded-lg overflow-hidden", className)} />;
}
