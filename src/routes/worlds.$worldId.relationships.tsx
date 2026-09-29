import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { List, Map as MapIcon, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { RelationshipDrawer } from "@/components/relationships/RelationshipDrawer";
import {
  RelationshipEmpty,
  RelationshipList,
  RelationshipSkeleton,
} from "@/components/relationships/RelationshipList";
import { RelationshipMap } from "@/components/relationships/RelationshipMap";
import { RelationshipModal } from "@/components/relationships/RelationshipModal";

import {
  DATABASE_TO_UI_STATUS,
  KIND_META,
  KIND_ORDER,
  UI_TO_DATABASE_STATUS,
  type Character as UiCharacter,
  type Relationship as UiRelationship,
  type RelationshipKind,
} from "@/lib/lore-data";
import { cn } from "@/lib/utils";
import {
  listCharacters,
  type Character as DatabaseCharacter,
} from "@/services/characters";
import {
  createRelationship,
  deleteRelationship,
  listRelationships,
  updateRelationship,
  type CharacterRelationship,
  type SaveRelationshipInput,
} from "@/services/relationships";

export const Route = createFileRoute("/worlds/$worldId/relationships")({
  component: RelationshipsPage,
});

type ViewMode = "map" | "list";

const fallbackPortrait = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#253249"/>
        <stop offset="1" stop-color="#080d17"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#background)"/>
    <circle cx="400" cy="300" r="125" fill="#caa55b" opacity=".35"/>
    <path d="M170 760c30-190 140-280 230-280s200 90 230 280" fill="#caa55b" opacity=".35"/>
  </svg>
`)}`;

function positionCharacters(
  characters: DatabaseCharacter[],
): UiCharacter[] {
  if (characters.length === 0) return [];

  if (characters.length === 1) {
    const character = characters[0];

    return [
      {
        id: character.id,
        name: character.name,
        role: character.role || "Role not set",
        portrait: character.portraitUrl || fallbackPortrait,
        x: 50,
        y: 50,
      },
    ];
  }

  return characters.map((character, index) => {
    const angle =
      -Math.PI / 2 + (index * Math.PI * 2) / characters.length;

    return {
      id: character.id,
      name: character.name,
      role: character.role || "Role not set",
      portrait: character.portraitUrl || fallbackPortrait,
      x: 50 + Math.cos(angle) * 39,
      y: 50 + Math.sin(angle) * 36,
    };
  });
}

function toUiRelationship(
  relationship: CharacterRelationship,
): UiRelationship {
  const sourceLabel = relationship.sourceLabel.trim();
  const targetLabel = relationship.targetLabel.trim();

  let label = KIND_META[relationship.category].label;

  if (sourceLabel && targetLabel && sourceLabel !== targetLabel) {
    label = `${sourceLabel} · ${targetLabel}`;
  } else if (sourceLabel || targetLabel) {
    label = sourceLabel || targetLabel;
  }

  return {
    id: relationship.id,
    source: relationship.sourceCharacterId,
    target: relationship.targetCharacterId,
    kind: relationship.category,
    label,
    status: DATABASE_TO_UI_STATUS[relationship.status],
    since: "Unrecorded",
    summary: relationship.description,
    beats: [],
  };
}

function RelationshipsPage() {
  const { worldId } = Route.useParams();
  const queryClient = useQueryClient();

  const [view, setView] = useState<ViewMode>("map");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<RelationshipKind | "all">("all");
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null,
  );
  const [selectedRelationship, setSelectedRelationship] = useState<
    string | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UiRelationship | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const charactersQuery = useQuery({
    queryKey: ["characters", worldId],
    queryFn: () => listCharacters(worldId),
  });

  const relationshipsQuery = useQuery({
    queryKey: ["relationships", worldId],
    queryFn: () => listRelationships(worldId),
  });

  const databaseCharacters = charactersQuery.data ?? [];
  const databaseRelationships = relationshipsQuery.data ?? [];

  const characters = useMemo(
    () => positionCharacters(databaseCharacters),
    [databaseCharacters],
  );

  const relationships = useMemo(
    () => databaseRelationships.map(toUiRelationship),
    [databaseRelationships],
  );

  const charactersById = useMemo(
    () =>
      Object.fromEntries(
        characters.map((character) => [character.id, character]),
      ),
    [characters],
  );

  const selected =
    relationships.find(
      (relationship) => relationship.id === selectedRelationship,
    ) ?? null;

  const filteredRelationships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return relationships.filter((relationship) => {
      if (category !== "all" && relationship.kind !== category) {
        return false;
      }

      if (!query) return true;

      const source = charactersById[relationship.source];
      const target = charactersById[relationship.target];

      return [
        source?.name,
        target?.name,
        relationship.label,
        relationship.summary,
        relationship.status,
        relationship.kind,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [relationships, charactersById, category, search]);

  const visibleCharacterIds = useMemo(
    () =>
      new Set(
        filteredRelationships.flatMap((relationship) => [
          relationship.source,
          relationship.target,
        ]),
      ),
    [filteredRelationships],
  );

  const visibleCharacters =
    category === "all" && !search.trim()
      ? characters
      : characters.filter((character) =>
          visibleCharacterIds.has(character.id),
        );

  async function saveRelationship(
        relationshipsToSave: UiRelationship[],
        ) {
        if (saving || relationshipsToSave.length === 0) {
            return;
        }

        setSaving(true);

        try {
            const toInput = (
            relationship: UiRelationship,
            ): SaveRelationshipInput => ({
            worldId,
            sourceCharacterId: relationship.source,
            targetCharacterId: relationship.target,
            category: relationship.kind,
            sourceLabel: relationship.label,
            targetLabel: relationship.label,
            description: relationship.summary,
            status:
                UI_TO_DATABASE_STATUS[relationship.status],
            strength: 3,
            });

            if (editing) {
            const relationship = relationshipsToSave[0];

            await updateRelationship(
                editing.id,
                toInput(relationship),
            );

            toast.success("Relationship updated.");
            } else {
            const newRelationships =
                relationshipsToSave.filter((relationship) => {
                return !databaseRelationships.some(
                    (existing) => {
                    const sameDirection =
                        existing.sourceCharacterId ===
                        relationship.source &&
                        existing.targetCharacterId ===
                        relationship.target;

                    const reverseDirection =
                        existing.sourceCharacterId ===
                        relationship.target &&
                        existing.targetCharacterId ===
                        relationship.source;

                    return sameDirection || reverseDirection;
                    },
                );
                });

            if (newRelationships.length === 0) {
                toast.error(
                "Those relationships already exist.",
                );
                return;
            }

            await Promise.all(
                newRelationships.map((relationship) =>
                createRelationship(toInput(relationship)),
                ),
            );

            const skipped =
                relationshipsToSave.length -
                newRelationships.length;

            toast.success(
                skipped > 0
                ? `${newRelationships.length} relationships added. ${skipped} existing relationship${skipped === 1 ? " was" : "s were"} skipped.`
                : `${newRelationships.length} relationship${newRelationships.length === 1 ? "" : "s"} added.`,
            );
            }

            await queryClient.invalidateQueries({
            queryKey: ["relationships", worldId],
            });

            setModalOpen(false);
            setEditing(null);
        } catch (error) {
            toast.error(
            error instanceof Error
                ? error.message
                : "The relationships could not be saved.",
            );
        } finally {
            setSaving(false);
        }
    }

  async function removeRelationship(relationship: UiRelationship) {
    if (deleting) return;

    const source = charactersById[relationship.source];
    const target = charactersById[relationship.target];

    const confirmed = window.confirm(
      `Delete the relationship between ${
        source?.name ?? "this character"
      } and ${target?.name ?? "this character"}?`,
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await deleteRelationship(relationship.id, worldId);

      await queryClient.invalidateQueries({
        queryKey: ["relationships", worldId],
      });

      setSelectedRelationship(null);
      toast.success("Relationship deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The relationship could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function openCreateModal() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEditModal(relationship: UiRelationship) {
    setSelectedRelationship(null);
    setEditing(relationship);
    setModalOpen(true);
  }

  const loading =
    charactersQuery.isLoading || relationshipsQuery.isLoading;

  const error = charactersQuery.error ?? relationshipsQuery.error;

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl">
            The relationship archive could not be opened.
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Please try loading the page again."}
          </p>

          <button
            type="button"
            onClick={() => {
              void charactersQuery.refetch();
              void relationshipsQuery.refetch();
            }}
            className="mt-5 rounded-md border border-gold/50 bg-gold/15 px-4 py-2 text-sm text-gold"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background/20 px-4 py-8 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-gold">
              Connections
            </p>

            <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">
              Relationships
            </h1>

            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Trace the loyalties, rivalries, bloodlines, and bonds shaping
              this world.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={characters.length < 2}
            className="flex w-fit items-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" />
            Add relationship
          </button>
        </header>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search relationships</span>

              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search names, bonds, or status..."
                className="h-11 w-full rounded-full border border-input bg-background/60 pl-10 pr-4 text-sm outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
              />
            </label>

            <div className="flex w-fit rounded-full border border-border bg-background/60 p-1">
              <button
                type="button"
                onClick={() => setView("map")}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-xs",
                  view === "map"
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground",
                )}
              >
                <MapIcon className="size-3.5" />
                Map
              </button>

              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-xs",
                  view === "list"
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground",
                )}
              >
                <List className="size-3.5" />
                List
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs",
                category === "all"
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-border text-muted-foreground",
              )}
            >
              All bonds
            </button>

            {KIND_ORDER.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setCategory(kind)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                  category === kind
                    ? "text-foreground"
                    : "border-border text-muted-foreground",
                )}
                style={
                  category === kind
                    ? {
                        borderColor: KIND_META[kind].color,
                        backgroundColor: `color-mix(in oklab, ${KIND_META[kind].color} 12%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: KIND_META[kind].color }}
                />
                {KIND_META[kind].label}
              </button>
            ))}
          </div>
        </div>

        <main className="mt-7">
          {loading ? (
            <RelationshipSkeleton />
          ) : characters.length < 2 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-24 text-center">
              <h2 className="font-display text-3xl">
                Every bond begins with two people.
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Add at least two characters before creating relationships.
              </p>
            </div>
          ) : relationships.length === 0 ? (
            <RelationshipEmpty onAdd={openCreateModal} />
          ) : filteredRelationships.length === 0 ? (
            <div className="rounded-xl border border-border px-6 py-20 text-center">
              <h2 className="font-display text-2xl">
                No connections match.
              </h2>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="mt-3 text-sm text-gold hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : view === "map" ? (
            <RelationshipMap
              characters={visibleCharacters}
              relationships={filteredRelationships}
              selectedCharacter={selectedCharacter}
              selectedRelationship={selectedRelationship}
              onSelectCharacter={setSelectedCharacter}
              onSelectRelationship={setSelectedRelationship}
            />
          ) : (
            <RelationshipList
              relationships={filteredRelationships}
              characters={charactersById}
              onSelect={setSelectedRelationship}
            />
          )}
        </main>
      </div>

      <RelationshipDrawer
        relationship={selected}
        characters={charactersById}
        deleting={deleting}
        onClose={() => setSelectedRelationship(null)}
        onEdit={openEditModal}
        onDelete={(relationship) => {
          void removeRelationship(relationship);
        }}
      />

      <RelationshipModal
        open={modalOpen}
        editing={editing}
        characters={characters}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
        onSave={(relationship) => {
          void saveRelationship(relationship);
        }}
      />
    </div>
  );
}