import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

/**
 * Root Layout
 *
 * Configures:
 * - PWA meta tags (manifest, theme-color, apple-mobile-web-app-*)
 * - Google Fonts (Inter)
 * - Dark mode by default
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// ─── App name (change this to rebrand your PWA) ─────────────────────────────
const APP_NAME = "My Fitness";
const APP_DESCRIPTION = "A modern fitness app";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",

  // Apple PWA meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },

  // Icons
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },

  // Open Graph
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Additional iOS PWA meta tags for full-screen experience */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* ── iOS Splash Screens (apple-touch-startup-image) ────────────── */}
        {/* iPhone 14 Pro Max (1290×2796 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 14 Pro (1179×2556 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1179x2556.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 14 / 13 / 12 (1170×2532 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone X / XS / 11 Pro (1125×2436 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone XS Max / 11 Pro Max (1242×2688 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1242x2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone XR / 11 (828×1792 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-828x1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPhone 8 Plus / 7 Plus / 6s Plus (1242×2208 @3x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        {/* iPhone 8 / 7 / 6s / SE2 (750×1334 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Air / Mini (1536×2048 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1536x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        {/* iPad Pro 12.9" (2048×2732 @2x) */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>
      <body className={`${inter.variable} antialiased bg-slate-950 text-slate-50`}>
        <div className="flex flex-col min-h-dvh">
          <div className="flex-1 pb-16">
            {children}
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
