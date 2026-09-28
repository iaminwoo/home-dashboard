import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Home Dashboard",
    short_name: "Dashboard",
    description: "우리 집을 위한 개인 대시보드",
    start_url: "/admin",
    display: "standalone",
    background_color: "#f8dcdd",
    theme_color: "#f8dcdd",
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
