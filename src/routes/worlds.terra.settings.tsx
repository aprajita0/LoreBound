import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/pages/settings";

export const Route = createFileRoute("/worlds/terra/settings")({
  head: () => ({
    meta: [
      { title: "World settings — The Isles of Terra — Lorebound" },
      { name: "description", content: "How Lorebound reads this world, and who else can see it." },
      { property: "og:title", content: "World settings — The Isles of Terra" },
      { property: "og:description", content: "How Lorebound reads this world, and who else can see it." },
    ],
  }),
  component: SettingsPage,
});
