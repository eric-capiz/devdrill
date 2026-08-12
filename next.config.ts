import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon-samples",
        destination: "/",
        permanent: true,
      },
      {
        source: "/favicon-samples/:path*",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
