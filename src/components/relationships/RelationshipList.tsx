import { ChevronRight, UserRound } from "lucide-react";
import {
  KIND_META,
  type Character,
  type Relationship,
} from "@/lib/lore-data";

function Portrait({ character }: { character: Character }) {
  if (!character.portrait) {
    return (
      <span className="grid size-full place-items-center bg-surface-raised text-muted-foreground">
        <UserRound className="size-4" />
      </span>
    );
  }

  return (
    <img
      src={character.portrait}
      alt={`Portrait of ${character.name}`}
      loading="lazy"
      className="block size-full object-cover object-top"
    />
  );
}

export function RelationshipList({
  relationships,
  characters,
  onSelect,
}: {
  relationships: Relationship[];
  characters: Record<string, Character>;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-surface/40 shadow-[var(--shadow-archive)] backdrop-blur-sm">
      {relationships.map((relationship) => {
        const source = characters[relationship.source];
        const target = characters[relationship.target];

        if (!source || !target) return null;

        const metadata = KIND_META[relationship.kind];

        return (
          <li key={relationship.id}>
            <button
              type="button"
              onClick={() => onSelect(relationship.id)}
              className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/40 sm:px-5"
            >
              <span
                className="h-11 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: metadata.color }}
              />

              <span className="flex shrink-0 -space-x-3">
                {[source, target].map((character) => (
                  <span
                    key={character.id}
                    className="block size-11 overflow-hidden rounded-full border-2 border-surface-raised bg-background"
                  >
                    <Portrait character={character} />
                  </span>
                ))}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-lg leading-tight text-foreground">
                  {source.name}{" "}
                  <span className="text-muted-foreground">&</span>{" "}
                  {target.name}
                </span>

                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {relationship.label} · {relationship.status}
                  {relationship.since &&
                  relationship.since !== "Unrecorded"
                    ? ` · since ${relationship.since}`
                    : ""}
                </span>
              </span>

              <span
                className="hidden shrink-0 rounded-full border px-2.5 py-1 text-[0.68rem] sm:block"
                style={{
                  color: metadata.color,
                  borderColor: `color-mix(in oklab, ${metadata.color} 45%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${metadata.color} 10%, transparent)`,
                }}
              >
                {metadata.label}
              </span>

              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function RelationshipSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading relationships">
      <div className="h-[34rem] animate-pulse rounded-xl border border-border/70 bg-surface/50 sm:h-[42rem]" />

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl border border-border/70 bg-surface/50"
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function RelationshipEmpty({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="starfield grid place-items-center rounded-xl border border-dashed border-border bg-surface/30 px-6 py-24 text-center">
      <div className="relative max-w-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-gold/35 bg-gold/10">
          <span className="font-display text-2xl text-gold">∞</span>
        </div>

        <h2 className="mt-5 font-display text-3xl text-foreground">
          No bonds traced yet.
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Every world begins with two names and the thread between them.
          Draw the first one.
        </p>

        <button
          type="button"
          onClick={onAdd}
          className="mt-6 rounded-md border border-gold/50 bg-gold/15 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/25"
        >
          Add relationship
        </button>
      </div>
    </div>
  );
}