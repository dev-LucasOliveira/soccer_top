import type { MetadataRoute } from "next";
import { APP_NAME, APP_SLOGAN } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_SLOGAN,
    start_url: "/",
    display: "standalone",
    background_color: "#0c3320",
    theme_color: "#0c3320",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
