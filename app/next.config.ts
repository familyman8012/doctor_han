import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
    turbopack: {
        root: path.resolve(__dirname),
    },
    serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
    images: {
        dangerouslyAllowSVG: true,
        contentDispositionType: "attachment",
        remotePatterns: [
            {
                protocol: "https",
                hostname: "picsum.photos",
            },
        ],
    },
};

export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    sourcemaps: {
        deleteSourcemapsAfterUpload: true,
    },
    disableLogger: true,
    automaticVercelMonitors: true,
});
