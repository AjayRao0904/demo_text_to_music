// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js it’s mounted under /songgenerator
  basePath: "/songgenerator",

  // Optional: ensure assets use absolute paths
  assetPrefix: "/songgenerator",

  // You can add other config options here if needed
};

export default nextConfig;
