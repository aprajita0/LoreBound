import { createFileRoute } from "@tanstack/react-router";
import { KnowledgePage } from "@/components/pages/knowledge";

export const Route = createFileRoute("/demo/terra/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge tracker — Terra demo — Lorebound" },
      { name: "description", content: "Who knows what — and exactly when they learned it." },
      { property: "og:title", content: "Knowledge tracker — The Isles of Terra" },
      { property: "og:description", content: "Who knows what — and exactly when they learned it." },
    ],
  }),
  component: KnowledgePage,
});
