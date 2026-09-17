import { createFileRoute } from "@tanstack/react-router";
import { NotesPage } from "@/components/pages/notes";

export const Route = createFileRoute("/worlds/terra/notes")({
  head: () => ({
    meta: [
      { title: "Notes — The Isles of Terra — Lorebound" },
      { name: "description", content: "Loose notes, research, and scenes that haven't found their chapter." },
      { property: "og:title", content: "Notes — The Isles of Terra" },
      { property: "og:description", content: "Loose notes, research, and scenes that haven't found their chapter." },
    ],
  }),
  component: NotesPage,
});
