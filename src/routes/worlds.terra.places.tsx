import { createFileRoute } from "@tanstack/react-router";
import { PlacesPage } from "@/components/pages/places";

export const Route = createFileRoute("/worlds/terra/places")({
  head: () => ({
    meta: [
      { title: "Places — The Isles of Terra — Lorebound" },
      { name: "description", content: "The Academy, the Low Lantern, and every room the story remembers." },
      { property: "og:title", content: "Places — The Isles of Terra" },
      { property: "og:description", content: "The Academy, the Low Lantern, and every room the story remembers." },
    ],
  }),
  component: PlacesPage,
});
