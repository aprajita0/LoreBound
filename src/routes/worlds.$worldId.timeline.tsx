import {
  useMemo,
  useState,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  TimelineEventModal,
  type TimelineChapterOption,
} from "@/components/timeline/TimelineEventModal";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  listCharacters,
} from "@/services/characters";
import { listPlaces } from "@/services/places";
import {
  createTimelineEvent,
  deleteTimelineEvent,
  getTimelineEventTypeLabel,
  getTimelineStatusLabel,
  listTimelineEvents,
  updateTimelineEvent,
  type SaveTimelineEventInput,
  type TimelineEvent,
  type TimelineEventStatus,
  type TimelineEventType,
} from "@/services/timeline";

export const Route = createFileRoute(
  "/worlds/$worldId/timeline",
)({
  component: TimelinePage,
});

const EVENT_TYPES: TimelineEventType[] = [
  "personal",
  "relationship",
  "journey",
  "discovery",
  "political",
  "battle",
  "birth",
  "death",
  "prophecy",
  "historical",
  "other",
];

const TYPE_COLORS: Record<
  TimelineEventType,
  string
> = {
  birth: "#73b69d",
  death: "#9b839f",
  battle: "#cf696b",
  political: "#b88955",
  relationship: "#c87591",
  discovery: "#57aaa5",
  journey: "#6297ca",
  prophecy: "#9d7dcc",
  historical: "#c5a65d",
  personal: "#d49a68",
  other: "#89919f",
};

const STATUS_CLASSES: Record<
  TimelineEventStatus,
  string
> = {
  canonical:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  disputed:
    "border-orange-500/25 bg-orange-500/10 text-orange-400",
  secret:
    "border-violet-500/25 bg-violet-500/10 text-violet-400",
  draft:
    "border-border bg-background/40 text-muted-foreground",
};

