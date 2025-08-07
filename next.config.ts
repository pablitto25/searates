import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignora ESLint al hacer `next build`
  },
};

export default nextConfig;
