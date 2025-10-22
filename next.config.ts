import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // ESLintエラーを無視する設定
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;