import {
  useMemo,
  useState,
} from "react";
import {
  createFileRoute,
} from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Fingerprint,
  Flame,
  HeartCrack,
  History,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Skull,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  SecretEntryDrawer,
} from "@/components/secrets/SecretEntryDrawer";
import {
  SecretEntryModal,
  type SecretChapterOption,
  type SecretCharacterOption,
  type SecretLoreOption,
} from "@/components/secrets/SecretEntryModal";
import {
  countSecretKnowledge,
  deleteSecret,
  getSecret,
  getSecretCategoryLabel,
  getSecretSeverityLabel,
  getSecretStatusLabel,
  listSecrets,
  type Secret,
  type SecretCategory,
  type SecretSeverity,
  type SecretStatus,
} from "@/services/secrets";
import {
  listPlaces,
} from "@/services/places";
import {
  listLoreEntries,
} from "@/services/lore";

export const Route = createFileRoute(
  "/worlds/$worldId/secrets",
)({
  component: SecretsPage,
});

interface WorldRow {
  id: string;
  title: string;
}

interface CharacterRow {
  id: string;
  name: string;
  role: string | null;
}

interface ChapterRow {
  id: string;
  title: string;
  position: number;
}

type CategoryFilter =
  | "all"
  | SecretCategory;

type StatusFilter =
  | "all"
  | SecretStatus;

type SeverityFilter =
  | "all"
  | SecretSeverity;

const CATEGORY_FILTERS: Array<{
  value: CategoryFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "identity",
    label: "Identity",
  },
  {
    value: "betrayal",
    label: "Betrayal",
  },
  {
    value: "relationship",
    label: "Relationship",
  },
  {
    value: "political",
    label: "Political",
  },
  {
    value: "magical",
    label: "Magical",
  },
  {
    value: "prophecy",
    label: "Prophecy",
  },
  {
    value: "lineage",
    label: "Lineage",
  },
  {
    value: "other",
    label: "Other",
  },
];

const STATUS_FILTERS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "All records",
  },
  {
    value: "buried",
    label: "Buried",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "partially_revealed",
    label: "Partially revealed",
  },
  {
    value: "exposed",
    label: "Exposed",
  },
];

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
    world.title.trim() ||
    "Untitled World"
  );
}

async function listSecretCharacters(
  worldId: string,
): Promise<SecretCharacterOption[]> {
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

async function listSecretChapters(
  worldId: string,
): Promise<SecretChapterOption[]> {
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
    (data ?? []) as ChapterRow[]
  ).map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    position: chapter.position,
  }));
}

