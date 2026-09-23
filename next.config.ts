import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
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
      // Navigations (HTML documents): NETWORK ONLY. We must never serve a cached
      // HTML shell — after a deploy, its hashed chunk references no longer exist
      // on the CDN, so every _next/static asset 404s and the page breaks. Always
      // fetch fresh HTML (whose chunk hashes match the live deploy); if the
      // network fails, show a self-contained retry page (no _next chunks) instead
      // of a stale shell, so we never reject with `no-response`.
      {
        urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
        handler: "NetworkOnly",
        options: {
          plugins: [
            {
              handlerDidError: async () =>
                new Response(
                  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SmartLabs</title></head><body style="font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#0f172a"><div style="text-align:center;padding:2rem"><p style="color:#64748b">Connection issue — please check your network.</p><button onclick="location.reload()" style="padding:.7rem 1.4rem;border-radius:10px;border:0;background:#2563eb;color:#fff;font-weight:600;cursor:pointer">Reload</button></div></body></html>',
                  { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
                ),
            },
          ],
        },
      },
      // Same-origin assets: standard SWR. Only cache 200s so a transient 404
      // (e.g. a chunk requested during a stale window) is never persisted.
      {
        urlPattern: ({ url }: { url: URL }) => url.origin === self.location.origin,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          cacheableResponse: {
            statuses: [200],
          },
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
