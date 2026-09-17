import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock, FileText, NotebookPen, Sparkle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LibraryHeader } from "@/components/app/library-header";
import { WorldsSanctuaryBackground } from "@/components/app/worlds-sanctuary-background";
import { ErrorState, Panel, PanelTitle, SectionLabel } from "@/components/app/primitives";
import { worldService, characterService, noteService, timelineService } from "@/services/lorebound";
import { currentUser, worldAccent } from "@/data/worlds";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/worlds/")({
  head: () => ({
    meta: [
      { title: "My Worlds — Lorebound" },
      { name: "description", content: "Your personal library of story worlds in Lorebound." },
      { property: "og:title", content: "My Worlds — Lorebound" },
      { property: "og:description", content: "Your personal library of story worlds in Lorebound." },
    ],
  }),
  component: WorldsLibrary,
});

function WorldsLibrary() {
  const [tab, setTab] = useState("mine");
  const worlds = useQuery({ queryKey: ["worlds"], queryFn: () => worldService.list() });
  const characters = useQuery({ queryKey: ["terra", "characters"], queryFn: () => characterService.list() });
  const notes = useQuery({ queryKey: ["terra", "notes"], queryFn: () => noteService.list() });
  const threads = useQuery({ queryKey: ["terra", "threads"], queryFn: () => timelineService.threads() });

  const featured = worlds.data?.find((w) => w.slug === "terra");
  const others = worlds.data?.filter((w) => w.slug !== "terra") ?? [];

  return (
    <div className="relative min-h-screen">
      <WorldsSanctuaryBackground />
      <LibraryHeader tab={tab} onTabChange={setTab} />

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:py-14">
        <div className="animate-rise">
          <h1 className="font-display text-[2.2rem] leading-tight text-foreground sm:text-[2.8rem]">
            Welcome back, {currentUser.name}.
          </h1>
          <p className="mt-2 text-[1.05rem] text-muted-foreground">
            Where would you like to return today?
          </p>
        </div>

        {worlds.isError ? (
          <div className="mt-8">
            <ErrorState message="Your library couldn't be loaded." retry={() => worlds.refetch()} />
          </div>
        ) : null}

        {/* Featured world */}
        <section className="mt-9">
          {worlds.isLoading || !featured ? (
            <Skeleton className="h-[26rem] w-full rounded-xl" />
          ) : (
            <article className="group grid overflow-hidden rounded-xl border border-gold/25 bg-surface/90 backdrop-blur-[2px] lg:grid-cols-[minmax(0,34fr)_minmax(0,66fr)]">
              <div className="relative overflow-hidden">
                <img
                  src={featured.coverUrl}
                  alt={`Cover artwork for ${featured.title}`}
                  width={1024}
                  height={1344}
                  className="h-56 w-full object-cover object-[center_30%] transition-transform duration-700 ease-out group-hover:scale-[1.03] lg:h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/85 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-surface/80" />
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] uppercase tracking-[0.2em]">
                  <span className="text-gold-soft">{featured.genre}</span>
                  <span className="text-muted-foreground">{featured.lastOpenedLabel}</span>
                </div>
                <h2 className="mt-2 font-display text-[2.1rem] leading-tight text-foreground">
                  {featured.title}
                </h2>
                <p className="mt-3 max-w-xl text-[1.02rem] leading-relaxed text-muted-foreground">
                  {featured.description}
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                  {[
                    { label: "Chapter", value: featured.chapterCount },
                    { label: "Words", value: featured.wordCount.toLocaleString() },
                    { label: "Characters", value: featured.characterCount },
                    { label: "Unresolved threads", value: featured.unresolvedThreadCount },
                  ].map((s) => (
                    <div key={s.label}>
                      <dt className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {s.label}
                      </dt>
                      <dd className="mt-1 font-display text-xl text-foreground">{s.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/worlds/terra/manuscript">
                      Continue Writing
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-gold/40">
                    <Link to="/worlds/terra">Enter World</Link>
                  </Button>
                </div>

                <ul className="mt-7 space-y-2.5 border-t border-border/60 pt-5">
                  <li className="flex gap-3 text-sm">
                    <Sparkle className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden />
                    <span className="text-muted-foreground">
                      <span className="text-foreground">Latest thread:</span> Can the vow-breaker
                      detect Igwe magic?
                    </span>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <Users className="mt-0.5 size-3.5 shrink-0 text-plum" aria-hidden />
                    <span className="text-muted-foreground">
                      <span className="text-foreground">Changed today:</span> Mira added as an
                      identity of Omir
                    </span>
                  </li>
                  <li className="flex gap-3 text-sm">
                    <NotebookPen className="mt-0.5 size-3.5 shrink-0 text-mist" aria-hidden />
                    <span className="text-muted-foreground">
                      <span className="text-foreground">Last note:</span> The delegate taps the cup
                      in a pattern
                    </span>
                  </li>
                </ul>
              </div>
            </article>
          )}
        </section>

        {/* Collection */}
        <section className="mt-14">
          <SectionLabel>{tab === "discover" ? "Worlds to read" : "Your collection"}</SectionLabel>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {worlds.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
                ))
              : [featured, ...others].filter(Boolean).map((w) => {
                  const world = w!;
                  const accent = worldAccent[world.palette];
                  const interactive = world.slug === "terra";
                  const card = (
                    <article
                      className={cn(
                        "group relative overflow-hidden rounded-lg border bg-surface/80 backdrop-blur-[1px] transition-all duration-500",
                        accent.rule,
                        interactive ? "hover:-translate-y-1" : "opacity-90",
                      )}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={world.coverUrl}
                          alt={`Cover artwork for ${world.title}`}
                          loading="lazy"
                          width={1024}
                          height={1344}
                          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-t to-transparent",
                            "from-background via-background/40",
                          )}
                        />
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
                            {world.description}
                          </p>
                          <p className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="size-3" aria-hidden /> {world.chapterCount} ch
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="size-3" aria-hidden />{" "}
                              {(world.wordCount / 1000).toFixed(0)}k
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" aria-hidden /> {world.lastOpenedLabel.replace("Last opened ", "")}
                            </span>
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                  return interactive ? (
                    <Link key={world.id} to="/worlds/terra" className="block rounded-lg">
                      {card}
                    </Link>
                  ) : (
                    <div key={world.id} title="This world has no chapters analysed yet">
                      {card}
                    </div>
                  );
                })}
          </div>
        </section>

        {/* Below the covers */}
        <section className="mt-14 grid gap-6 lg:grid-cols-4">
          <Panel>
            <PanelTitle>Recently opened</PanelTitle>
            <ul className="divide-y divide-border/50">
              {(worlds.data ?? []).map((w) => (
                <li key={w.id} className="px-5 py-3">
                  <p className="text-sm text-foreground">{w.title}</p>
                  <p className="text-xs text-muted-foreground">{w.lastOpenedLabel}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelTitle>Loose notes</PanelTitle>
            <ul className="divide-y divide-border/50">
              {(notes.data ?? []).slice(0, 4).map((n) => (
                <li key={n.id} className="px-5 py-3">
                  <p className="line-clamp-1 text-sm text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.updatedLabel}</p>
                </li>
              ))}
              {notes.isLoading ? <li className="px-5 py-4"><Skeleton className="h-4 w-4/5" /></li> : null}
            </ul>
          </Panel>

          <Panel>
            <PanelTitle>Unresolved threads</PanelTitle>
            <ul className="divide-y divide-border/50">
              {(threads.data ?? [])
                .filter((t) => t.status !== "resolved")
                .slice(0, 4)
                .map((t) => (
                  <li key={t.id} className="px-5 py-3">
                    <p className="line-clamp-2 text-sm text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Chapters {t.chapters[0]}–{t.chapters[t.chapters.length - 1]}
                    </p>
                  </li>
                ))}
            </ul>
          </Panel>

          <Panel>
            <PanelTitle>Characters recently changed</PanelTitle>
            <ul className="divide-y divide-border/50">
              {(characters.data ?? [])
                .filter((c) => c.recentlyChanged)
                .map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <p className="text-sm text-foreground">{c.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{c.role}</p>
                  </li>
                ))}
            </ul>
          </Panel>
        </section>
      </div>
    </div>
  );
}
