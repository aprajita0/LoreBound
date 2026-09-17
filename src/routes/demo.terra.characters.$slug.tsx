import { createFileRoute } from "@tanstack/react-router";
import { CharacterProfilePage } from "@/components/pages/character-profile";

export const Route = createFileRoute("/demo/terra/characters/$slug")({
  head: () => ({
    meta: [
      { title: "Character dossier — The Isles of Terra — Lorebound" },
      {
        name: "description",
        content: "A layered character dossier: identities, abilities, secrets kept and secrets carried, with source passages.",
      },
      { property: "og:title", content: "Character dossier — The Isles of Terra" },
      {
        property: "og:description",
        content: "Identities, abilities, relationships, and the passages that prove them.",
      },
    ],
  }),
  component: CharacterRoute,
});

function CharacterRoute() {
  const { slug } = Route.useParams();
  return <CharacterProfilePage slug={slug} />;
}
