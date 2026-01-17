import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medihub.kr";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/admin/", "/mypage/", "/partner/"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
