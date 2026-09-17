import { createFileRoute } from "@tanstack/react-router";
import { TimelinePage } from "@/components/pages/timeline";

export const Route = createFileRoute("/demo/terra/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Terra demo — Lorebound" },
      { name: "description", content: "A connected chronology of what happened, where, and what it cost." },
      { property: "og:title", content: "Timeline — The Isles of Terra" },
      { property: "og:description", content: "A connected chronology of what happened, where, and what it cost." },
    ],
  }),
  component: TimelinePage,
});
