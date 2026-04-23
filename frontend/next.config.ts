import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  compress: true,
  poweredByHeader: false
};

export default nextConfig;
