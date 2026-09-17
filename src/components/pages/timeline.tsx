import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CircleHelp, MapPin, Sparkle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader, EmptyState, ErrorState, EvidenceQuote } from "@/components/app/primitives";
import { CharacterChip, useCharacters, useEvidence } from "./shared";
import { placeService, timelineService } from "@/services/lorebound";
import { cn } from "@/lib/utils";

const typeTone: Record<string, string> = {
  discovery: "border-gold/50 text-gold",
  deception: "border-plum/50 text-plum",
  movement: "border-mist/50 text-mist",
  conflict: "border-wine/50 text-rose",
  bond: "border-forest/50 text-forest",
  political: "border-ember/50 text-ember",
};

export function TimelinePage() {
  const events = useQuery({ queryKey: ["terra", "events"], queryFn: () => timelineService.events() });
  const threads = useQuery({ queryKey: ["terra", "threads"], queryFn: () => timelineService.threads() });
  const places = useQuery({ queryKey: ["terra", "places"], queryFn: () => placeService.list() });
  const { byId } = useCharacters();
  const { byId: evidenceById } = useEvidence();

  const [thread, setThread] = useState("all");
  const [character, setCharacter] = useState("all");
  const [place, setPlace] = useState("all");
  const [type, setType] = useState("all");
  const [range, setRange] = useState<number[]>([18, 24]);
  const [openId, setOpenId] = useState<string | null>(null);

  const all = events.data ?? [];
  const shown = all.filter(
    (e) =>
      (thread === "all" || e.threadIds.includes(thread)) &&
      (character === "all" || e.participantIds.includes(character)) &&
      (place === "all" || e.locationId === place) &&
      (type === "all" || e.type === type) &&
      e.chapter >= (range[0] ?? 1) &&
      e.chapter <= (range[1] ?? 24),
  );

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Chronology"
        title="Timeline"
        lede="What happened, in the order the story lets it happen."
      />

      <div className="flex flex-wrap items-end gap-3 pb-8">
        <Filter label="Plot thread" value={thread} onChange={setThread}
          options={[{ v: "all", l: "All threads" }, ...(threads.data ?? []).map((t) => ({ v: t.id, l: t.title }))]} />
        <Filter label="Character" value={character} onChange={setCharacter}
          options={[{ v: "all", l: "Anyone" }, ...Object.values(byId).map((c) => ({ v: c.id, l: c.shortName }))]} />
        <Filter label="Location" value={place} onChange={setPlace}
          options={[{ v: "all", l: "Anywhere" }, ...(places.data ?? []).map((p) => ({ v: p.id, l: p.name }))]} />
        <Filter label="Event type" value={type} onChange={setType}
          options={[{ v: "all", l: "All types" }, ...Object.keys(typeTone).map((t) => ({ v: t, l: t[0]!.toUpperCase() + t.slice(1) }))]} />
        <div className="min-w-[13rem] flex-1">
          <label className="mb-2 block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            Chapters {range[0]}–{range[1]}
          </label>
          <Slider value={range} onValueChange={setRange} min={1} max={24} step={1} minStepsBetweenThumbs={0} />
        </div>
      </div>

      {events.isError ? (
        <ErrorState message="The chronology didn't load." retry={() => events.refetch()} />
      ) : null}

      {events.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          title="Nothing happens here"
          description="No recorded events match these filters. Widen the chapter range or clear a filter."
        />
      ) : (
        <ol className="relative">
          <span className="absolute bottom-2 left-[5.5rem] top-2 hidden w-px bg-gradient-to-b from-gold/40 via-border to-transparent sm:block" aria-hidden />
          {shown.map((e) => {
            const open = openId === e.id;
            return (
              <li key={e.id} className="relative grid gap-3 pb-6 sm:grid-cols-[5.5rem_1fr]">
                <div className="pt-1 text-right sm:pr-6">
                  <p className="font-display text-xl leading-none text-foreground">Ch {e.chapter}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    {places.data?.find((p) => p.id === e.locationId)?.name ?? "—"}
                  </p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[1.6rem] top-2 hidden size-2.5 rounded-full border border-gold/60 bg-background sm:block" aria-hidden />
                  <button
                    onClick={() => setOpenId(open ? null : e.id)}
                    aria-expanded={open}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3.5 text-left transition-colors",
                      open ? "border-gold/45 bg-surface" : "border-border/60 bg-surface/50 hover:border-gold/30",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg text-foreground">{e.title}</h2>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[0.62rem] capitalize", typeTone[e.type])}>
                        {e.type}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                            {e.verification === "confirmed" ? (
                              <BadgeCheck className="size-3.5 text-forest" aria-hidden />
                            ) : (
                              <CircleHelp className="size-3.5 text-ember" aria-hidden />
                            )}
                            {e.verification}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {e.verification === "confirmed"
                            ? "Backed by a passage in the manuscript."
                            : "Inferred from surrounding scenes — no direct passage."}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground/80">
                      <Sparkle className="mt-1 size-3 shrink-0 text-gold" aria-hidden />
                      {e.consequence}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {e.participantIds.map((id) => (
                        <CharacterChip key={id} character={byId[id]} />
                      ))}
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" aria-hidden />
                        {places.data?.find((p) => p.id === e.locationId)?.name ?? "Unrecorded"}
                      </span>
                    </div>
                  </button>
                  {open ? (
                    <div className="mt-2 space-y-2 animate-rise">
                      {e.evidenceIds.map((id) => (
                        <EvidenceQuote key={id} evidence={evidenceById[id]} label="Evidence" />
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[11rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v}>
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
