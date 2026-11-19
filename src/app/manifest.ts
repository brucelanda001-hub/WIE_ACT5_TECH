import type { MetadataRoute } from "next";

// Web app manifest: lets a child's phone install EdNova to the home screen and open it like an app (no app store).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "EdNova: your learning buddy",
    short_name: "EdNova",
    description: "A safe AI learning buddy for children, with parents in control.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f9ff",
    theme_color: "#2340c8",
    lang: "en",
    categories: ["education", "kids"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ask Nouri", short_name: "Ask", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My stickers", short_name: "Stickers", url: "/companions", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
