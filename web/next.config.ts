import type { NextConfig } from "next";

function buildDateStamp(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `v${get("month")}-${get("day")}-${get("year")}_${get("hour")}:${get("minute")}`;
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDateStamp(),
  },
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
