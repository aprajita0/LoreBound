import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, EyeOff, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, Panel, EvidenceQuote, ErrorState } from "@/components/app/primitives";
import { CharacterChip, useCharacters, useEvidence } from "./shared";
import { placeService, secretService, timelineService } from "@/services/lorebound";
import { cn } from "@/lib/utils";

export function PlacesPage() {
  const places = useQuery({ queryKey: ["terra", "places"], queryFn: () => placeService.list() });
  const events = useQuery({ queryKey: ["terra", "events"], queryFn: () => timelineService.events() });
  const secrets = useQuery({ queryKey: ["terra", "secrets"], queryFn: () => secretService.list() });
  const { byId } = useCharacters();
  const { byId: evidenceById } = useEvidence();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = places.data ?? [];
  const selected = list.find((p) => p.id === selectedId) ?? list[0];

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Geography"
        title="Places"
        lede="Stone remembers. These are the rooms and shores the story keeps returning to."
      />

      {places.isError ? (
        <ErrorState message="Locations didn't load." retry={() => places.refetch()} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,34fr)_minmax(0,66fr)]">
        <ul className="space-y-2">
          {places.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            : list.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    aria-current={selected?.id === p.id ? "true" : undefined}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3.5 text-left transition-colors",
                      selected?.id === p.id
                        ? "border-gold/45 bg-surface"
                        : "border-border/60 bg-surface/40 hover:border-gold/30",
                    )}
                  >
                    <p className="flex items-center gap-2 font-display text-lg text-foreground">
                      <MapPin className="size-4 text-mist" aria-hidden />
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {p.kind} · chapters {p.chapters.join(", ")}
                    </p>
                  </button>
                </li>
              ))}
        </ul>

        {selected ? (
          <Panel key={selected.id} className="animate-rise p-6 sm:p-8">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-gold-soft">{selected.kind}</p>
            <h2 className="mt-1 font-display text-3xl text-foreground">{selected.name}</h2>
            <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-muted-foreground">
              {selected.description}
            </p>

            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <section>
                <h3 className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Characters present
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.presentCharacterIds.map((id) => (
                    <CharacterChip key={id} character={byId[id]} />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Travel
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {selected.travelLinks.map((t) => (
                    <li key={t.toLocationId} className="flex items-baseline gap-2 text-sm">
                      <ArrowRight className="size-3 shrink-0 translate-y-0.5 text-gold" aria-hidden />
                      <span className="text-foreground">
                        {list.find((p) => p.id === t.toLocationId)?.name ?? t.toLocationId}
                      </span>
                      <span className="text-muted-foreground">— {t.detail}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Events here
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {(events.data ?? [])
                    .filter((e) => e.locationId === selected.id)
                    .map((e) => (
                      <li key={e.id} className="text-sm">
                        <span className="text-muted-foreground">Ch {e.chapter} · </span>
                        <span className="text-foreground">{e.title}</span>
                      </li>
                    ))}
                </ul>
              </section>

              <section>
                <h3 className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Secrets held here
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {selected.secretIds.length ? (
                    selected.secretIds.map((id) => (
                      <li key={id} className="flex items-baseline gap-2 text-sm">
                        <EyeOff className="size-3 shrink-0 translate-y-0.5 text-wine" aria-hidden />
                        <span className="text-foreground">
                          {secrets.data?.find((s) => s.id === id)?.title ?? id}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">None recorded.</li>
                  )}
                </ul>
              </section>
            </div>

            <div className="mt-8 space-y-3 border-t border-border/60 pt-6">
              {selected.evidenceIds.map((id) => (
                <EvidenceQuote key={id} evidence={evidenceById[id]} label="From the manuscript" />
              ))}
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
