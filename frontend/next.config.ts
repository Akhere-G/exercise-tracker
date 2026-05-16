import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL(
        "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/**",
      ),
    ],
  },
};

export default nextConfig;
