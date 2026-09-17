import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleDot, PenLine, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, Panel, PanelTitle, ErrorState, StatPair } from "@/components/app/primitives";
import { Portrait } from "@/components/app/portrait";
import { useWorldPath } from "@/components/app/world-mode";
import { WLink, useCharacters, characterSlug, TypeTag } from "./shared";
import {
  chapterService,
  relationshipService,
  timelineService,
  continuityService,
} from "@/services/lorebound";

const recentChanges = [
  { text: "Mira added as an alias for Omir", when: "Today", tone: "text-gold" },
  { text: "Arthur connected to the tavern event", when: "Today", tone: "text-mist" },
  { text: "Lynx's true species recorded", when: "Yesterday", tone: "text-forest" },
  { text: "Liam's political status updated", when: "Yesterday", tone: "text-ember" },
];

export function OverviewPage() {
  const path = useWorldPath();
  const chapters = useQuery({ queryKey: ["terra", "chapters"], queryFn: () => chapterService.list() });
  const threads = useQuery({ queryKey: ["terra", "threads"], queryFn: () => timelineService.threads() });
  const rels = useQuery({ queryKey: ["terra", "relationships"], queryFn: () => relationshipService.list() });
  const findings = useQuery({ queryKey: ["terra", "findings"], queryFn: () => continuityService.list() });
  const { byId } = useCharacters();

  const latest = [...(chapters.data ?? [])].sort((a, b) => b.number - a.number)[0];
  const omirRels = (rels.data ?? []).filter((r) =>
    r.participants.some((p) => p.characterId === "ch-omir"),
  );

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="World overview"
        title="The Isles of Terra"
        lede="The world as it stands at the end of Chapter 24"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Continue writing */}
        <Panel className="overflow-hidden lg:row-span-2">
          <PanelTitle
            hint={latest ? `${latest.wordCount.toLocaleString()} words · ${latest.lastEditedLabel}` : "Loading"}
            action={
              <Badge variant="outline" className="border-forest/50 text-forest">
                Saved
              </Badge>
            }
          >
            Continue writing
          </PanelTitle>
          <div className="p-5 sm:p-6">
            {chapters.isLoading || !latest ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold-soft">
                  Chapter {latest.number}
                </p>
                <h3 className="mt-1 font-display text-2xl text-foreground">{latest.title}</h3>
                <div className="mt-4 space-y-3 border-l-2 border-gold/25 pl-5">
                  {latest.body.slice(0, 3).map((para, i) => (
                    <p key={i} className="font-display text-[1.05rem] leading-relaxed text-foreground/85">
                      {para}
                    </p>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <WLink to={path("manuscript")}>
                      <span className="inline-flex items-center gap-2">
                        Continue Writing <ArrowRight className="size-4" />
                      </span>
                    </WLink>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {latest.wordCount.toLocaleString()} words · {latest.lastEditedLabel}
                  </span>
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* The world right now */}
        <Panel>
          <PanelTitle hint="Five threads in motion">The world right now</PanelTitle>
          <ol className="divide-y divide-border/50">
            {(threads.data ?? [])
              .filter((t) => t.status !== "resolved")
              .slice(0, 5)
              .map((t) => (
                <li key={t.id} className="flex gap-3 px-5 py-3.5">
                  <CircleDot
                    className={
                      t.status === "turning" ? "mt-1 size-3.5 shrink-0 text-ember" : "mt-1 size-3.5 shrink-0 text-forest"
                    }
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm leading-relaxed text-foreground">{t.summary}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.title} · chapters {t.chapters[0]}–{t.chapters[t.chapters.length - 1]}
                    </p>
                  </div>
                </li>
              ))}
            {threads.isLoading ? (
              <li className="px-5 py-4">
                <Skeleton className="h-4 w-4/5" />
              </li>
            ) : null}
            {threads.isError ? (
              <li className="p-4">
                <ErrorState message="Threads didn't load." retry={() => threads.refetch()} />
              </li>
            ) : null}
          </ol>
        </Panel>

        {/* Relationship preview */}
        <Panel>
          <PanelTitle
            hint="Focused view"
            action={
              <WLink
                to={path("relationships")}
                className="text-xs text-gold underline-offset-4 hover:underline"
              >
                Open atlas
              </WLink>
            }
          >
            Around Omir
          </PanelTitle>
          <ul className="divide-y divide-border/50">
            {omirRels.slice(0, 4).map((r) => {
              const others = r.participants.filter((p) => p.characterId !== "ch-omir");
              return (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex -space-x-2">
                      {others.map((p) =>
                        byId[p.characterId] ? (
                          <Portrait key={p.characterId} character={byId[p.characterId]!} size="sm" />
                        ) : null,
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {others.map((p) => byId[p.characterId]?.shortName ?? p.characterId).join(" · ")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {r.types.slice(0, 2).map((t) => (
                          <TypeTag key={t} type={t} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {r.currentSummary}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
            {rels.isLoading ? (
              <li className="px-5 py-4">
                <Skeleton className="h-10 w-full" />
              </li>
            ) : null}
          </ul>
        </Panel>

        {/* Unresolved threads */}
        <Panel>
          <PanelTitle
            action={
              <WLink
                to={path("continuity")}
                className="text-xs text-gold underline-offset-4 hover:underline"
              >
                Continuity inbox
              </WLink>
            }
          >
            Unresolved threads
          </PanelTitle>
          <ul className="divide-y divide-border/50">
            {[
              "Who knows Mira's identity?",
              "Why is the Mokshan delegate repeatedly visiting the tavern?",
              "Will Omir reveal what he sensed?",
              "Can the vow-breaker detect Igwe magic?",
            ].map((q) => (
              <li key={q} className="flex items-baseline gap-3 px-5 py-3.5">
                <Sparkle className="size-3 shrink-0 translate-y-0.5 text-gold" aria-hidden />
                <p className="font-display text-[1.05rem] leading-snug text-foreground">{q}</p>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Recently changed */}
        <Panel>
          <PanelTitle hint={`${findings.data?.filter((f) => f.status === "unreviewed").length ?? 0} findings await review`}>
            Recently changed
          </PanelTitle>
          <ul className="divide-y divide-border/50">
            {recentChanges.map((c) => (
              <li key={c.text} className="flex items-baseline justify-between gap-3 px-5 py-3.5">
                <p className="text-sm text-foreground">
                  <PenLine className={`mr-2 inline size-3 ${c.tone}`} aria-hidden />
                  {c.text}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">{c.when}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border/60 px-5 py-4">
            <dl className="grid grid-cols-3 gap-4">
              <StatPair label="Characters" value="18" />
              <StatPair label="Secrets" value="6" />
              <StatPair
                label="Open findings"
                value={
                  <WLink to={path("continuity")} className="text-gold underline-offset-4 hover:underline">
                    {findings.data?.filter((f) => f.status === "unreviewed").length ?? "—"}
                  </WLink>
                }
              />
            </dl>
          </div>
        </Panel>
      </div>

      <p className="sr-only">
        <WLink to={path(`characters/${characterSlug("ch-omir")}`)}>Omir profile</WLink>
      </p>
    </div>
  );
}
