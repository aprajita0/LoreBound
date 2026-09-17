import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorldShell } from "@/components/app/world-shell";

export const Route = createFileRoute("/demo/terra")({
  component: TerraDemo,
});

function TerraDemo() {
  return (
    <WorldShell mode="demo" base="/demo/terra" worldTitle="The Isles of Terra">
      <Outlet />
    </WorldShell>
  );
}