function SecretsPage() {
  const { worldId } = Route.useParams();
  const queryClient = useQueryClient();

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<CategoryFilter>("all");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>("all");

  const [
    severityFilter,
    setSeverityFilter,
  ] = useState<SeverityFilter>("all");

  const [
    selectedSecret,
    setSelectedSecret,
  ] = useState<Secret | null>(null);

  const [
    editingSecret,
    setEditingSecret,
  ] = useState<Secret | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    openingSecretId,
    setOpeningSecretId,
  ] = useState<string | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const secretsQuery = useQuery({
    queryKey: ["secrets", worldId],
    queryFn: () => listSecrets(worldId),
  });

  const worldQuery = useQuery({
    queryKey: ["world-title", worldId],
    queryFn: () => getWorldTitle(worldId),
  });

  const charactersQuery = useQuery({
    queryKey: [
      "secret-characters",
      worldId,
    ],
    queryFn: () =>
      listSecretCharacters(worldId),
  });

  const chaptersQuery = useQuery({
    queryKey: [
      "secret-chapters",
      worldId,
    ],
    queryFn: () =>
      listSecretChapters(worldId),
  });

  const placesQuery = useQuery({
    queryKey: ["places", worldId],
    queryFn: () => listPlaces(worldId),
  });

  const loreQuery = useQuery({
    queryKey: ["lore", worldId],
    queryFn: () =>
      listLoreEntries(worldId),
  });

  const secrets =
    secretsQuery.data ?? [];

  const worldTitle =
    worldQuery.data ?? "Untitled World";

  const characters =
    charactersQuery.data ?? [];

  const chapters =
    chaptersQuery.data ?? [];

  const places =
    placesQuery.data ?? [];

  const loreEntries: SecretLoreOption[] =
    (loreQuery.data ?? []).map(
      (entry) => ({
        id: entry.id,
        title: entry.title,
        category: entry.category,
      }),
    );

  const filteredSecrets =
    useMemo(() => {
      const needle =
        search.trim().toLowerCase();

      return secrets.filter((secret) => {
        const searchable = [
          secret.title,
          secret.publicStory,
          secret.truthPlainText,
          secret.revealCondition,
          secret.consequences,
          secret.evidence,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!needle ||
            searchable.includes(needle)) &&
          (categoryFilter === "all" ||
            secret.category ===
              categoryFilter) &&
          (statusFilter === "all" ||
            secret.status ===
              statusFilter) &&
          (severityFilter === "all" ||
            secret.severity ===
              severityFilter)
        );
      });
    }, [
      categoryFilter,
      search,
      secrets,
      severityFilter,
      statusFilter,
    ]);

  const featuredSecret =
    filteredSecrets.find(
      (secret) => secret.isFeatured,
    ) ??
    filteredSecrets.find(
      (secret) =>
        secret.severity ===
        "catastrophic",
    ) ??
    filteredSecrets[0] ??
    null;

  const remainingSecrets =
    featuredSecret
      ? filteredSecrets.filter(
          (secret) =>
            secret.id !==
            featuredSecret.id,
        )
      : filteredSecrets;

  function openCreateModal() {
    setEditingSecret(null);
    setModalOpen(true);
  }

  function openEditModal(
    secret: Secret,
  ) {
    setSelectedSecret(null);
    setEditingSecret(secret);
    setModalOpen(true);
  }

  async function openSecret(
    secretId: string,
  ) {
    setOpeningSecretId(secretId);

    try {
      const fullSecret =
        await getSecret(
          worldId,
          secretId,
        );

      setSelectedSecret(fullSecret);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "The sealed record could not be opened.",
      );
    } finally {
      setOpeningSecretId(null);
    }
  }

  async function handleDelete(
    secret: Secret,
  ) {
    setDeleting(true);

    try {
      await deleteSecret(
        secret.id,
        worldId,
      );

      setSelectedSecret(null);

      await queryClient.invalidateQueries({
        queryKey: ["secrets", worldId],
      });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "The secret could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const loading =
    secretsQuery.isLoading ||
    worldQuery.isLoading ||
    charactersQuery.isLoading ||
    chaptersQuery.isLoading ||
    placesQuery.isLoading ||
    loreQuery.isLoading;

  const queryError =
    secretsQuery.error ??
    worldQuery.error ??
    charactersQuery.error ??
    chaptersQuery.error ??
    placesQuery.error ??
    loreQuery.error;

  if (loading) {
    return <SecretsLoading />;
  }

  if (queryError) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-background px-6 text-center">
        <div>
          <EyeOff className="mx-auto size-8 text-red-300" />

          <h1 className="mt-5 font-serif text-3xl text-foreground">
            The sealed archive would not open.
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
                secretsQuery.refetch(),
                worldQuery.refetch(),
                charactersQuery.refetch(),
                chaptersQuery.refetch(),
                placesQuery.refetch(),
                loreQuery.refetch(),
              ]);
            }}
            className="mt-6 border border-red-300/40 px-5 py-2 text-xs uppercase tracking-[0.18em] text-red-200 hover:bg-red-400/10"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <SecretsAtmosphere />

        <div className="relative mx-auto max-w-[1200px] px-6 pb-28 pt-12 lg:px-10 lg:pt-16">
          <header className="border-b border-red-300/20 pb-11">
            <p className="text-[0.67rem] font-semibold uppercase tracking-[0.3em] text-red-300">
              Restricted archive
            </p>

            <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-serif text-5xl leading-none tracking-[-0.035em] text-foreground sm:text-6xl lg:text-[4.6rem]">
                  Secrets of {worldTitle}
                </h1>

                <p className="mt-5 max-w-2xl font-serif text-base italic leading-7 text-muted-foreground/85">
                  Every hidden name, forbidden
                  history, concealed allegiance, and
                  truth waiting to fracture the world.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-5">
                <span className="text-xs text-muted-foreground">
                  {secrets.length} sealed{" "}
                  {secrets.length === 1
                    ? "record"
                    : "records"}
                </span>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-3 border border-red-300/55 bg-red-400/[0.08] px-5 py-3 text-xs font-semibold text-red-200 transition hover:bg-red-300 hover:text-slate-950"
                >
                  <Plus className="size-4" />
                  Add secret
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="relative block max-w-2xl border-b border-border pb-3 focus-within:border-red-300/60">
              <Search className="absolute left-0 top-1 size-4 text-red-300/80" />

              <span className="sr-only">
                Search secrets
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search hidden names, evidence, consequences..."
                className="w-full bg-transparent pl-8 font-serif text-lg text-foreground outline-none placeholder:text-muted-foreground/50"
              />
            </label>

            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      filter.value,
                    )
                  }
                  className={`border-b pb-2 text-[0.65rem] uppercase tracking-[0.16em] transition ${
                    statusFilter ===
                    filter.value
                      ? "border-red-300 text-red-200"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap gap-2 border-b border-border pb-7">
            {CATEGORY_FILTERS.map(
              (filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setCategoryFilter(
                      filter.value,
                    )
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-[0.68rem] transition ${
                    categoryFilter ===
                    filter.value
                      ? "border-red-300/60 bg-red-400/10 text-red-200"
                      : "border-border text-muted-foreground hover:border-red-300/30 hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ),
            )}

            <span className="mx-1 hidden h-7 w-px bg-border sm:block" />

            {(
              [
                "all",
                "minor",
                "dangerous",
                "catastrophic",
              ] as SeverityFilter[]
            ).map((severity) => (
              <button
                key={severity}
                type="button"
                onClick={() =>
                  setSeverityFilter(
                    severity,
                  )
                }
                className={`rounded-full border px-3.5 py-1.5 text-[0.68rem] transition ${
                  severityFilter === severity
                    ? "border-gold/55 bg-gold/10 text-gold"
                    : "border-border text-muted-foreground hover:border-gold/30 hover:text-foreground"
                }`}
              >
                {severity === "all"
                  ? "Any danger"
                  : getSecretSeverityLabel(
                      severity,
                    )}
              </button>
            ))}
          </section>

          {filteredSecrets.length === 0 ? (
            <EmptySecrets
              hasSecrets={
                secrets.length > 0
              }
              onCreate={openCreateModal}
            />
          ) : (
            <>
              {featuredSecret && (
                <section className="mt-12">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Highest priority record
                  </p>

                  <FeaturedSecretCard
                    secret={featuredSecret}
                    loading={
                      openingSecretId ===
                      featuredSecret.id
                    }
                    onOpen={() => {
                      void openSecret(
                        featuredSecret.id,
                      );
                    }}
                  />
                </section>
              )}

              {remainingSecrets.length > 0 && (
                <section className="mt-20">
                  <div className="flex items-end justify-between border-b border-red-300/20 pb-6">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Sealed collection
                      </p>

                      <h2 className="mt-3 font-serif text-3xl text-foreground">
                        Classified records
                      </h2>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {
                        filteredSecrets.length
                      }{" "}
                      records
                    </p>
                  </div>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    {remainingSecrets.map(
                      (secret) => (
                        <SecretCard
                          key={secret.id}
                          secret={secret}
                          loading={
                            openingSecretId ===
                            secret.id
                          }
                          onOpen={() => {
                            void openSecret(
                              secret.id,
                            );
                          }}
                        />
                      ),
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <SecretEntryDrawer
        secret={selectedSecret}
        characters={characters}
        chapters={chapters}
        places={places}
        loreEntries={loreEntries}
        deleting={deleting}
        onClose={() =>
          setSelectedSecret(null)
        }
        onEdit={openEditModal}
        onDelete={(secret) => {
          void handleDelete(secret);
        }}
      />

      <SecretEntryModal
        open={modalOpen}
        worldId={worldId}
        secret={editingSecret}
        characters={characters}
        chapters={chapters}
        places={places}
        loreEntries={loreEntries}
        onClose={() => {
          setModalOpen(false);
          setEditingSecret(null);
        }}
        onSaved={(savedSecret) => {
          setSelectedSecret(savedSecret);

          void queryClient.invalidateQueries({
            queryKey: ["secrets", worldId],
          });
        }}
      />
    </>
  );
}

function FeaturedSecretCard({
  secret,
  loading,
  onOpen,
}: {
  secret: Secret;
  loading: boolean;
  onOpen: () => void;
}) {
  const counts =
    countSecretKnowledge(secret);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative mt-6 grid w-full overflow-hidden border border-red-300/30 bg-card/35 text-left transition hover:border-red-300/55 lg:grid-cols-[290px_minmax(0,1fr)]"
    >
      <div className="relative flex min-h-64 items-center justify-center overflow-hidden border-b border-border bg-[radial-gradient(circle_at_50%_40%,rgba(147,45,58,0.25),transparent_28%),linear-gradient(145deg,#17111a,#080a11)] lg:border-b-0 lg:border-r">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(220,150,124,0.5)_0_1px,transparent_1.2px)] [background-size:47px_47px]" />

        <div className="relative flex size-28 items-center justify-center rounded-full border border-red-300/25">
          <div className="flex size-20 items-center justify-center rounded-full border border-red-300/20">
            <EyeOff className="size-9 text-red-300/70" />
          </div>
        </div>
      </div>

      <div className="relative p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-3 text-[0.63rem] font-semibold uppercase tracking-[0.18em]">
          <span className="text-red-200">
            {getSecretSeverityLabel(
              secret.severity,
            )}
          </span>

          <span className="text-muted-foreground">
            {getSecretCategoryLabel(
              secret.category,
            )}
          </span>

          <span className="text-muted-foreground">
            {getSecretStatusLabel(
              secret.status,
            )}
          </span>

          {secret.isFeatured && (
            <Star className="size-3.5 fill-gold text-gold" />
          )}
        </div>

        <h2 className="mt-6 font-serif text-3xl leading-tight text-foreground transition group-hover:text-red-200 sm:text-4xl">
          {secret.title}
        </h2>

        <p className="mt-5 line-clamp-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          {secret.publicStory ||
            secret.truthPlainText ||
            "The details of this secret have not yet been recorded."}
        </p>

        <div className="mt-8 flex flex-wrap gap-6 border-t border-border pt-5 text-xs">
          <span className="text-red-200">
            {counts.knows} know
          </span>

          <span className="text-amber-300">
            {counts.suspects} suspect
          </span>

          <span className="text-muted-foreground">
            {counts.unaware} unaware
          </span>

          <span className="ml-auto text-red-300">
            Open sealed record →
          </span>
        </div>
      </div>

      {loading && <LoadingVeil />}
    </button>
  );
}

function SecretCard({
  secret,
  loading,
  onOpen,
}: {
  secret: Secret;
  loading: boolean;
  onOpen: () => void;
}) {
  const counts =
    countSecretKnowledge(secret);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative min-h-72 overflow-hidden border border-border bg-card/20 p-7 text-left transition hover:-translate-y-0.5 hover:border-red-300/40 hover:bg-card/40"
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex size-10 items-center justify-center rounded-full border ${
            secret.severity ===
            "catastrophic"
              ? "border-red-300/45 bg-red-400/10 text-red-300"
              : secret.severity ===
                  "dangerous"
                ? "border-amber-300/35 bg-amber-400/[0.06] text-amber-300"
                : "border-border bg-muted/40 text-muted-foreground"
          }`}
        >
          <CategoryIcon
            category={secret.category}
          />
        </span>

        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
          {getSecretStatusLabel(
            secret.status,
          )}
        </span>
      </div>

      <p className="mt-6 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-red-300">
        {getSecretCategoryLabel(
          secret.category,
        )}
      </p>

      <h3 className="mt-3 font-serif text-2xl leading-tight text-foreground transition group-hover:text-red-200">
        {secret.title}
      </h3>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {secret.publicStory ||
          secret.truthPlainText ||
          "No account has been written yet."}
      </p>

      <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-[0.68rem]">
        <span className="text-red-200">
          {counts.knows} know
        </span>

        <span className="text-amber-300">
          {counts.suspects} suspect
        </span>

        <span className="text-muted-foreground">
          {counts.unaware} unaware
        </span>
      </div>

      {loading && <LoadingVeil />}
    </button>
  );
}

