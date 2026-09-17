import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel, EmptyState, ErrorState, ListSkeleton } from "@/components/app/primitives";
import { useWorldMode } from "@/components/app/world-mode";
import { noteService } from "@/services/lorebound";
import { cn } from "@/lib/utils";

const kinds = [
  { key: "all", label: "All" },
  { key: "loose", label: "Loose notes" },
  { key: "research", label: "Research" },
  { key: "scene-idea", label: "Scene ideas" },
  { key: "character", label: "Character notes" },
];

export function NotesPage() {
  const { guard } = useWorldMode();
  const q = useQuery({ queryKey: ["terra", "notes"], queryFn: () => noteService.list() });
  const [kind, setKind] = useState("all");

  const list = (q.data ?? []).filter((n) => kind === "all" || n.kind === kind);
  const pinned = list.filter((n) => n.pinned);
  const rest = list.filter((n) => !n.pinned);

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Margins"
        title="Notes"
        lede="Half-thoughts, research, and scenes that haven't found their chapter yet."
        actions={
          <Button onClick={() => guard(() => toast.success("New note created."))}>
            <Plus className="size-4" /> New note
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1.5 pb-6">
        {kinds.map((k) => (
          <button
            key={k.key}
            aria-pressed={kind === k.key}
            onClick={() => setKind(k.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              kind === k.key
                ? "border-gold/50 bg-gold/12 text-gold"
                : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      {q.isError ? <ErrorState message="Notes didn't load." retry={() => q.refetch()} /> : null}

      {q.isLoading ? (
        <ListSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Notes you write for this kind will collect here." />
      ) : (
        <div className="space-y-6">
          {pinned.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {pinned.map((n) => (
                <NoteCard key={n.id} note={n} pinnedStyle />
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  pinnedStyle,
}: {
  note: import("@/types/lorebound").Note;
  pinnedStyle?: boolean;
}) {
  return (
    <Panel className={cn("p-5", pinnedStyle && "border-gold/35")}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg leading-snug text-foreground">{note.title}</h2>
        {note.pinned ? <Pin className="size-3.5 shrink-0 text-gold" aria-label="Pinned" /> : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {note.links.map((l) => (
          <Badge key={`${l.kind}-${l.id}`} variant="outline" className="border-border/70 text-muted-foreground">
            {l.label}
          </Badge>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{note.updatedLabel}</p>
    </Panel>
  );
}
