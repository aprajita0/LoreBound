import { createFileRoute } from "@tanstack/react-router";
import { ContinuityPage } from "@/components/pages/continuity";

export const Route = createFileRoute("/demo/terra/continuity")({
  head: () => ({
    meta: [
      { title: "Continuity inbox — Terra demo — Lorebound" },
      { name: "description", content: "Findings presented as evidence cases, with passages side by side." },
      { property: "og:title", content: "Continuity inbox — The Isles of Terra" },
      { property: "og:description", content: "Findings presented as evidence cases, with passages side by side." },
    ],
  }),
  component: ContinuityPage,
});
