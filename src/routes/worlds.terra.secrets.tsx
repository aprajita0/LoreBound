import { createFileRoute } from "@tanstack/react-router";
import { SecretsPage } from "@/components/pages/secrets";

export const Route = createFileRoute("/worlds/terra/secrets")({
  head: () => ({
    meta: [
      { title: "Secrets vault — The Isles of Terra — Lorebound" },
      { name: "description", content: "Who knows, who suspects, and who must never find out." },
      { property: "og:title", content: "Secrets vault — The Isles of Terra" },
      { property: "og:description", content: "Who knows, who suspects, and who must never find out." },
    ],
  }),
  component: SecretsPage,
});
