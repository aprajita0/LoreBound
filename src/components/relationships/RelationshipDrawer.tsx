import {
  ArrowLeftRight,
  Loader2,
  Pencil,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  KIND_META,
  type Character,
  type Relationship,
} from "@/lib/lore-data";
import { cn } from "@/lib/utils";

interface Props {
  relationship: Relationship | null;
  characters: Record<string, Character>;
  deleting?: boolean;
  onClose: () => void;
  onEdit: (relationship: Relationship) => void;
  onDelete: (relationship: Relationship) => void;
}

function Portrait({ character }: { character: Character }) {
  if (!character.portrait) {
    return (
      <span className="grid size-full place-items-center bg-surface-raised text-muted-foreground">
        <UserRound className="size-6" />
      </span>
    );
  }

  return (
    <img
      src={character.portrait}
      alt={`Portrait of ${character.name}`}
      className="block size-full object-cover object-top"
    />
  );
}

function CharacterSummary({
  character,
}: {
  character: Character;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span className="block size-20 overflow-hidden rounded-full border border-border bg-background">
        <Portrait character={character} />
      </span>

      <span className="mt-2 max-w-full truncate font-display text-lg text-foreground">
        {character.name}
      </span>

      <span className="mt-0.5 max-w-full truncate text-[0.68rem] text-muted-foreground">
        {character.role || "Role not set"}
      </span>
    </div>
  );
}

export function RelationshipDrawer({
  relationship,
  characters,
  deleting = false,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const source = relationship
    ? characters[relationship.source]
    : undefined;

  const target = relationship
    ? characters[relationship.target]
    : undefined;

  const open = Boolean(relationship && source && target);

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px] transition-opacity duration-300",
          open
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[430px] flex-col border-l border-border bg-surface-raised shadow-[var(--shadow-archive)] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {relationship && source && target ? (
          <>
            <header className="flex items-start justify-between border-b border-border/70 p-6">
              <div className="min-w-0 pr-4">
                <p
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color: KIND_META[relationship.kind].color,
                  }}
                >
                  {KIND_META[relationship.kind].label}
                </p>

                <h2 className="mt-2 break-words font-display text-3xl leading-tight text-foreground">
                  {relationship.label}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close relationship details"
                className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 space-y-7 overflow-y-auto p-6">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <CharacterSummary character={source} />

                <ArrowLeftRight
                  className="size-5 text-gold"
                  aria-hidden
                />

                <CharacterSummary character={target} />
              </div>

              <div className="h-px bg-border/70" />

              <dl className="grid grid-cols-2 gap-5">
                <div>
                  <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </dt>

                  <dd className="mt-1 font-display text-lg text-foreground">
                    {relationship.status}
                  </dd>
                </div>

                <div>
                  <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Since
                  </dt>

                  <dd className="mt-1 font-display text-lg text-foreground">
                    {relationship.since || "Unrecorded"}
                  </dd>
                </div>
              </dl>

              <section>
                <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                  The bond
                </h3>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {relationship.summary ||
                    "No notes have been recorded for this relationship yet."}
                </p>
              </section>

              {relationship.beats.length > 0 ? (
                <section>
                  <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Story beats
                  </h3>

                  <ul className="mt-3 space-y-3">
                    {relationship.beats.map((beat, index) => (
                      <li
                        key={`${beat}-${index}`}
                        className="flex gap-3 text-sm leading-6"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                        <span className="text-muted-foreground">
                          {beat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <footer className="flex gap-2 border-t border-border/70 p-5">
              <button
                type="button"
                onClick={() => onEdit(relationship)}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gold/45 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
              >
                <Pencil className="size-3.5" />
                Edit relationship
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => onDelete(relationship)}
                className="rounded-md border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Delete relationship"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </footer>
          </>
        ) : null}
      </aside>
    </>
  );
}