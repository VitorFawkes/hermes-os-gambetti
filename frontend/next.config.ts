import type { NextConfig } from "next";

// Backend lives wherever Hermes runs. Locally this is the FastAPI service on
// :8000; point HERMES_API_URL at the VPS to view live data from a local site.
const HERMES_API_URL = process.env.HERMES_API_URL ?? "http://localhost:8000";

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
