import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nearly every route reads the date, a cookie, or the database per request,
  // so routes opt into dynamic rendering explicitly instead of using Cache Components.
  cacheComponents: false,
  serverExternalPackages: ["@libsql/client"],
  // The embed script runs on other sites and loads these fonts cross-origin.
  async headers() {
    const crossOrigin = [
      { key: "Access-Control-Allow-Origin", value: "*" },
      { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
    ];
    return [
      { source: "/embed.js", headers: [...crossOrigin, { key: "Cache-Control", value: "public, max-age=3600" }] },
      { source: "/fonts/:file*", headers: crossOrigin },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
