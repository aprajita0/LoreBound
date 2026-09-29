import { useMemo } from "react";
import { UserRound } from "lucide-react";
import {
  KIND_META,
  type Character,
  type Relationship,
} from "@/lib/lore-data";
import { cn } from "@/lib/utils";

const WIDTH = 1000;
const HEIGHT = 700;

interface Props {
  characters: Character[];
  relationships: Relationship[];
  selectedCharacter: string | null;
  selectedRelationship: string | null;
  onSelectCharacter: (id: string | null) => void;
  onSelectRelationship: (id: string) => void;
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
      draggable={false}
      className="block size-full object-cover object-top"
    />
  );
}

export function RelationshipMap({
  characters,
  relationships,
  selectedCharacter,
  selectedRelationship,
  onSelectCharacter,
  onSelectRelationship,
}: Props) {
  const charactersById = useMemo(
    () => new Map(characters.map((character) => [character.id, character])),
    [characters],
  );

  const visibleEdges = relationships.filter(
    (relationship) =>
      charactersById.has(relationship.source) &&
      charactersById.has(relationship.target),
  );

  function relationshipIsDimmed(relationship: Relationship) {
    return (
      selectedCharacter !== null &&
      relationship.source !== selectedCharacter &&
      relationship.target !== selectedCharacter
    );
  }

  function characterIsDimmed(characterId: string) {
    if (!selectedCharacter || selectedCharacter === characterId) {
      return false;
    }

    return !visibleEdges.some(
      (relationship) =>
        (relationship.source === selectedCharacter &&
          relationship.target === characterId) ||
        (relationship.target === selectedCharacter &&
          relationship.source === characterId),
    );
  }

  return (
    <div
      className="relative min-h-[34rem] w-full overflow-hidden rounded-xl border border-border/80 bg-surface/40 shadow-[var(--shadow-archive)] backdrop-blur-sm sm:min-h-[42rem]"
      onClick={() => onSelectCharacter(null)}
    >
      <div className="starfield pointer-events-none absolute inset-0 opacity-90" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(61,122,121,0.09),transparent_42%),radial-gradient(circle_at_78%_18%,rgba(128,91,164,0.07),transparent_32%)]" />

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        {visibleEdges.map((relationship) => {
          const source = charactersById.get(relationship.source)!;
          const target = charactersById.get(relationship.target)!;

          const x1 = (source.x / 100) * WIDTH;
          const y1 = (source.y / 100) * HEIGHT;
          const x2 = (target.x / 100) * WIDTH;
          const y2 = (target.y / 100) * HEIGHT;

          const middleX = (x1 + x2) / 2;
          const middleY = (y1 + y2) / 2;

          const metadata = KIND_META[relationship.kind];
          const active = selectedRelationship === relationship.id;
          const dimmed = relationshipIsDimmed(relationship);

          const displayLabel =
            relationship.label.length > 27
              ? `${relationship.label.slice(0, 25)}…`
              : relationship.label;

          const labelWidth = Math.max(78, displayLabel.length * 7 + 22);

          return (
            <g
              key={relationship.id}
              className="cursor-pointer transition-opacity duration-300"
              style={{ opacity: dimmed ? 0.12 : 1 }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectRelationship(relationship.id);
              }}
            >
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={24}
              />

              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={metadata.color}
                strokeWidth={active ? 2.8 : 1.5}
                strokeDasharray={metadata.dash}
                opacity={active ? 1 : 0.68}
                className="transition-all duration-300"
              />

              {active ? (
                <g className="pointer-events-none">
                  <rect
                    x={middleX - labelWidth / 2}
                    y={middleY - 13}
                    width={labelWidth}
                    height={26}
                    rx={13}
                    fill="var(--surface-raised)"
                    stroke={metadata.color}
                    strokeOpacity={0.9}
                  />

                  <text
                    x={middleX}
                    y={middleY + 4}
                    textAnchor="middle"
                    fontSize={11}
                    letterSpacing="0.03em"
                    fill={metadata.color}
                  >
                    {displayLabel}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>

      {characters.map((character) => {
        const active = selectedCharacter === character.id;

        return (
          <button
            key={character.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectCharacter(active ? null : character.id);
            }}
            className={cn(
              "group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 transition-all duration-300",
              characterIsDimmed(character.id)
                ? "opacity-20"
                : "opacity-100",
            )}
            style={{
              left: `${character.x}%`,
              top: `${character.y}%`,
            }}
            aria-label={`Show ${character.name}'s relationships`}
          >
            <span
              className={cn(
                "block size-16 overflow-hidden rounded-full border-2 bg-background p-0.5 shadow-lg transition-all sm:size-[4.75rem]",
                active
                  ? "border-gold shadow-[0_0_0_6px_color-mix(in_oklab,var(--gold)_15%,transparent)]"
                  : "border-border group-hover:border-gold/70",
              )}
            >
              <span className="block size-full overflow-hidden rounded-full">
                <Portrait character={character} />
              </span>
            </span>

            <span className="max-w-36 text-center">
              <span className="block truncate font-display text-sm text-foreground sm:text-base">
                {character.name}
              </span>

              <span className="mt-0.5 block truncate text-[0.64rem] tracking-wide text-muted-foreground">
                {character.role || "Role not set"}
              </span>
            </span>
          </button>
        );
      })}

      {selectedCharacter ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelectCharacter(null);
          }}
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-surface-raised/95 px-4 py-2 text-xs text-muted-foreground shadow-lg transition-colors hover:text-foreground"
        >
          Show every connection
        </button>
      ) : null}
    </div>
  );
}