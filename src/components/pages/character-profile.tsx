import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, EyeOff, MapPin, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel, PanelTitle, EvidenceQuote, ErrorState, StatPair } from "@/components/app/primitives";
import { Portrait } from "@/components/app/portrait";
import { useWorldPath } from "@/components/app/world-mode";
import { WLink, CharacterChip, MetaRow, TypeTag, useCharacters, useEvidence, severityTone } from "./shared";
import {
  characterService,
  placeService,
  relationshipService,
  secretService,
  timelineService,
} from "@/services/lorebound";

export function CharacterProfilePage({ slug }: { slug: string }) {
  const path = useWorldPath();
  const { byId } = useCharacters();
  const { byId: evidenceById } = useEvidence();

  const q = useQuery({
    queryKey: ["terra", "character", slug],
    queryFn: () => characterService.get(slug),
  });
  const identities = useQuery({ queryKey: ["terra", "identities"], queryFn: () => characterService.identities() });
  const secrets = useQuery({ queryKey: ["terra", "secrets"], queryFn: () => secretService.list() });
  const rels = useQuery({ queryKey: ["terra", "relationships"], queryFn: () => relationshipService.list() });
  const events = useQuery({ queryKey: ["terra", "events"], queryFn: () => timelineService.events() });
  const places = useQuery({ queryKey: ["terra", "places"], queryFn: () => placeService.list() });

  if (q.isError) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <ErrorState message="That character couldn't be found in this world." retry={() => q.refetch()} />
        <WLink to={path("characters")} className="mt-4 inline-block text-sm text-gold underline-offset-4 hover:underline">
          Back to characters
        </WLink>
      </div>
    );
  }

  const c = q.data;
  if (!c) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-4 px-5 py-12 sm:px-8">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const myIdentities = (identities.data ?? []).filter((i) => i.ownerCharacterId === c.id);
  const known = (secrets.data ?? []).filter((s) => c.knownSecretIds.includes(s.id));
  const keptFrom = (secrets.data ?? []).filter((s) => c.secretsKeptFromThemIds.includes(s.id));
  const myRels = (rels.data ?? []).filter((r) => r.participants.some((p) => p.characterId === c.id));
  const myEvents = (events.data ?? []).filter((e) => e.participantIds.includes(c.id));
  const location = places.data?.find((p) => p.id === c.locationId);

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-10">
      <WLink
        to={path("characters")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Characters
      </WLink>

      {/* Dossier header */}
      <header className="mt-4 grid gap-6 rounded-lg border border-gold/25 bg-surface/70 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <Portrait character={c} size="xl" square className="size-32 sm:size-40" />
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-soft">{c.role}</p>
          <h1 className="mt-1 font-display text-[2.4rem] leading-tight text-foreground">{c.name}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="border-border/70 capitalize">{c.importance}</Badge>
            <Badge variant="outline" className="border-forest/50 capitalize text-forest">{c.status}</Badge>
            {myIdentities.map((i) => (
              <Badge key={i.id} variant="outline" className="border-plum/50 text-plum">
                Identity: {i.name}
              </Badge>
            ))}
          </div>
          <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-3">
            <StatPair label="Age" value={c.age ?? "Unrecorded"} />
            <StatPair
              label="Current location"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-mist" aria-hidden />
                  {location?.name ?? "Unrecorded"}
                </span>
              }
            />
            <StatPair label="Chapters" value={c.appearsInChapters.join(", ")} />
            <StatPair label="Emotional state" value={c.emotionalState} />
            <StatPair label="Physical state" value={c.physicalState} />
            <StatPair label="Traits" value={c.traits.join(" · ")} />
          </dl>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)]">
        <div className="space-y-6">
          <Panel>
            <PanelTitle>Biography</PanelTitle>
            <div className="space-y-4 p-5 sm:p-6">
              {c.biography.map((para, i) => (
                <p key={i} className="font-display text-[1.08rem] leading-relaxed text-foreground/90">
                  {para}
                </p>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelTitle hint="What is true, and what it costs">Abilities and limitations</PanelTitle>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="size-3 text-gold" aria-hidden /> Abilities
                </p>
                <ul className="space-y-2.5">
                  {c.abilities.map((a) => (
                    <li key={a.name}>
                      <p className="text-sm text-foreground">{a.name}</p>
                      <p className="text-sm text-muted-foreground">{a.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  <Shield className="size-3 text-ember" aria-hidden /> Limitations
                </p>
                <ul className="space-y-1.5">
                  {c.limitations.map((l) => (
                    <li key={l} className="text-sm text-muted-foreground">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {c.possessions.length ? (
              <div className="border-t border-border/60 p-5 sm:p-6">
                <p className="mb-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Important possessions
                </p>
                <ul className="space-y-2">
                  {c.possessions.map((p) => (
                    <li key={p.name} className="text-sm">
                      <span className="text-foreground">{p.name}</span>{" "}
                      <span className="text-muted-foreground">— {p.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>

          <Panel>
            <PanelTitle
              action={
                <WLink to={path("relationships")} className="text-xs text-gold underline-offset-4 hover:underline">
                  Open atlas
                </WLink>
              }
            >
              Relationships
            </PanelTitle>
            <ul className="divide-y divide-border/50">
              {myRels.map((r) => {
                const others = r.participants.filter((p) => p.characterId !== c.id);
                return (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {others.map((p) => (
                        <CharacterChip key={p.characterId} character={byId[p.characterId]} />
                      ))}
                      {r.types.map((t) => (
                        <TypeTag key={t} type={t} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {r.currentSummary}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <PanelTitle hint="Every recorded appearance">Personal timeline</PanelTitle>
            <ol className="p-5 sm:p-6">
              {myEvents.map((e) => (
                <li key={e.id} className="relative border-l border-border/70 pb-5 pl-6 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border border-gold/60 bg-background" aria-hidden />
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-gold-soft">
                    Chapter {e.chapter}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{e.consequence}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          {myIdentities.length ? (
            <Panel>
              <PanelTitle hint="Borrowed faces belong to this person">Identities</PanelTitle>
              <ul className="divide-y divide-border/50">
                {myIdentities.map((i) => (
                  <li key={i.id} className="px-5 py-4">
                    <p className="font-display text-lg text-foreground">{i.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {i.kind.replace("-", " ")} · created in Chapter {i.createdInChapter}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {i.description}
                    </p>
                    <dl className="mt-3 text-sm">
                      <MetaRow label="Known by">
                        <span className="flex flex-wrap gap-1.5">
                          {i.knownBy.map((id) => (
                            <CharacterChip key={id} character={byId[id]} />
                          ))}
                        </span>
                      </MetaRow>
                      {i.suspectedBy.length ? (
                        <MetaRow label="Suspected by">
                          <span className="flex flex-wrap gap-1.5">
                            {i.suspectedBy.map((id) => (
                              <CharacterChip key={id} character={byId[id]} />
                            ))}
                          </span>
                        </MetaRow>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel>
            <PanelTitle>Secrets</PanelTitle>
            <Tabs defaultValue="knows">
              <TabsList className="m-3 grid grid-cols-2">
                <TabsTrigger value="knows">Knows</TabsTrigger>
                <TabsTrigger value="kept">Kept from him</TabsTrigger>
              </TabsList>
              <TabsContent value="knows" className="m-0">
                <ul className="divide-y divide-border/50">
                  {known.map((s) => (
                    <li key={s.id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-foreground">{s.title}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.62rem] ${severityTone[s.severity]}`}>
                          {s.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="kept" className="m-0">
                <ul className="divide-y divide-border/50">
                  {keptFrom.length ? (
                    keptFrom.map((s) => (
                      <li key={s.id} className="flex gap-3 px-5 py-3.5">
                        <EyeOff className="mt-0.5 size-3.5 shrink-0 text-wine" aria-hidden />
                        <div>
                          <p className="text-sm text-foreground">{s.title}</p>
                          <p className="text-sm text-muted-foreground">{s.detail}</p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-5 py-6 text-sm text-muted-foreground">
                      Nothing is currently being kept from him.
                    </li>
                  )}
                </ul>
              </TabsContent>
            </Tabs>
          </Panel>

          <Panel>
            <PanelTitle hint="Every fact traces back to the page">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="size-4 text-gold" aria-hidden /> Source evidence
              </span>
            </PanelTitle>
            <div className="space-y-3 p-5">
              {c.evidenceIds.map((id) => (
                <EvidenceQuote key={id} evidence={evidenceById[id]} label={`Chapter ${evidenceById[id]?.chapter ?? ""}`} />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
