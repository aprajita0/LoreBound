import { createFileRoute } from "@tanstack/react-router";
import { RelationshipsPage } from "@/components/pages/relationships";

export const Route = createFileRoute("/worlds/terra/relationships")({
  head: () => ({
    meta: [
      { title: "Relationship atlas — The Isles of Terra — Lorebound" },
      { name: "description", content: "Bonds, secrets, and one-sided affection as they stand at any chapter." },
      { property: "og:title", content: "Relationship atlas — The Isles of Terra" },
      { property: "og:description", content: "Bonds, secrets, and one-sided affection as they stand at any chapter." },
    ],
  }),
  component: RelationshipsPage,
});
