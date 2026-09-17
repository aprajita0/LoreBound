import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/pages/overview";

export const Route = createFileRoute("/worlds/terra/")({
  head: () => ({
    meta: [
      { title: "The Isles of Terra — Lorebound" },
      {
        name: "description",
        content: "The world as it stands at the end of Chapter 24: threads, relationships, and recent changes.",
      },
      { property: "og:title", content: "The Isles of Terra — Lorebound" },
      { property: "og:description", content: "The world as it stands at the end of Chapter 24." },
    ],
  }),
  component: OverviewPage,
});
