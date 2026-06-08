import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA({
  output: "standalone",
  turbopack: {},
  images: {
    remotePatterns: [
      new URL(
        "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/refs/heads/main/**",
      ),
    ],
  },
});