function CategoryIcon({
  category,
}: {
  category: SecretCategory;
}) {
  const className = "size-4";

  switch (category) {
    case "identity":
      return (
        <Fingerprint
          className={className}
        />
      );

    case "betrayal":
      return (
        <HeartCrack
          className={className}
        />
      );

    case "relationship":
      return (
        <Users className={className} />
      );

    case "crime":
      return (
        <Skull className={className} />
      );

    case "political":
      return (
        <ShieldAlert
          className={className}
        />
      );

    case "magical":
      return (
        <Sparkles className={className} />
      );

    case "historical":
      return (
        <History className={className} />
      );

    case "prophecy":
      return (
        <Flame className={className} />
      );

    case "lineage":
      return (
        <KeyRound className={className} />
      );

    default:
      return (
        <EyeOff className={className} />
      );
  }
}

function EmptySecrets({
  hasSecrets,
  onCreate,
}: {
  hasSecrets: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="mt-16 border border-dashed border-border px-6 py-24 text-center">
      <EyeOff className="mx-auto size-10 text-red-300/55" />

      <h2 className="mt-5 font-serif text-3xl text-foreground">
        {hasSecrets
          ? "No sealed record matches."
          : "Nothing has been concealed yet."}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {hasSecrets
          ? "Try another search or remove some filters."
          : "Record an identity, betrayal, prophecy, crime, hidden lineage, or forbidden truth."}
      </p>

      {!hasSecrets && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-7 inline-flex items-center gap-2 border border-red-300/45 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-red-200 hover:bg-red-400/10"
        >
          <Plus className="size-4" />
          Seal the first secret
        </button>
      )}
    </div>
  );
}

function SecretsAtmosphere() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_7%_5%,rgba(124,31,46,0.16),transparent_28%),radial-gradient(circle_at_94%_7%,rgba(73,43,85,0.16),transparent_35%)]" />

      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(205,135,112,0.45)_0_1px,transparent_1.4px)] [background-size:179px_151px]" />

      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-red-400/[0.025] to-transparent" />
    </div>
  );
}

function SecretsLoading() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto size-5 animate-spin text-red-300" />

        <p className="mt-4 font-serif text-sm italic text-muted-foreground">
          Unsealing the restricted archive…
        </p>
      </div>
    </main>
  );
}

function LoadingVeil() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <Loader2 className="size-5 animate-spin text-red-300" />
    </div>
  );
}