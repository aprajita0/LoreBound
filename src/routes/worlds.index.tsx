import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  BookOpen,
  Clock,
  FileText,
  LibraryBig,
  Plus,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LibraryHeader } from "@/components/app/library-header";
import { WorldsSanctuaryBackground } from "@/components/app/worlds-sanctuary-background";
import {
  ErrorState,
  Panel,
  PanelTitle,
  SectionLabel,
} from "@/components/app/primitives";
import { useSession } from "@/lib/session";
import {
  listWorlds,
  type WorldSummary,
} from "@/services/worlds";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/worlds/")({
  head: () => ({
    meta: [
      { title: "My Worlds — Lorebound" },
      {
        name: "description",
        content: "Your personal library of story worlds in Lorebound.",
      },
      {
        property: "og:title",
        content: "My Worlds — Lorebound",
      },
      {
        property: "og:description",
        content: "Your personal library of story worlds in Lorebound.",
      },
    ],
  }),
  component: WorldsLibrary,
});

const cardAccents = [
  {
    rule: "border-gold/30",
    ink: "text-gold-soft",
  },
  {
    rule: "border-mist/30",
    ink: "text-mist",
  },
  {
    rule: "border-plum/30",
    ink: "text-plum",
  },
];

function formatLastOpened(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return formatDistanceToNow(parsed, {
    addSuffix: true,
  });
}

function formatWordCount(wordCount: number): string {
  if (wordCount < 1_000) {
    return wordCount.toLocaleString();
  }

  const rounded = wordCount / 1_000;

  return `${rounded.toFixed(rounded >= 10 ? 0 : 1)}k`;
}

function getUserName(user: ReturnType<typeof useSession>["user"]): string {
  if (!user) {
    return "Writer";
  }

  return user.name?.trim() || user.email?.split("@")[0] || "Writer";
}

function WorldArtwork({
  world,
  className,
}: {
  world: WorldSummary;
  className?: string;
}) {
  if (world.coverPath) {
    return (
      <img
        src={world.coverPath}
        alt={`Cover artwork for ${world.title}`}
        width={1024}
        height={1344}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        "bg-[radial-gradient(circle_at_25%_20%,rgba(202,164,91,0.22),transparent_30%),radial-gradient(circle_at_80%_32%,rgba(103,87,147,0.2),transparent_34%),linear-gradient(155deg,#172238_0%,#0a1324_50%,#080d17_100%)]",
        className,
      )}
      aria-label={`Decorative cover for ${world.title}`}
    >
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-[18%] top-[18%] size-1 rounded-full bg-gold shadow-[0_0_12px_rgba(220,181,99,0.8)]" />
        <div className="absolute right-[22%] top-[28%] size-0.5 rounded-full bg-white" />
        <div className="absolute left-[35%] top-[40%] size-0.5 rounded-full bg-white/80" />
        <div className="absolute right-[38%] top-[14%] size-0.5 rounded-full bg-white/70" />
      </div>

      <div className="relative flex flex-col items-center px-8 text-center">
        <LibraryBig className="size-10 text-gold/70" aria-hidden />

        <p className="mt-5 font-display text-2xl leading-tight text-parchment">
          {world.title}
        </p>

        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.24em] text-gold-soft">
          {world.genre}
        </p>
      </div>
    </div>
  );
}

