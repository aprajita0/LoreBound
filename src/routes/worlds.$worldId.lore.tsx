import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BookOpen,
  Church,
  Dna,
  Feather,
  Gem,
  History,
  Loader2,
  Orbit,
  PawPrint,
  Plus,
  Search,
  Shield,
  Sparkles,
  Star,
  Users,
  WandSparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoreEntryModal } from "@/components/lore/LoreEntryModal";
import { LoreEntryDrawer } from "@/components/lore/LoreEntryDrawer";
import {
  deleteLoreEntry,
  getLoreCategoryLabel,
  getLoreEntry,
  getLoreStatusLabel,
  listLoreEntries,
  type LoreCategory,
  type LoreEntry,
  type LoreStatus,
} from "@/services/lore";
import { listPlaces } from "@/services/places";

export const Route = createFileRoute(
  "/worlds/$worldId/lore",
)({
  component: LorePage,
});

interface CharacterOption {
  id: string;
  name: string;
  role: string;
}

interface CharacterRow {
  id: string;
  name: string;
  role: string | null;
}

interface WorldRow {
  id: string;
  title: string;
}

type StatusFilter = "all" | LoreStatus;
type CategoryFilter = "all" | LoreCategory;

const ARCHIVE_DIVISIONS: Array<{
  category: LoreCategory;
  numeral: string;
  description: string;
}> = [
  {
    category: "magic",
    numeral: "I",
    description:
      "Laws, costs, and forbidden workings",
  },
  {
    category: "culture",
    numeral: "II",
    description:
      "Customs, tongues, and courtesies",
  },
  {
    category: "religion",
    numeral: "III",
    description:
      "Gods kept, gods abandoned",
  },
  {
    category: "faction",
    numeral: "IV",
    description:
      "Thrones, orders, and quiet cabals",
  },
  {
    category: "bloodline",
    numeral: "V",
    description:
      "Inheritance written in the body",
  },
  {
    category: "artifact",
    numeral: "VI",
    description:
      "Objects that remember their makers",
  },
  {
    category: "history",
    numeral: "VII",
    description:
      "What happened, and what was agreed upon",
  },
  {
    category: "creature",
    numeral: "VIII",
    description:
      "Beasts, familiars, and worse",
  },
  {
    category: "cosmology",
    numeral: "IX",
    description:
      "The shape and edges of the world",
  },
];

const STATUS_TABS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All records",
  },
  {
    value: "canonical",
    label: "Canonical",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "retired",
    label: "Retired",
  },
];

async function listCharacterOptions(
  worldId: string,
): Promise<CharacterOption[]> {
  const { data, error } = await supabase
    .from("characters")
    .select("id, name, role")
    .eq("world_id", worldId)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data ?? []) as CharacterRow[]
  ).map((character) => ({
    id: character.id,
    name: character.name,
    role: character.role ?? "",
  }));
}

