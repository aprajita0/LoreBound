import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorldShell } from "@/components/app/world-shell";

export const Route = createFileRoute("/worlds/terra")({
  component: TerraWorkspace,
});

function TerraWorkspace() {
  return (
    <WorldShell mode="authenticated" base="/worlds/terra" worldTitle="The Isles of Terra">
      <Outlet />
    </WorldShell>
  );
}
