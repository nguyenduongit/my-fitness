import type { NextConfig } from "next";

/**
 * Next.js Configuration
 *
 * PWA is handled via a custom service worker (public/sw.js)
 * instead of next-pwa plugin for simplicity and full control.
 *
 * Headers are configured to serve the service worker with
 * the correct scope and cache-control directives.
 */
const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure headers for PWA assets
  async headers() {
    return [
      {
        // Service worker must be served from root with proper headers
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Manifest should not be cached aggressively
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