async function getWorldTitle(
  worldId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("worlds")
    .select("id, title")
    .eq("id", worldId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const world = data as WorldRow;

  return (
    world.title.trim() || "Untitled World"
  );
}

function LorePage() {
  const { worldId } = Route.useParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<CategoryFilter>("all");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [selectedEntry, setSelectedEntry] =
    useState<LoreEntry | null>(null);

  const [editingEntry, setEditingEntry] =
    useState<LoreEntry | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [
    openingEntryId,
    setOpeningEntryId,
  ] = useState<string | null>(null);

  const loreQuery = useQuery({
    queryKey: ["lore", worldId],
    queryFn: () =>
      listLoreEntries(worldId),
  });

  const placesQuery = useQuery({
    queryKey: ["places", worldId],
    queryFn: () => listPlaces(worldId),
  });

  const charactersQuery = useQuery({
    queryKey: [
      "character-options",
      worldId,
    ],
    queryFn: () =>
      listCharacterOptions(worldId),
  });

  const worldQuery = useQuery({
    queryKey: ["world-title", worldId],
    queryFn: () => getWorldTitle(worldId),
  });

  const entries = loreQuery.data ?? [];
  const places = placesQuery.data ?? [];

  const characters =
    charactersQuery.data ?? [];

  const worldTitle =
    worldQuery.data ?? "Untitled World";

  const filteredEntries = useMemo(() => {
    const needle =
      search.trim().toLowerCase();

    return entries.filter((entry) => {
      const searchable = [
        entry.title,
        entry.summary,
        entry.plainText,
        ...entry.tags,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!needle ||
          searchable.includes(needle)) &&
        (categoryFilter === "all" ||
          entry.category ===
            categoryFilter) &&
        (statusFilter === "all" ||
          entry.status === statusFilter)
      );
    });
  }, [
    categoryFilter,
    entries,
    search,
    statusFilter,
  ]);

  const coverEntry =
    filteredEntries.find(
      (entry) => entry.isFeatured,
    ) ??
    filteredEntries[0] ??
    null;

  function openCreateModal() {
    setEditingEntry(null);
    setModalOpen(true);
  }

  function openEditModal(
    entry: LoreEntry,
  ) {
    setSelectedEntry(null);
    setEditingEntry(entry);
    setModalOpen(true);
  }

  async function openEntry(
    entryId: string,
  ) {
    setOpeningEntryId(entryId);

    try {
      const fullEntry =
        await getLoreEntry(
          worldId,
          entryId,
        );

      setSelectedEntry(fullEntry);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "The record could not be opened.",
      );
    } finally {
      setOpeningEntryId(null);
    }
  }

  async function handleDelete(
    entry: LoreEntry,
  ) {
    const confirmed = window.confirm(
      `Delete “${entry.title}”? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteLoreEntry(
        entry.id,
        worldId,
      );

      setSelectedEntry(null);

      await queryClient.invalidateQueries({
        queryKey: ["lore", worldId],
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "The record could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const loading =
    loreQuery.isLoading ||
    placesQuery.isLoading ||
    charactersQuery.isLoading ||
    worldQuery.isLoading;

  const queryError =
    loreQuery.error ??
    placesQuery.error ??
    charactersQuery.error ??
    worldQuery.error;

  if (loading) {
    return <ArchiveLoading />;
  }

  if (queryError) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6 text-center">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-gold">
            Archive unavailable
          </p>

          <h1 className="mt-3 font-serif text-3xl text-foreground">
            The archive would not open.
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            {queryError instanceof Error
              ? queryError.message
              : "Something went wrong."}
          </p>

          <button
            type="button"
            onClick={() => {
              void Promise.all([
                loreQuery.refetch(),
                placesQuery.refetch(),
                charactersQuery.refetch(),
                worldQuery.refetch(),
              ]);
            }}
            className="mt-6 border border-gold/40 px-5 py-2 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="lore-archive relative min-h-screen overflow-hidden bg-background text-foreground">
        <ArchiveAtmosphere />

        <div className="relative mx-auto max-w-[1180px] px-6 pb-28 pt-12 lg:px-10 lg:pt-16">
          <header className="border-b border-gold/25 pb-11">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-gold">
              The Lorebound Archive
            </p>

            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-serif text-5xl leading-none tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[4.8rem]">
                  Lore of {worldTitle}
                </h1>

                <p className="mt-5 max-w-3xl font-serif text-base italic leading-7 text-muted-foreground/80">
                  A private record of histories,
                  bloodlines, beliefs, places, and
                  things the world has almost
                  forgotten.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-5">
                <span className="text-xs text-muted-foreground">
                  {entries.length} records archived
                </span>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="group inline-flex items-center gap-3 border border-gold/55 bg-gold/[0.08] px-5 py-3 text-xs font-semibold text-gold transition hover:bg-gold hover:text-background"
                >
                  <Feather className="size-4" />
                  Create new entry
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-6 py-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="group relative block max-w-3xl border-b border-border pb-3 focus-within:border-gold/70">
              <Search className="absolute left-0 top-1 size-4 text-gold/85" />

              <span className="sr-only">
                Search the archive
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search names, histories, artifacts, beliefs..."
                className="w-full bg-transparent pl-8 font-serif text-lg text-foreground outline-none placeholder:text-muted-foreground/55"
              />
            </label>

            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(tab.value)
                  }
                  className={`border-b pb-2 text-[0.67rem] uppercase tracking-[0.18em] transition ${
                    statusFilter === tab.value
                      ? "border-gold text-gold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {filteredEntries.length === 0 ? (
            <EmptyArchive
              hasEntries={
                entries.length > 0
              }
              onCreate={openCreateModal}
            />
          ) : (
            <>
              {coverEntry && (
                <section className="mt-8">
                  <SectionEyebrow>
                    The cover record
                  </SectionEyebrow>

                  <CoverRecord
                    entry={coverEntry}
                    loading={
                      openingEntryId ===
                      coverEntry.id
                    }
                    onOpen={() => {
                      void openEntry(
                        coverEntry.id,
                      );
                    }}
                  />
                </section>
              )}

              <section className="mt-20">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <SectionEyebrow>
                      Explore the archive
                    </SectionEyebrow>

                    <h2 className="mt-3 font-serif text-3xl text-foreground">
                      Nine divisions of the archive
                    </h2>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Choose a division to narrow the
                    archive
                  </p>
                </div>

                <div className="mt-8 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
                  {ARCHIVE_DIVISIONS.map(
                    (division) => {
                      const active =
                        categoryFilter ===
                        division.category;

                      const count =
                        entries.filter(
                          (entry) =>
                            entry.category ===
                            division.category,
                        ).length;

                      return (
                        <button
                          key={
                            division.category
                          }
                          type="button"
                          onClick={() =>
                            setCategoryFilter(
                              active
                                ? "all"
                                : division.category,
                            )
                          }
                          className={`group relative min-h-32 border-b border-r border-border px-5 py-5 text-left transition ${
                            active
                              ? "bg-gold/[0.09]"
                              : "hover:bg-foreground/[0.025]"
                          }`}
                        >
                          <span className="absolute left-5 top-5 font-serif text-xs text-muted-foreground/50">
                            {division.numeral}
                          </span>

                          <span className="absolute right-5 top-5 flex items-center gap-3 text-[0.65rem] tracking-[0.2em] text-muted-foreground">
                            {count
                              ? String(
                                  count,
                                ).padStart(
                                  2,
                                  "0",
                                )
                              : "—"}

                            <CategoryIcon
                              category={
                                division.category
                              }
                              className="size-4 opacity-55 transition group-hover:text-gold group-hover:opacity-100"
                            />
                          </span>

                          <h3 className="ml-11 mt-5 font-serif text-lg text-foreground transition group-hover:text-gold">
                            {getLoreCategoryLabel(
                              division.category,
                            )}
                          </h3>

                          <p className="ml-11 mt-2 text-xs leading-5 text-muted-foreground">
                            {
                              division.description
                            }
                          </p>
                        </button>
                      );
                    },
                  )}
                </div>
              </section>

              <section className="mt-20">
                <div className="flex items-end justify-between border-b border-gold/25 pb-7">
                  <div>
                    <SectionEyebrow>
                      The collection
                    </SectionEyebrow>

                    <h2 className="mt-3 font-serif text-3xl text-foreground">
                      Everything gathered so far
                    </h2>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {filteredEntries.length} records
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {filteredEntries.map(
                    (entry, index) => (
                      <ArchiveCard
                        key={entry.id}
                        entry={entry}
                        index={index}
                        loading={
                          openingEntryId ===
                          entry.id
                        }
                        onOpen={() => {
                          void openEntry(
                            entry.id,
                          );
                        }}
                      />
                    ),
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <LoreEntryDrawer
        entry={selectedEntry}
        entries={entries}
        characters={characters}
        places={places}
        deleting={deleting}
        onClose={() =>
          setSelectedEntry(null)
        }
        onEdit={openEditModal}
        onDelete={(entry) => {
          void handleDelete(entry);
        }}
        onSelectEntry={(entry) => {
          void openEntry(entry.id);
        }}
      />

      <LoreEntryModal
        open={modalOpen}
        worldId={worldId}
        entry={editingEntry}
        entries={entries}
        characters={characters}
        places={places}
        onClose={() => {
          setModalOpen(false);
          setEditingEntry(null);
        }}
        onSaved={(savedEntry) => {
          setSelectedEntry(savedEntry);

          void queryClient.invalidateQueries({
            queryKey: ["lore", worldId],
          });
        }}
      />
    </>
  );
}

function ArchiveAtmosphere() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(17,93,91,0.13),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(78,55,114,0.15),transparent_34%)]" />

      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(204,169,95,0.5)_0_1px,transparent_1.4px)] [background-position:0_0] [background-size:173px_149px]" />

      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-foreground/[0.018] to-transparent" />
    </div>
  );
}