function EmptyPanelMessage({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center px-5 py-6 text-center">
      <div className="text-muted-foreground">{icon}</div>

      <p className="mt-2 max-w-[15rem] text-xs leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function WorldsLibrary() {
  const [tab, setTab] = useState("mine");
  const { user } = useSession();

  const worldsQuery = useQuery({
    queryKey: ["worlds"],
    queryFn: listWorlds,
  });

  const worlds = worldsQuery.data ?? [];
  const featured = worlds[0];
  const displayName = getUserName(user);

  return (
    <div className="relative min-h-screen">
      <WorldsSanctuaryBackground />

      <LibraryHeader tab={tab} onTabChange={setTab} />

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:py-14">
        <div className="animate-rise">
          <h1 className="font-display text-[2.2rem] leading-tight text-foreground sm:text-[2.8rem]">
            Welcome back, {displayName}.
          </h1>

          <p className="mt-2 text-[1.05rem] text-muted-foreground">
            Where would you like to return today?
          </p>
        </div>

        {worldsQuery.isError ? (
          <div className="mt-8">
            <ErrorState
              message={
                worldsQuery.error instanceof Error
                  ? worldsQuery.error.message
                  : "Your library couldn't be loaded."
              }
              retry={() => {
                void worldsQuery.refetch();
              }}
            />
          </div>
        ) : null}

        {worldsQuery.isLoading ? (
          <>
            <section className="mt-9">
              <Skeleton className="h-[26rem] w-full rounded-xl" />
            </section>

            <section className="mt-14">
              <Skeleton className="h-3 w-32" />

              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="aspect-[3/4] w-full rounded-lg"
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}

        {!worldsQuery.isLoading &&
        !worldsQuery.isError &&
        worlds.length === 0 ? (
          <section className="mt-9 overflow-hidden rounded-xl border border-gold/25 bg-surface/90 px-6 py-16 text-center backdrop-blur-[2px] sm:px-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <LibraryBig className="size-6 text-gold" aria-hidden />
            </div>

            <h2 className="mt-5 font-display text-3xl text-foreground">
              Your library is waiting.
            </h2>

            <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted-foreground">
              Create your first world, choose its voice, and begin its opening
              chapter. Lorebound will keep it connected as it grows.
            </p>

            <Button asChild className="mt-7">
              <Link to="/worlds/new">
                <Plus className="size-4" />
                Create your first world
              </Link>
            </Button>
          </section>
        ) : null}

        {!worldsQuery.isLoading && featured ? (
          <>
            <section className="mt-9">
              <article className="group grid overflow-hidden rounded-xl border border-gold/25 bg-surface/90 backdrop-blur-[2px] lg:grid-cols-[minmax(0,34fr)_minmax(0,66fr)]">
                <div className="relative h-60 overflow-hidden lg:h-auto lg:min-h-[28rem]">
                  <WorldArtwork
                    world={featured}
                    className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-surface/85 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-surface/80" />
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] uppercase tracking-[0.2em]">
                    <span className="text-gold-soft">{featured.genre}</span>

                    <span className="text-muted-foreground">
                      Last opened {formatLastOpened(featured.lastOpenedAt)}
                    </span>
                  </div>

                  <h2 className="mt-2 font-display text-[2.1rem] leading-tight text-foreground">
                    {featured.title}
                  </h2>

                  <p className="mt-3 max-w-xl text-[1.02rem] leading-relaxed text-muted-foreground">
                    {featured.description ||
                      "A new world waiting for its story to unfold."}
                  </p>

                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    {[
                      {
                        label: "Chapters",
                        value: featured.chapterCount,
                      },
                      {
                        label: "Words",
                        value: featured.wordCount.toLocaleString(),
                      },
                      {
                        label: "Status",
                        value: featured.status,
                      },
                      {
                        label: "Last opened",
                        value: formatLastOpened(featured.lastOpenedAt),
                      },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <dt className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {stat.label}
                        </dt>

                        <dd className="mt-1 font-display text-xl capitalize text-foreground">
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button disabled title="The writing workspace is next">
                      Continue Writing
                    </Button>

                    <Button
                      variant="outline"
                      className="border-gold/40"
                      disabled
                      title="Dynamic world pages are the next milestone"
                    >
                      Enter World
                    </Button>
                  </div>

                  <div className="mt-7 border-t border-border/60 pt-5">
                    <p className="flex max-w-xl gap-3 text-sm text-muted-foreground">
                      <ScrollText
                        className="mt-0.5 size-4 shrink-0 text-gold"
                        aria-hidden
                      />

                      <span>
                        Your world and its first chapter are stored securely.
                        Next, we will connect the writing studio to this world.
                      </span>
                    </p>
                  </div>
                </div>
              </article>
            </section>

            <section className="mt-14">
              <SectionLabel>
                {tab === "discover" ? "Worlds to read" : "Your collection"}
              </SectionLabel>

              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {worlds.map((world, index) => {
                  const accent = cardAccents[index % cardAccents.length]!;

                  return (
                    <article
                      key={world.id}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border bg-surface/80 backdrop-blur-[1px] transition-all duration-500 hover:-translate-y-1",
                        accent.rule,
                      )}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <WorldArtwork
                          world={world}
                          className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <p
                            className={cn(
                              "text-[0.65rem] uppercase tracking-[0.22em]",
                              accent.ink,
                            )}
                          >
                            {world.genre}
                          </p>

                          <h3 className="mt-1 font-display text-[1.4rem] leading-tight text-foreground">
                            {world.title}
                          </h3>

                          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                            {world.description ||
                              "A new story world waiting to be written."}
                          </p>

                          <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="size-3" aria-hidden />
                              {world.chapterCount} ch
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <FileText className="size-3" aria-hidden />
                              {formatWordCount(world.wordCount)}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" aria-hidden />
                              {formatLastOpened(world.lastOpenedAt)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-14 grid gap-6 lg:grid-cols-4">
              <Panel>
                <PanelTitle>Recently opened</PanelTitle>

                <ul className="divide-y divide-border/50">
                  {worlds.slice(0, 4).map((world) => (
                    <li key={world.id} className="px-5 py-3">
                      <p className="text-sm text-foreground">{world.title}</p>

                      <p className="text-xs text-muted-foreground">
                        {formatLastOpened(world.lastOpenedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel>
                <PanelTitle>Loose notes</PanelTitle>

                <EmptyPanelMessage
                  icon={<FileText className="size-4" aria-hidden />}
                >
                  Notes will appear here after we connect notes to your saved
                  worlds.
                </EmptyPanelMessage>
              </Panel>

              <Panel>
                <PanelTitle>Unresolved threads</PanelTitle>

                <EmptyPanelMessage
                  icon={<ScrollText className="size-4" aria-hidden />}
                >
                  Story threads will appear after chapter analysis is added.
                </EmptyPanelMessage>
              </Panel>

              <Panel>
                <PanelTitle>Characters recently changed</PanelTitle>

                <EmptyPanelMessage
                  icon={<BookOpen className="size-4" aria-hidden />}
                >
                  Character changes will appear after the world workspace is
                  connected.
                </EmptyPanelMessage>
              </Panel>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}