import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "Paper Trail", template: "%s · Paper Trail" },
  description: "Verified one-sentence facts about the history of money, markets and economics. Every fact has a source.",
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: "Paper Trail" }] } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/source-serif-4-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/ibm-plex-mono-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <a href="#main" className="meta sr-only-text focus:static focus:m-2 focus:inline-block focus:h-auto focus:w-auto">
          Skip to content
        </a>
        <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
          <SiteHeader />
          <main id="main" className="pt-10">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
