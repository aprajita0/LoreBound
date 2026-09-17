import { createFileRoute } from "@tanstack/react-router";
import { ManuscriptPage } from "@/components/pages/manuscript";

export const Route = createFileRoute("/worlds/terra/manuscript")({
  head: () => ({
    meta: [
      { title: "Manuscript — The Isles of Terra — Lorebound" },
      { name: "description", content: "Write Chapter 24 with the chapter navigator, autosave, and a chapter analysis drawer." },
      { property: "og:title", content: "Manuscript — The Isles of Terra" },
      { property: "og:description", content: "Write Chapter 24 with the chapter navigator, autosave, and a chapter analysis drawer." },
    ],
  }),
  component: ManuscriptPage,
});
