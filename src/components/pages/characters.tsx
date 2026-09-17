import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, EmptyState, ErrorState } from "@/components/app/primitives";
import { Portrait } from "@/components/app/portrait";
import { useWorldPath } from "@/components/app/world-mode";
import { WLink, characterSlug, useCharacters } from "./shared";
import { characterService, placeService } from "@/services/lorebound";
import { cn } from "@/lib/utils";

type Filter = { key: string; label: string; test: (c: ReturnType<typeof identity>) => boolean };
const identity = (c: import("@/types/lorebound").Character) => c;

export function CharactersPage() {
  const path = useWorldPath();
  const { list, isLoading, isError, refetch } = useCharacters();
  const identities = useQuery({
    queryKey: ["terra", "identities"],
    queryFn: () => characterService.identities(),
  });
  const places = useQuery({ queryKey: ["terra", "places"], queryFn: () => placeService.list() });

  const [term, setTerm] = useState("");
  const [active, setActive] = useState<string[]>([]);

  const placeName = (id?: string) => places.data?.find((p) => p.id === id)?.name;

  const filters: Filter[] = useMemo(
    () => [
      { key: "major", label: "Major", test: (c) => c.importance === "major" },
      { key: "supporting", label: "Supporting", test: (c) => c.importance === "supporting" },
      { key: "igwe", label: "House Igwe", test: (c) => c.factionId === "ent-igwe" },
      { key: "academy", label: "At the Academy", test: (c) => c.locationId === "loc-academy" },
      { key: "lantern", label: "At The Low Lantern", test: (c) => c.locationId === "loc-lantern" },
      { key: "active", label: "Active", test: (c) => c.status === "active" },
      { key: "absent", label: "Absent", test: (c) => c.status === "absent" },
      { key: "findings", label: "Has unresolved findings", test: (c) => !!c.hasOpenFindings },
      { key: "changed", label: "Recently changed", test: (c) => !!c.recentlyChanged },
    ],
    [],
  );

  const shown = list.filter((c) => {
    const t = term.trim().toLowerCase();
    const matchesTerm =
      !t ||
      `${c.name} ${c.role} ${c.traits.join(" ")}`.toLowerCase().includes(t) ||
      (identities.data ?? []).some(
        (i) => i.ownerCharacterId === c.id && i.name.toLowerCase().includes(t),
      );
    const matchesFilters = active.every((k) => filters.find((f) => f.key === k)?.test(c));
    return matchesTerm && matchesFilters;
  });

  const majors = shown.filter((c) => c.importance === "major");
  const rest = shown.filter((c) => c.importance !== "major");

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Cast"
        title="Characters"
        lede="Eighteen people move through Terra. Some of them are the same person."
      />

      <div className="flex flex-wrap items-center gap-3 pb-6">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search names, roles, identities…"
            aria-label="Search characters"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const on = active.includes(f.key);
            return (
              <button
                key={f.key}
                aria-pressed={on}
                onClick={() =>
                  setActive((a) => (on ? a.filter((k) => k !== f.key) : [...a, f.key]))
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  on
                    ? "border-gold/50 bg-gold/12 text-gold"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {isError ? <ErrorState message="The cast list didn't load." retry={() => refetch()} /> : null}

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="No one matches that"
          description="Try a different name, or clear a filter or two."
        />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {majors.map((c) => {
              const ids = (identities.data ?? []).filter((i) => i.ownerCharacterId === c.id);
              return (
                <WLink
                  key={c.id}
                  to={path(`characters/${characterSlug(c.id)}`)}
                  className="group block rounded-lg border border-border/70 bg-surface/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40"
                >
                  <div className="flex gap-4">
                    <Portrait character={c} size="xl" square className="transition-transform duration-500 group-hover:scale-[1.02]" />
                    <div className="min-w-0">
                      <h2 className="font-display text-xl text-foreground">{c.name}</h2>
                      <p className="text-sm text-muted-foreground">{c.role}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.recentlyChanged ? (
                          <Badge variant="outline" className="border-gold/50 text-gold">
                            Recently changed
                          </Badge>
                        ) : null}
                        {c.hasOpenFindings ? (
                          <Badge variant="outline" className="border-wine/50 text-rose">
                            Open findings
                          </Badge>
                        ) : null}
                        {ids.length ? (
                          <Badge variant="outline" className="border-plum/50 text-plum">
                            {ids.length} {ids.length === 1 ? "identity" : "identities"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {c.biography[0]}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {placeName(c.locationId) ?? "Location unrecorded"} · appears in{" "}
                        {c.appearsInChapters.length} chapters
                      </p>
                    </div>
                  </div>
                </WLink>
              );
            })}
          </div>

          {rest.length ? (
            <ul className="mt-6 divide-y divide-border/50 rounded-lg border border-border/70 bg-surface/50">
              {rest.map((c) => (
                <li key={c.id}>
                  <WLink
                    to={path(`characters/${characterSlug(c.id)}`)}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/50"
                  >
                    <Portrait character={c} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground">{c.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.role}</span>
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {placeName(c.locationId) ?? "—"}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[0.65rem] capitalize",
                        c.status === "active"
                          ? "border-forest/50 text-forest"
                          : "border-border/60 text-muted-foreground",
                      )}
                    >
                      {c.status}
                    </span>
                  </WLink>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
