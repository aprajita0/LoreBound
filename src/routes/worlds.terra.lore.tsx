import { createFileRoute } from "@tanstack/react-router";
import { LorePage } from "@/components/pages/lore";

export const Route = createFileRoute("/worlds/terra/lore")({
  head: () => ({
    meta: [
      { title: "Lore — The Isles of Terra — Lorebound" },
      { name: "description", content: "Bloodlines, soulbonds, familiars, and the rules the world keeps." },
      { property: "og:title", content: "Lore — The Isles of Terra" },
      { property: "og:description", content: "Bloodlines, soulbonds, familiars, and the rules the world keeps." },
    ],
  }),
  component: LorePage,
});
