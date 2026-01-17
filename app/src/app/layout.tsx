import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://medihub.kr"),
    title: {
        default: "메디허브 - 의료인과 의료산업을 연결하는 플랫폼",
        template: "%s | 메디허브",
    },
    description: "병의원 개원 및 운영을 위한 B2B 업체 검색 매칭 플랫폼",
    openGraph: {
        type: "website",
        locale: "ko_KR",
        siteName: "메디허브",
        images: [{ url: "/og-default.jpg", width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
