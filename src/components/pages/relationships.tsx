import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  PageHeader,
  Panel,
  PanelTitle,
  EmptyState,
  ErrorState,
  EvidenceQuote,
  
} from "@/components/app/primitives";
import { Portrait } from "@/components/app/portrait";
import {
  CharacterChip,
  MetaRow,
  TypeTag,
  relationshipMeta,
  useCharacters,
  useEvidence,
} from "./shared";
import { relationshipService } from "@/services/lorebound";
import { cn } from "@/lib/utils";
import type { Relationship, RelationshipType } from "@/types/lorebound";

const groupLabels: Record<Relationship["group"], string> = {
  closest: "Closest bonds",
  family: "Family and soulbonds",
  affection: "Affection and romantic interest",
  friends: "Friends and allies",
  political: "Political relationships",
  tension: "Tension and uncertainty",
  familiar: "Familiar bonds",
};

const directionLabel: Record<string, string> = {
  mutual: "Mutual",
  "one-sided": "One-sided or unconfirmed",
  unknown: "Unknown",
  complicated: "Complicated",
};

const strokeFor: Record<RelationshipType, string> = {
  soulbond: "var(--color-plum)",
  "found-family": "var(--color-parchment)",
  family: "var(--color-parchment)",
  "romantic-interest": "var(--color-rose)",
  friendship: "var(--color-mist)",
  alliance: "var(--color-forest)",
  "political-tension": "var(--color-ember)",
  "familiar-bond": "var(--color-gold)",
  suspicion: "var(--color-ember)",
  secrecy: "var(--color-wine)",
  mentorship: "var(--color-mist)",
};

type Mode = "atlas" | "constellation" | "changes";