function CoverRecord({
  entry,
  loading,
  onOpen,
}: {
  entry: LoreEntry;
  loading: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative mt-7 block w-full pb-8 text-left lg:pb-12"
    >
      <div className="relative h-[430px] overflow-hidden border border-border bg-muted lg:mr-[34%] lg:h-[510px]">
        {entry.imagePath ? (
          <img
            src={entry.imagePath}
            alt=""
            className="h-full w-full object-cover transition duration-1000 group-hover:scale-[1.025]"
          />
        ) : (
          <LoreFallback
            category={entry.category}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-black/10" />
      </div>

      <div className="relative -mt-20 ml-auto w-[92%] border border-border bg-card/95 p-7 shadow-2xl backdrop-blur sm:w-[78%] lg:absolute lg:right-0 lg:top-14 lg:mt-0 lg:w-[43%] lg:p-10">
        <EntryKicker entry={entry} />

        <h2 className="mt-6 font-serif text-3xl leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
          {entry.title}
        </h2>

        {entry.summary && (
          <p className="mt-4 font-serif text-sm italic leading-6 text-gold/75">
            {entry.summary}
          </p>
        )}

        <p className="mt-5 line-clamp-4 text-sm leading-7 text-muted-foreground">
          {excerptFor(entry)}
        </p>

        <TagList
          tags={entry.tags}
          limit={5}
          className="mt-6"
        />

        <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
          <span className="text-[0.68rem] text-muted-foreground">
            Revised{" "}
            {formatDate(entry.updatedAt)}
          </span>

          <span className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold">
            Read the record
            <span aria-hidden="true">
              →
            </span>
          </span>
        </div>
      </div>

      {loading && <LoadingVeil />}
    </button>
  );
}

function ArchiveCard({
  entry,
  index,
  loading,
  onOpen,
}: {
  entry: LoreEntry;
  index: number;
  loading: boolean;
  onOpen: () => void;
}) {
  const pattern = index % 6;
  const wide =
    pattern === 0 || pattern === 3;
  const reverse = pattern === 3;

  const span = wide
    ? "lg:col-span-7"
    : "lg:col-span-5";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative overflow-hidden border border-border bg-card/25 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold/45 hover:bg-card/55 ${span}`}
    >
      <article
        className={
          wide && entry.imagePath
            ? `grid min-h-[390px] md:grid-cols-2 ${
                reverse
                  ? "[direction:rtl]"
                  : ""
              }`
            : "flex min-h-[390px] flex-col"
        }
      >
        {entry.imagePath && (
          <div
            className={`relative overflow-hidden ${
              wide
                ? "min-h-72"
                : "h-52"
            }`}
          >
            <img
              src={entry.imagePath}
              alt=""
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-background/45 to-transparent" />
          </div>
        )}

        <div
          className={`flex flex-1 flex-col p-7 ${
            wide &&
            entry.imagePath &&
            reverse
              ? "[direction:ltr]"
              : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <EntryKicker entry={entry} />

            {entry.isFeatured && (
              <Star className="size-4 shrink-0 fill-gold text-gold" />
            )}
          </div>

          <h3 className="mt-6 font-serif text-2xl leading-tight text-foreground transition group-hover:text-gold">
            {entry.title}
          </h3>

          {entry.summary && (
            <p className="mt-3 font-serif text-sm italic leading-6 text-gold/65">
              {entry.summary}
            </p>
          )}

          <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">
            {excerptFor(entry)}
          </p>

          {entry.parentEntryId && (
            <p className="mt-4 text-xs text-muted-foreground">
              ↳ Part of another archive
              record
            </p>
          )}

          <TagList
            tags={entry.tags}
            limit={4}
            className="mt-auto pt-8"
          />

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[0.68rem] text-muted-foreground">
            <span>
              Revised{" "}
              {formatDate(entry.updatedAt)}
            </span>

            <span>
              {readingTime(entry.plainText)}{" "}
              min read
            </span>
          </div>
        </div>
      </article>

      {loading && <LoadingVeil />}
    </button>
  );
}

function EntryKicker({
  entry,
}: {
  entry: LoreEntry;
}) {
  return (
    <p className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
      <CategoryIcon
        category={entry.category}
        className="size-3.5"
      />

      {getLoreCategoryLabel(
        entry.category,
      )}

      <span className="h-3 w-px bg-gold/40" />

      <span
        className={
          entry.status === "draft"
            ? "text-cyan-300/75"
            : entry.status === "retired"
              ? "text-muted-foreground"
              : "text-gold"
        }
      >
        {getLoreStatusLabel(entry.status)}
      </span>
    </p>
  );
}

function TagList({
  tags,
  limit,
  className = "",
}: {
  tags: string[];
  limit: number;
  className?: string;
}) {
  if (!tags.length) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}
    >
      {tags
        .slice(0, limit)
        .map((tag) => (
          <span
            key={tag}
            className="text-xs text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
    </div>
  );
}

function LoreFallback({
  category,
}: {
  category: LoreCategory;
}) {
  return (
    <div className="flex h-full min-h-52 items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(201,164,92,0.18),transparent_25%),radial-gradient(circle_at_75%_65%,rgba(32,101,112,0.22),transparent_37%),linear-gradient(145deg,#121c2b,#070b13)]">
      <CategoryIcon
        category={category}
        className="size-16 text-gold/35"
      />
    </div>
  );
}

function EmptyArchive({
  hasEntries,
  onCreate,
}: {
  hasEntries: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="mt-16 border border-dashed border-border px-6 py-24 text-center">
      <BookOpen className="mx-auto size-10 text-gold/55" />

      <h2 className="mt-5 font-serif text-3xl text-foreground">
        {hasEntries
          ? "No record answers that search."
          : "The archive is waiting."}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {hasEntries
          ? "Try another phrase or return to all divisions."
          : "Begin with a bloodline, belief, creature, artifact, or forgotten history."}
      </p>

      {!hasEntries && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-7 inline-flex items-center gap-2 border border-gold/45 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
        >
          <Plus className="size-4" />
          Create the first record
        </button>
      )}
    </div>
  );
}

function ArchiveLoading() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto size-5 animate-spin text-gold" />

        <p className="mt-4 font-serif text-sm italic text-muted-foreground">
          Opening the world archive…
        </p>
      </div>
    </main>
  );
}

