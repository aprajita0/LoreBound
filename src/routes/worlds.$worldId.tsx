import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { WorldShell } from "@/components/app/world-shell";
import { ErrorState } from "@/components/app/primitives";
import { getManuscript } from "@/services/manuscripts";

export const Route = createFileRoute("/worlds/$worldId")({
  component: DatabaseWorldWorkspace,
});

function DatabaseWorldWorkspace() {
  const { worldId } = Route.useParams();

  const manuscriptQuery = useQuery({
    queryKey: ["manuscript", worldId],
    queryFn: () => getManuscript(worldId),
  });

  if (manuscriptQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-gold" />
      </div>
    );
  }

  if (manuscriptQuery.isError || !manuscriptQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <ErrorState
            message={
              manuscriptQuery.error instanceof Error
                ? manuscriptQuery.error.message
                : "This world could not be loaded."
            }
            retry={() => {
              void manuscriptQuery.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  const { world } = manuscriptQuery.data;

  return (
    <WorldShell
      mode="authenticated"
      base={`/worlds/${worldId}`}
      worldTitle={world.title}
    >
      <Outlet />
    </WorldShell>
  );
}