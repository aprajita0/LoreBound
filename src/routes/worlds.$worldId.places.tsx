import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Building2,
  Castle,
  Landmark,
  Loader2,
  Map,
  MapPin,
  Mountain,
  Plus,
  Search,
  Trees,
} from "lucide-react";
import { PlaceDrawer } from "@/components/places/PlaceDrawer";
import { PlaceModal } from "@/components/places/PlaceModal";
import {
  deletePlace,
  getPlaceStatusLabel,
  getPlaceTypeLabel,
  listPlaces,
  type Place,
  type PlaceStatus,
  type PlaceType,
} from "@/services/places";

export const Route = createFileRoute(
  "/worlds/$worldId/places",
)({
  component: PlacesPage,
});

type TypeFilter = "all" | PlaceType;
type StatusFilter = "all" | PlaceStatus;

function PlacesPage() {
  const { worldId } = Route.useParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);
  const [editingPlace, setEditingPlace] =
    useState<Place | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const placesQuery = useQuery({
    queryKey: ["places", worldId],
    queryFn: () => listPlaces(worldId),
  });

  const places = placesQuery.data ?? [];

  const filteredPlaces = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return places.filter((place) => {
      const matchesSearch =
        !normalizedSearch ||
        place.name.toLowerCase().includes(normalizedSearch) ||
        place.summary.toLowerCase().includes(normalizedSearch) ||
        place.description
          .toLowerCase()
          .includes(normalizedSearch) ||
        place.aliases.some((alias) =>
          alias.toLowerCase().includes(normalizedSearch),
        );

      const matchesType =
        typeFilter === "all" ||
        place.placeType === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        place.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [places, search, typeFilter, statusFilter]);

  const featuredPlace =
    filteredPlaces.find((place) => place.imagePath) ??
    filteredPlaces[0] ??
    null;

  function openCreateModal() {
    setEditingPlace(null);
    setModalOpen(true);
  }

  function openEditModal(place: Place) {
    setSelectedPlace(null);
    setEditingPlace(place);
    setModalOpen(true);
  }

  async function handleDelete(place: Place) {
    const confirmed = window.confirm(
      `Delete "${place.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await deletePlace(place.id, worldId);
      setSelectedPlace(null);

      await queryClient.invalidateQueries({
        queryKey: ["places", worldId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["timeline", worldId],
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "The place could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (placesQuery.isLoading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-gold" />

          <p className="mt-3 text-sm text-muted-foreground">
            Opening the atlas...
          </p>
        </div>
      </main>
    );
  }

  if (placesQuery.isError) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-foreground">
            The atlas could not be opened.
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {placesQuery.error instanceof Error
              ? placesQuery.error.message
              : "Something went wrong."}
          </p>

          <button
            type="button"
            onClick={() => placesQuery.refetch()}
            className="mt-5 rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(22,95,98,0.13),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(91,58,120,0.12),transparent_34%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <header className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gold">
                World atlas
              </p>

              <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">
                Places
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Build the kingdoms, cities, sanctuaries, and
                forgotten corners where your story unfolds.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-medium text-black transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <Plus className="size-4" />
              Add place
            </button>
          </header>

          <section className="mt-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search names, aliases, and descriptions..."
                  className="w-full rounded-xl border border-border bg-background/70 py-3 pl-11 pr-4 text-sm text-foreground outline-none backdrop-blur transition placeholder:text-muted-foreground focus:border-gold/50"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value as TypeFilter,
                    )
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground outline-none focus:border-gold/50"
                >
                  <option value="all">All place types</option>
                  <option value="world">Worlds</option>
                  <option value="continent">Continents</option>
                  <option value="kingdom">Kingdoms</option>
                  <option value="region">Regions</option>
                  <option value="city">Cities</option>
                  <option value="village">Villages</option>
                  <option value="building">Buildings</option>
                  <option value="landmark">Landmarks</option>
                  <option value="wilderness">Wilderness</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter,
                    )
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground outline-none focus:border-gold/50"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="abandoned">Abandoned</option>
                  <option value="destroyed">Destroyed</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
          </section>

          {filteredPlaces.length === 0 ? (
            <EmptyState
              hasPlaces={places.length > 0}
              onCreate={openCreateModal}
            />
          ) : (
            <>
              {featuredPlace && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlace(featuredPlace)
                  }
                  className="group relative mt-8 grid min-h-80 w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-xl md:grid-cols-[1.1fr_0.9fr]"
                >
                  <PlaceArtwork
                    place={featuredPlace}
                    featured
                  />

                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <div className="flex flex-wrap gap-2">
                      <Tag>
                        {getPlaceTypeLabel(
                          featuredPlace.placeType,
                        )}
                      </Tag>

                      <Tag>
                        {getPlaceStatusLabel(
                          featuredPlace.status,
                        )}
                      </Tag>
                    </div>

                    <h2 className="mt-5 font-serif text-4xl text-foreground transition group-hover:text-gold">
                      {featuredPlace.name}
                    </h2>

                    <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                      {featuredPlace.summary ||
                        featuredPlace.description ||
                        "This place is waiting for its history to be written."}
                    </p>

                    <div className="mt-7 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
                      <MapPin className="size-4" />
                      Open atlas entry
                    </div>
                  </div>
                </button>
              )}

              <div className="mt-12 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gold">
                    Known locations
                  </p>

                  <h2 className="mt-1 font-serif text-2xl text-foreground">
                    The world at a glance
                  </h2>
                </div>

                <p className="text-sm text-muted-foreground">
                  {filteredPlaces.length}{" "}
                  {filteredPlaces.length === 1
                    ? "place"
                    : "places"}
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredPlaces.map((place) => {
                  const parent =
                    places.find(
                      (candidate) =>
                        candidate.id === place.parentPlaceId,
                    ) ?? null;

                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedPlace(place)}
                      className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-2xl"
                    >
                      <PlaceArtwork place={place} />

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">
                              {getPlaceTypeLabel(
                                place.placeType,
                              )}
                            </p>

                            <h3 className="mt-2 font-serif text-xl text-foreground transition group-hover:text-gold">
                              {place.name}
                            </h3>
                          </div>

                          <PlaceIcon
                            type={place.placeType}
                            className="size-5 shrink-0 text-muted-foreground transition group-hover:text-gold"
                          />
                        </div>

                        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                          {place.summary ||
                            "No description has been added yet."}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                          <span>
                            {parent
                              ? `Within ${parent.name}`
                              : "Independent location"}
                          </span>

                          <span>
                            {getPlaceStatusLabel(place.status)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <PlaceDrawer
        place={selectedPlace}
        places={places}
        deleting={deleting}
        onClose={() => setSelectedPlace(null)}
        onEdit={openEditModal}
        onDelete={(place) => void handleDelete(place)}
        onSelectPlace={setSelectedPlace}
      />

      <PlaceModal
        open={modalOpen}
        worldId={worldId}
        places={places}
        place={editingPlace}
        onClose={() => {
          setModalOpen(false);
          setEditingPlace(null);
        }}
        onSaved={() => {
          void queryClient.invalidateQueries({
            queryKey: ["places", worldId],
          });
        }}
      />
    </>
  );
}

function EmptyState({
  hasPlaces,
  onCreate,
}: {
  hasPlaces: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <Map className="mx-auto size-10 text-gold/70" />

      <h2 className="mt-5 font-serif text-2xl text-foreground">
        {hasPlaces
          ? "No places match these filters."
          : "Your atlas is empty."}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasPlaces
          ? "Try changing your search or filters."
          : "Add the first kingdom, city, sanctuary, or forgotten ruin in this world."}
      </p>

      {!hasPlaces && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-black"
        >
          <Plus className="size-4" />
          Add your first place
        </button>
      )}
    </div>
  );
}

function PlaceArtwork({
  place,
  featured = false,
}: {
  place: Place;
  featured?: boolean;
}) {
  return (
    <div
      className={
        featured
          ? "relative min-h-64 overflow-hidden"
          : "relative h-48 overflow-hidden"
      }
    >
      {place.imagePath ? (
        <img
          src={place.imagePath}
          alt={place.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,rgba(198,160,88,0.24),transparent_25%),radial-gradient(circle_at_80%_60%,rgba(47,94,112,0.28),transparent_35%),linear-gradient(145deg,#172235,#070b13)]">
          <PlaceIcon
            type={place.placeType}
            className="size-14 text-gold/50"
          />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />

      {!featured && (
        <p className="absolute bottom-4 left-4 text-xs uppercase tracking-[0.18em] text-white/70">
          {getPlaceStatusLabel(place.status)}
        </p>
      )}
    </div>
  );
}

function PlaceIcon({
  type,
  className,
}: {
  type: PlaceType;
  className?: string;
}) {
  if (type === "kingdom") {
    return <Castle className={className} />;
  }

  if (type === "building") {
    return <Building2 className={className} />;
  }

  if (type === "landmark") {
    return <Landmark className={className} />;
  }

  if (
    type === "wilderness" ||
    type === "region" ||
    type === "continent"
  ) {
    return <Trees className={className} />;
  }

  if (type === "world") {
    return <Map className={className} />;
  }

  if (type === "city" || type === "village") {
    return <MapPin className={className} />;
  }

  return <Mountain className={className} />;
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-gold">
      {children}
    </span>
  );
}