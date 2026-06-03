import type { NextConfig } from "next";

// Where the Hermes (FastAPI) backend is reachable from the frontend:
// - On Vercel: the backend service is mounted at /_/backend (same deployment,
//   per experimentalServices in vercel.json), so we rewrite to it internally.
// - Locally: the FastAPI dev server on :8000.
// Override with HERMES_API_URL (e.g. a VPS URL) to run the site against live data.
const HERMES_API_URL =
  process.env.HERMES_API_URL ??
  (process.env.VERCEL ? "/_/backend" : "http://localhost:8000");

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${HERMES_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
