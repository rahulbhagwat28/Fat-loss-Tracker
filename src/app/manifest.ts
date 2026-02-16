import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fat Loss Fitness Tracker",
    short_name: "FLT",
    description: "Track your fitness, health, and stay connected with friends.",
    start_url: "/",
    display: "standalone",
    background_color: "#1e3d2f",
    theme_color: "#10b981",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