export function RelationshipsPage() {
  const q = useQuery({ queryKey: ["terra", "relationships"], queryFn: () => relationshipService.list() });
  const { byId, list: characters } = useCharacters();
  const { byId: evidenceById } = useEvidence();

  const [mode, setMode] = useState<Mode>("atlas");
  const [focus, setFocus] = useState("ch-omir");
  const [chapter, setChapter] = useState(24);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const all = q.data ?? [];
  const focused = useMemo(
    () =>
      all.filter(
        (r) =>
          r.participants.some((p) => p.characterId === focus) &&
          r.beganInChapter <= chapter &&
          (typeFilter === "all" || r.types.includes(typeFilter as RelationshipType)) &&
          (search.trim() === "" ||
            (r.label + r.currentSummary).toLowerCase().includes(search.toLowerCase())),
      ),
    [all, focus, chapter, typeFilter, search],
  );

  const grouped = useMemo(() => {
    const out = new Map<Relationship["group"], Relationship[]>();
    for (const r of focused) out.set(r.group, [...(out.get(r.group) ?? []), r]);
    return [...out.entries()];
  }, [focused]);

  const open = all.find((r) => r.id === openId);
  const focusChar = byId[focus];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Relationship atlas"
        title="Who holds whom"
        lede="Bonds as they stand at a chosen point in the story — including the ones nobody has said out loud."
        actions={
          <div className="flex rounded-md border border-border/70 p-0.5">
            {(["atlas", "constellation", "changes"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  "rounded px-3 py-1.5 text-xs capitalize transition-colors",
                  mode === m ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        }
      />

      <Panel className="mb-6 p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,14rem)_minmax(0,14rem)_1fr]">
          <div className="space-y-1.5">
            <label className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              Viewing around
            </label>
            <Select value={focus} onValueChange={setFocus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {characters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              Relationship type
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(relationshipMeta) as RelationshipType[]).map((t) => (
                  <SelectItem key={t} value={t}>{relationshipMeta[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rel-search" className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              Search relationships
            </label>
            <Input
              id="rel-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="A name, a bond, a suspicion…"
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="rel-chapter" className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            Story position — Chapter {chapter}
          </label>
          <Slider
            id="rel-chapter"
            className="mt-2.5"
            value={[chapter]}
            onValueChange={(v) => setChapter(v[0] ?? 24)}
            min={4}
            max={24}
            step={1}
          />
        </div>
      </Panel>

      {q.isError ? <ErrorState message="Relationships didn't load." retry={() => q.refetch()} /> : null}

      {q.isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : mode === "atlas" ? (
        <div className="space-y-6">
          {focusChar ? (
            <div className="flex items-center gap-4">
              <Portrait character={focusChar} size="lg" />
              <div>
                <h2 className="font-display text-2xl text-foreground">{focusChar.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Viewing relationships at Chapter {chapter} · {focused.length} bonds ·{" "}
                  {focused.filter((r) => r.visibility !== "public").length} hidden or one-sided ·{" "}
                  {focused.filter((r) => r.lastChangedInChapter >= chapter - 1).length} recently changed
                </p>
              </div>
            </div>
          ) : null}

          {grouped.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No bonds here yet"
              description="Nothing matches these filters at this point in the story. Move the chapter marker forward."
            />
          ) : (
            grouped.map(([group, rels]) => (
              <Panel key={group}>
                <PanelTitle>{groupLabels[group]}</PanelTitle>
                <ul className="divide-y divide-border/50">
                  {rels.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                      <div className="flex -space-x-2">
                        {r.participants.map((p) =>
                          byId[p.characterId] ? (
                            <Portrait
                              key={p.characterId}
                              character={byId[p.characterId]!}
                              size="sm"
                              className="ring-2 ring-background"
                            />
                          ) : null,
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg text-foreground">{r.label}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {r.types.map((t) => <TypeTag key={t} type={t} />)}
                          <span className="text-xs text-muted-foreground">
                            {directionLabel[r.direction]} · {r.visibility}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {r.currentSummary}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Began Chapter {r.beganInChapter} · Last changed Chapter {r.lastChangedInChapter}
                        </p>
                        <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                          {r.arc
                            .filter((a) => a.chapter <= chapter)
                            .map((a) => (
                              <li key={a.chapter} className="text-xs text-muted-foreground">
                                <span className="text-gold-soft">Ch {a.chapter}</span> · {a.summary}
                              </li>
                            ))}
                        </ol>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setOpenId(r.id)}>
                        Open relationship <ArrowRight className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))
          )}
        </div>
      ) : mode === "constellation" ? (
        <Constellation
          relationships={focused}
          focus={focus}
          byId={byId}
          onOpen={setOpenId}
        />
      ) : (
        <Panel>
          <PanelTitle hint="How these bonds moved, chapter by chapter">Changes</PanelTitle>
          <ol className="divide-y divide-border/50">
            {all
              .flatMap((r) => r.arc.map((a) => ({ ...a, rel: r })))
              .filter((a) => a.chapter <= chapter)
              .sort((a, b) => b.chapter - a.chapter)
              .map((a, i) => (
                <li key={`${a.rel.id}-${a.chapter}-${i}`} className="flex gap-4 px-5 py-4">
                  <span className="w-20 shrink-0 text-xs uppercase tracking-[0.16em] text-gold-soft">
                    Ch {a.chapter}
                  </span>
                  <div>
                    <p className="text-sm text-foreground">{a.summary}</p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {a.rel.label} · {a.kind}
                    </p>
                  </div>
                </li>
              ))}
          </ol>
        </Panel>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">{open.label}</SheetTitle>
                <SheetDescription>{open.currentSummary}</SheetDescription>
              </SheetHeader>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {open.types.map((t) => <TypeTag key={t} type={t} />)}
              </div>

              <dl className="mt-5 divide-y divide-border/50">
                <MetaRow label="Direction">{directionLabel[open.direction]}</MetaRow>
                <MetaRow label="Visibility">
                  <span className="capitalize">{open.visibility}</span>
                </MetaRow>
                <MetaRow label="Publicly">{open.publicPerception}</MetaRow>
                <MetaRow label="Privately">{open.privateTruth}</MetaRow>
                <MetaRow label="Began">Chapter {open.beganInChapter}</MetaRow>
                <MetaRow label="Last changed">Chapter {open.lastChangedInChapter}</MetaRow>
              </dl>

              <section className="mt-6">
                <h3 className="font-display text-lg text-foreground">What each believes</h3>
                <ul className="mt-3 space-y-3">
                  {open.participants.map((p) => (
                    <li key={p.characterId} className="flex gap-3">
                      {byId[p.characterId] ? <Portrait character={byId[p.characterId]!} size="sm" /> : null}
                      <div>
                        <p className="text-sm text-foreground">{p.stance}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">Believes: {p.believes}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-6">
                <h3 className="font-display text-lg text-foreground">Arc</h3>
                <ol className="mt-3 space-y-2">
                  {open.arc.map((a) => (
                    <li key={a.chapter} className="text-sm text-muted-foreground">
                      <span className="text-gold-soft">Chapter {a.chapter}</span> · {a.summary}
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-6 space-y-3">
                <h3 className="font-display text-lg text-foreground">Supporting passages</h3>
                {open.evidenceIds.map((id) => (
                  <EvidenceQuote key={id} evidence={evidenceById[id]} />
                ))}
              </section>

              {open.openQuestions.length ? (
                <section className="mt-6">
                  <h3 className="font-display text-lg text-foreground">Unresolved questions</h3>
                  <ul className="mt-2 space-y-1.5">
                    {open.openQuestions.map((qq) => (
                      <li key={qq} className="text-sm text-muted-foreground">— {qq}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="mt-6">
                <h3 className="font-display text-lg text-foreground">People</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {open.participants.map((p) => (
                    <CharacterChip key={p.characterId} character={byId[p.characterId]} />
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Constellation({
  relationships,
  focus,
  byId,
  onOpen,
}: {
  relationships: Relationship[];
  focus: string;
  byId: Record<string, import("@/types/lorebound").Character>;
  onOpen: (id: string) => void;
}) {
  const others = [
    ...new Set(
      relationships.flatMap((r) => r.participants.map((p) => p.characterId)).filter((id) => id !== focus),
    ),
  ].filter((id) => byId[id]);

  const size = 560;
  const c = size / 2;
  const radius = 205;
  const pos = new Map<string, { x: number; y: number }>();
  pos.set(focus, { x: c, y: c });
  others.forEach((id, i) => {
    const angle = (i / others.length) * Math.PI * 2 - Math.PI / 2;
    pos.set(id, { x: c + Math.cos(angle) * radius, y: c + Math.sin(angle) * radius });
  });

  return (
    <Panel className="p-4">
      <PanelTitle hint="Colour carries the bond type; dashes mean it is kept secret">
        Constellation
      </PanelTitle>
      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="mx-auto h-auto w-full max-w-[620px]"
          role="img"
          aria-label={`Relationship constellation around ${byId[focus]?.name ?? "the selected character"}`}
        >
          {relationships.map((r) =>
            r.participants
              .filter((p) => p.characterId !== focus)
              .map((p) => {
                const a = pos.get(focus);
                const b = pos.get(p.characterId);
                if (!a || !b) return null;
                const type = r.types[0] ?? "friendship";
                return (
                  <line
                    key={`${r.id}-${p.characterId}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={strokeFor[type]}
                    strokeWidth={r.types.includes("soulbond") ? 3 : 1.6}
                    strokeDasharray={r.visibility === "secret" ? "6 6" : undefined}
                    opacity={0.75}
                    className="animate-draw"
                  />
                );
              }),
          )}
          {[focus, ...others].map((id) => {
            const p = pos.get(id)!;
            const ch = byId[id]!;
            const r = id === focus ? 40 : 30;
            return (
              <g key={id} className="cursor-pointer">
                <clipPath id={`clip-${id}`}>
                  <circle cx={p.x} cy={p.y} r={r} />
                </clipPath>
                {ch.portraitUrl ? (
                  <image
                    href={ch.portraitUrl}
                    x={p.x - r}
                    y={p.y - r}
                    width={r * 2}
                    height={r * 2}
                    clipPath={`url(#clip-${id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <>
                    <circle cx={p.x} cy={p.y} r={r} fill="var(--color-surface)" />
                    <text
                      x={p.x}
                      y={p.y + 4}
                      textAnchor="middle"
                      className="fill-foreground text-[12px]"
                    >
                      {ch.shortName.slice(0, 2).toUpperCase()}
                    </text>
                  </>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill="none"
                  stroke="var(--color-gold)"
                  strokeOpacity={id === focus ? 0.8 : 0.35}
                />
                <text
                  x={p.x}
                  y={p.y + r + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {ch.shortName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="flex flex-wrap gap-3 border-t border-border/60 px-5 py-4">
        {[...new Set(relationships.flatMap((r) => r.types))].map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-0.5 w-5 rounded" style={{ background: strokeFor[t] }} aria-hidden />
            {relationshipMeta[t].label}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-5 py-4">
        {relationships.map((r) => (
          <Button key={r.id} variant="outline" size="sm" onClick={() => onOpen(r.id)}>
            {r.label}
          </Button>
        ))}
      </div>
    </Panel>
  );
}
