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
      // Navigations (HTML documents): network-first so SSR/auth pages stay fresh,
      // with cache as an offline fallback. StaleWhileRevalidate must NOT handle these
      // — a cache miss + failed network throws `no-response` and the navigation dies.
      {
        urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [200],
          },
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          plugins: [
            {
              // A failed document navigation (slow/flaky network, or a cache miss on a
              // ?query URL) must NOT reject with `no-response` — that kills the page.
              // Serve the cached page (exact, then ignoring the query as an app-shell
              // fallback); as a last resort return a lightweight, non-looping retry page.
              handlerDidError: async ({ request }: { request: Request }) => {
                const exact = await caches.match(request);
                if (exact) return exact;
                const shell = await caches.match(request, { ignoreSearch: true });
                if (shell) return shell;
                return new Response(
                  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SmartLabs</title></head><body style="font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#0f172a"><div style="text-align:center;padding:2rem"><p style="color:#64748b">Connection issue — please check your network.</p><button onclick="location.reload()" style="padding:.7rem 1.4rem;border-radius:10px;border:0;background:#2563eb;color:#fff;font-weight:600;cursor:pointer">Reload</button></div></body></html>',
                  { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
                );
              },
            },
          ],
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
