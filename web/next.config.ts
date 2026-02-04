import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Redirect www to apex domain
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.samkirk.com",
          },
        ],
        destination: "https://samkirk.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
