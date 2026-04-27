import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const enableStandalone =
  !isVercel &&
  (process.env.ORG_WEB_STANDALONE === "1" || process.env.ORG_WEB_STANDALONE === "true");

const SECURITY_HEADERS = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const ADMIN_HEADERS = [
  ...SECURITY_HEADERS,
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: ROOT_DIR,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com", pathname: "/**" },
      { protocol: "https", hostname: "github.com", pathname: "/**" },
      { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/admin/:path*",
        headers: ADMIN_HEADERS,
      },
      {
        source: "/about/admin/:path*",
        headers: ADMIN_HEADERS,
      },
      {
        source: "/events/admin/:path*",
        headers: ADMIN_HEADERS,
      },
      {
        source: "/api/admin/:path*",
        headers: ADMIN_HEADERS,
      },
    ];
  },
  ...(enableStandalone ? { output: "standalone" } : {}),
};

export default nextConfig;
