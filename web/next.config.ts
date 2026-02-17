import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the dev indicator in the corner
  devIndicators: false,

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
