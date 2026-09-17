import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/components/pages/overview";

export const Route = createFileRoute("/demo/terra/")({
  head: () => ({
    meta: [
      { title: "Explore The Isles of Terra — Lorebound demo" },
      {
        name: "description",
        content: "Walk through a complete Lorebound story world: characters, secrets, knowledge, and continuity findings.",
      },
      { property: "og:title", content: "Explore The Isles of Terra — Lorebound demo" },
      {
        property: "og:description",
        content: "Walk through a complete Lorebound story world in read-only demo mode.",
      },
    ],
  }),
  component: OverviewPage,
});
