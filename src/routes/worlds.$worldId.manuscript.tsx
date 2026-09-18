import { createFileRoute } from "@tanstack/react-router";
import { DatabaseManuscriptPage } from "@/components/pages/database-manuscript";

export const Route = createFileRoute("/worlds/$worldId/manuscript")({
  head: () => ({
    meta: [
      { title: "Writing Studio — Lorebound" },
      {
        name: "description",
        content: "Write and automatically save your Lorebound manuscript.",
      },
    ],
  }),
  component: DynamicManuscriptRoute,
});

function DynamicManuscriptRoute() {
  const { worldId } = Route.useParams();

  return <DatabaseManuscriptPage worldId={worldId} />;
}