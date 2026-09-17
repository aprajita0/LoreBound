import { createFileRoute } from "@tanstack/react-router";
import { CharactersPage } from "@/components/pages/characters";

export const Route = createFileRoute("/demo/terra/characters/")({
  head: () => ({
    meta: [
      { title: "Characters — Terra demo — Lorebound" },
      { name: "description", content: "A searchable directory of everyone who walks through the Isles of Terra." },
      { property: "og:title", content: "Characters — The Isles of Terra" },
      { property: "og:description", content: "A searchable directory of everyone who walks through the Isles of Terra." },
    ],
  }),
  component: CharactersPage,
});