function TimelinePage() {
  const { worldId } = Route.useParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<TimelineEventType | "all">(
      "all",
    );
  const [statusFilter, setStatusFilter] =
    useState<TimelineEventStatus | "all">(
      "all",
    );

  const [selectedId, setSelectedId] =
    useState<string | null>(null);
  const [editing, setEditing] =
    useState<TimelineEvent | null>(null);
  const [modalOpen, setModalOpen] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);

  const eventsQuery = useQuery({
    queryKey: ["timeline", worldId],
    queryFn: () =>
      listTimelineEvents(worldId),
  });

  const charactersQuery = useQuery({
    queryKey: ["characters", worldId],
    queryFn: () => listCharacters(worldId),
  });

  const placesQuery = useQuery({
    queryKey: ["places", worldId],
    queryFn: () => listPlaces(worldId),
  });

  const chaptersQuery = useQuery({
    queryKey: [
      "timeline-chapters",
      worldId,
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, title, position")
        .eq("world_id", worldId)
        .order("position", {
          ascending: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      return (
        data ?? []
      ) as TimelineChapterOption[];
    },
  });

  const events = eventsQuery.data ?? [];
  const characters =
    charactersQuery.data ?? [];
  const places = placesQuery.data ?? [];
  const chapters = chaptersQuery.data ?? [];

  const selectedEvent =
    events.find(
      (event) => event.id === selectedId,
    ) ?? null;

  const nextSortOrder =
    events.length === 0
      ? 1
      : Math.max(
          ...events.map(
            (event) => event.sortOrder,
          ),
        ) + 1;

  const filteredEvents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return events.filter((event) => {
      if (
        typeFilter !== "all" &&
        event.eventType !== typeFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        event.status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        event.title,
        event.fictionalDate,
        event.era,
        event.summary,
        event.description,
        event.place?.name,
        event.chapter?.title,
        ...event.characters.map(
          (character) => character.name,
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    events,
    search,
    statusFilter,
    typeFilter,
  ]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<
      string,
      TimelineEvent[]
    >();

    filteredEvents.forEach((event) => {
      const groupName =
        event.era.trim() || "Undated era";

      const group =
        groups.get(groupName) ?? [];

      group.push(event);
      groups.set(groupName, group);
    });

    return Array.from(groups.entries());
  }, [filteredEvents]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(
    event: TimelineEvent,
  ) {
    setSelectedId(null);
    setEditing(event);
    setModalOpen(true);
  }

  async function saveEvent(
    input: SaveTimelineEventInput,
  ) {
    if (saving) return;

    setSaving(true);

    try {
      if (editing) {
        await updateTimelineEvent(
          editing.id,
          input,
        );

        toast.success(
          "Timeline event updated.",
        );
      } else {
        await createTimelineEvent(input);

        toast.success(
          "Timeline event added.",
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["timeline", worldId],
      });

      setModalOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The timeline event could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(
    event: TimelineEvent,
  ) {
    if (deleting) return;

    const confirmed = window.confirm(
      `Delete "${event.title}" from the timeline?`,
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await deleteTimelineEvent(
        event.id,
        worldId,
      );

      await queryClient.invalidateQueries({
        queryKey: ["timeline", worldId],
      });

      setSelectedId(null);

      toast.success(
        "Timeline event deleted.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The timeline event could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const loading =
    eventsQuery.isLoading ||
    charactersQuery.isLoading ||
    placesQuery.isLoading ||
    chaptersQuery.isLoading;

  const error =
    eventsQuery.error ??
    charactersQuery.error ??
    placesQuery.error ??
    chaptersQuery.error;

  if (error) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl">
            The timeline could not be
            opened.
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Please try loading it again."}
          </p>

          <button
            type="button"
            onClick={() => {
              void eventsQuery.refetch();
              void charactersQuery.refetch();
              void placesQuery.refetch();
              void chaptersQuery.refetch();
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
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-gold">
              History
            </p>

            <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">
              Timeline
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Arrange the moments that changed
              this world and the lives within
              it.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="flex w-fit items-center gap-2 rounded-md bg-gold px-4 py-2.5 text-sm font-medium text-background"
          >
            <Plus className="size-4" />
            Add event
          </button>
        </header>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">
                Search timeline
              </span>

              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search events, eras, characters, or places..."
                className="h-11 w-full rounded-full border border-input bg-background/60 pl-10 pr-4 text-sm outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | TimelineEventStatus
                    | "all",
                )
              }
              className="h-11 rounded-full border border-input bg-background/60 px-4 text-sm text-muted-foreground outline-none"
            >
              <option value="all">
                All statuses
              </option>
              <option value="canonical">
                Canonical
              </option>
              <option value="draft">
                Draft
              </option>
              <option value="secret">
                Secret
              </option>
              <option value="disputed">
                Disputed
              </option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={typeFilter === "all"}
              onClick={() =>
                setTypeFilter("all")
              }
            >
              All events
            </FilterButton>

            {EVENT_TYPES.filter((type) =>
              events.some(
                (event) =>
                  event.eventType === type,
              ),
            ).map((type) => (
              <FilterButton
                key={type}
                active={typeFilter === type}
                color={TYPE_COLORS[type]}
                onClick={() =>
                  setTypeFilter(type)
                }
              >
                {getTimelineEventTypeLabel(
                  type,
                )}
              </FilterButton>
            ))}
          </div>
        </div>

        <main className="mt-8">
          {loading ? (
            <TimelineLoading />
          ) : events.length === 0 ? (
            <TimelineEmpty
              onAdd={openCreate}
            />
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/30 px-6 py-20 text-center">
              <h2 className="font-display text-2xl">
                No moments match.
              </h2>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="mt-3 text-sm text-gold hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedEvents.map(
                ([era, eraEvents]) => (
                  <section key={era}>
                    <div className="mb-5 flex items-center gap-4">
                      <p className="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
                        {era}
                      </p>

                      <div className="h-px flex-1 bg-border/70" />

                      <span className="text-xs text-muted-foreground">
                        {eraEvents.length}{" "}
                        {eraEvents.length === 1
                          ? "event"
                          : "events"}
                      </span>
                    </div>

                    <div className="relative ml-3 border-l border-border/80 pl-7 sm:ml-5 sm:pl-10">
                      {eraEvents.map(
                        (event, index) => (
                          <TimelineCard
                            key={event.id}
                            event={event}
                            last={
                              index ===
                              eraEvents.length - 1
                            }
                            onSelect={() =>
                              setSelectedId(
                                event.id,
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  </section>
                ),
              )}
            </div>
          )}
        </main>
      </div>

      <TimelineDrawer
        event={selectedEvent}
        deleting={deleting}
        onClose={() =>
          setSelectedId(null)
        }
        onEdit={openEdit}
        onDelete={(event) => {
          void removeEvent(event);
        }}
      />

      <TimelineEventModal
        open={modalOpen}
        worldId={worldId}
        editing={editing}
        characters={characters}
        places={places}
        chapters={chapters}
        nextSortOrder={nextSortOrder}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
        onSave={(input) => {
          void saveEvent(input);
        }}
      />
    </div>
  );
}

function TimelineCard({
  event,
  last,
  onSelect,
}: {
  event: TimelineEvent;
  last: boolean;
  onSelect: () => void;
}) {
  const color =
    TYPE_COLORS[event.eventType];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative mb-6 flex w-full gap-4 rounded-xl border border-border/80 bg-surface/35 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/35 hover:bg-surface/55 hover:shadow-[var(--shadow-archive)]",
        last && "mb-0",
      )}
    >
      <span
        className="absolute -left-[2.24rem] top-7 size-3 rounded-full border-2 border-background shadow-[0_0_0_3px_var(--border)] sm:-left-[2.93rem]"
        style={{ backgroundColor: color }}
      />

      <div
        className="hidden w-1 shrink-0 rounded-full sm:block"
        style={{ backgroundColor: color }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
            style={{ color }}
          >
            {getTimelineEventTypeLabel(
              event.eventType,
            )}
          </span>

          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[0.62rem]",
              STATUS_CLASSES[event.status],
            )}
          >
            {getTimelineStatusLabel(
              event.status,
            )}
          </span>
        </div>

        <h2 className="mt-2 font-display text-2xl text-foreground">
          {event.title}
        </h2>

        {event.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {event.summary}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {event.fictionalDate ? (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {event.fictionalDate}
            </span>
          ) : null}

          {event.place ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {event.place.name}
            </span>
          ) : null}

          {event.characters.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {event.characters.length}{" "}
              {event.characters.length === 1
                ? "character"
                : "characters"}
            </span>
          ) : null}

          <span className="flex items-center gap-1">
            {Array.from({
              length: event.importance,
            }).map((_, index) => (
              <span
                key={index}
                className="size-1.5 rounded-full bg-gold"
              />
            ))}
          </span>
        </div>
      </div>

      <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function TimelineDrawer({
  event,
  deleting,
  onClose,
  onEdit,
  onDelete,
}: {
  event: TimelineEvent | null;
  deleting: boolean;
  onClose: () => void;
  onEdit: (
    event: TimelineEvent,
  ) => void;
  onDelete: (
    event: TimelineEvent,
  ) => void;
}) {
  const open = Boolean(event);

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px] transition-opacity",
          open
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[450px] flex-col border-l border-border bg-surface-raised shadow-[var(--shadow-archive)] transition-transform duration-300",
          open
            ? "translate-x-0"
            : "translate-x-full",
        )}
      >
        {event ? (
          <>
            <header className="flex items-start justify-between border-b border-border/70 p-6">
              <div>
                <p
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
                  style={{
                    color:
                      TYPE_COLORS[
                        event.eventType
                      ],
                  }}
                >
                  {getTimelineEventTypeLabel(
                    event.eventType,
                  )}
                </p>

                <h2 className="mt-2 font-display text-3xl leading-tight">
                  {event.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 space-y-7 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs",
                    STATUS_CLASSES[
                      event.status
                    ],
                  )}
                >
                  {getTimelineStatusLabel(
                    event.status,
                  )}
                </span>

                {event.era ? (
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    {event.era}
                  </span>
                ) : null}
              </div>

              <dl className="grid grid-cols-2 gap-5">
                <Detail
                  label="Date"
                  value={
                    event.fictionalDate ||
                    "Undated"
                  }
                />

                <Detail
                  label="Importance"
                  value={`${event.importance}/5`}
                />

                <Detail
                  label="Place"
                  value={
                    event.place?.name ||
                    "Not linked"
                  }
                />

                <Detail
                  label="Chapter"
                  value={
                    event.chapter
                      ? `Chapter ${event.chapter.position}: ${event.chapter.title}`
                      : "Not linked"
                  }
                />
              </dl>

              <section>
                <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Summary
                </h3>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {event.summary ||
                    "No summary has been added."}
                </p>
              </section>

              {event.description ? (
                <section>
                  <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Full account
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {event.description}
                  </p>
                </section>
              ) : null}

              <section>
                <h3 className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Characters involved
                </h3>

                {event.characters.length >
                0 ? (
                  <div className="mt-3 space-y-2">
                    {event.characters.map(
                      (character) => (
                        <div
                          key={
                            character.characterId
                          }
                          className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/30 p-3"
                        >
                          {character.portraitUrl ? (
                            <img
                              src={
                                character.portraitUrl
                              }
                              alt=""
                              className="size-10 rounded-full object-cover object-top"
                            />
                          ) : (
                            <span className="grid size-10 place-items-center rounded-full border border-border">
                              <UserRound className="size-4 text-muted-foreground" />
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-display">
                              {character.name}
                            </p>

                            <p className="truncate text-xs text-muted-foreground">
                              {character.role ||
                                "Role not set"}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No characters linked.
                  </p>
                )}
              </section>
            </div>

            <footer className="flex gap-2 border-t border-border/70 p-5">
              <button
                type="button"
                onClick={() =>
                  onEdit(event)
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gold/45 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold hover:bg-gold/20"
              >
                <Pencil className="size-4" />
                Edit event
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  onDelete(event)
                }
                className="rounded-md border border-border px-3 py-2 text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 font-display text-lg">
        {value}
      </dd>
    </div>
  );
}

function FilterButton({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "text-foreground"
          : "border-border text-muted-foreground",
      )}
      style={
        active
          ? {
              borderColor:
                color ?? "var(--gold)",
              backgroundColor: color
                ? `color-mix(in oklab, ${color} 12%, transparent)`
                : "color-mix(in oklab, var(--gold) 12%, transparent)",
            }
          : undefined
      }
    >
      {color ? (
        <span
          className="size-1.5 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />
      ) : null}

      {children}
    </button>
  );
}

function TimelineLoading() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-xl border border-border/70 bg-surface/40"
        />
      ))}
    </div>
  );
}

function TimelineEmpty({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="starfield grid place-items-center rounded-xl border border-dashed border-border bg-surface/30 px-6 py-24 text-center">
      <div className="relative max-w-md">
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-gold/35 bg-gold/10 text-gold">
          <Clock3 className="size-6" />
        </div>

        <h2 className="mt-5 font-display text-3xl">
          This history has not been
          written yet.
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Add the first moment, whether it
          changed the entire world or only one
          life.
        </p>

        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-gold/50 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25"
        >
          <Sparkles className="size-4" />
          Add first event
        </button>
      </div>
    </div>
  );
}