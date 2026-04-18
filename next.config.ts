import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/:user/q/:id",
        destination: "/questions/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