function LoadingVeil() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-sm">
      <Loader2 className="size-5 animate-spin text-gold" />
    </div>
  );
}

function SectionEyebrow({
  children,
}: {
  children: string;
}) {
  return (
    <p className="text-[0.67rem] font-semibold uppercase tracking-[0.27em] text-muted-foreground">
      {children}
    </p>
  );
}

function excerptFor(entry: LoreEntry) {
  const text = entry.plainText.trim();

  return (
    text ||
    "This record has been named, but its account has not yet been written."
  );
}

function readingTime(text: string) {
  const words = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  return Math.max(
    1,
    Math.ceil(words / 220),
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function CategoryIcon({
  category,
  className,
}: {
  category: LoreCategory;
  className?: string;
}) {
  switch (category) {
    case "magic":
      return (
        <WandSparkles
          className={className}
        />
      );

    case "culture":
      return (
        <Users className={className} />
      );

    case "religion":
      return (
        <Church className={className} />
      );

    case "faction":
      return (
        <Shield className={className} />
      );

    case "species":
    case "bloodline":
      return (
        <Dna className={className} />
      );

    case "artifact":
      return (
        <Gem className={className} />
      );

    case "history":
      return (
        <History className={className} />
      );

    case "creature":
      return (
        <PawPrint className={className} />
      );

    case "cosmology":
      return (
        <Orbit className={className} />
      );

    case "tradition":
      return (
        <Sparkles
          className={className}
        />
      );

    default:
      return (
        <BookOpen className={className} />
      );
  }
}