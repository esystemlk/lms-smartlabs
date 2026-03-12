import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Avoid caching problematic third-party trackers/cleardot
      {
        urlPattern: /https:\/\/www\.google\.com\/images\/cleardot\.gif/i,
        handler: "NetworkOnly",
        options: {
          cacheName: "ignore-cleardot",
        },
      },
      // Bypass caching for Firestore and Firebase APIs as it breaks real-time streams
      {
        urlPattern: /^https:\/\/(firestore\.googleapis\.com|firebasestorage\.googleapis\.com|firebaseinstallations\.googleapis\.com)\/.*/i,
        handler: "NetworkOnly",
        options: {
          cacheName: "ignore-firebase",
        },
      },
      // Same-origin assets: standard SWR
      {
        urlPattern: ({ url }: { url: URL }) => url.origin === self.location.origin,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          expiration: {
            maxEntries: 300,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      // Cross-origin: avoid aggressive caching; prefer network and fall back to cache
      {
        urlPattern: ({ url }: { url: URL }) => url.origin !== self.location.origin,
        handler: "NetworkFirst",
        options: {
          cacheName: "cross-origin",
          networkTimeoutSeconds: 5,
          cacheableResponse: {
            statuses: [200],
          },
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Helpful for Electron later if we want to bundle everything
  // Enable headers for Zoom SharedArrayBuffer support
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
        ],
      },
      {
        source: "/classroom.html",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
