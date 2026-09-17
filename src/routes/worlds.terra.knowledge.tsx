import { createFileRoute } from "@tanstack/react-router";
import { KnowledgePage } from "@/components/pages/knowledge";

export const Route = createFileRoute("/worlds/terra/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge tracker — The Isles of Terra — Lorebound" },
      { name: "description", content: "Who knows what — and exactly when they learned it." },
      { property: "og:title", content: "Knowledge tracker — The Isles of Terra" },
      { property: "og:description", content: "Who knows what — and exactly when they learned it." },
    ],
  }),
  component: KnowledgePage,
});
