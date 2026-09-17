import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, ShieldAlert, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, Panel, PanelTitle, EvidenceQuote, ErrorState } from "@/components/app/primitives";
import { useWorldPath } from "@/components/app/world-mode";
import { CharacterChip, WLink, useCharacters, useEvidence, severityTone } from "./shared";
import { continuityService, secretService } from "@/services/lorebound";
import { cn } from "@/lib/utils";

export function SecretsPage() {
  const path = useWorldPath();
  const secrets = useQuery({ queryKey: ["terra", "secrets"], queryFn: () => secretService.list() });
  const findings = useQuery({ queryKey: ["terra", "findings"], queryFn: () => continuityService.list() });
  const { byId } = useCharacters();
  const { byId: evidenceById } = useEvidence();
  const [openId, setOpenId] = useState<string | null>(null);

  const list = secrets.data ?? [];
  const selected = list.find((s) => s.id === openId) ?? list[0];

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Vault"
        title="Secrets"
        lede="A secret is a fact plus the people it is being kept from."
      />

      {secrets.isError ? (
        <ErrorState message="The vault didn't open." retry={() => secrets.refetch()} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]">
        <ul className="space-y-2.5">
          {secrets.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
            : list.map((s) => {
                const open = selected?.id === s.id;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setOpenId(s.id)}
                      aria-current={open ? "true" : undefined}
                      className={cn(
                        "w-full rounded-lg border px-4 py-4 text-left transition-all duration-300",
                        open
                          ? "border-gold/45 bg-surface"
                          : "border-border/60 bg-surface/40 hover:border-gold/30",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Lock className={cn("mt-0.5 size-4 shrink-0", open ? "text-gold" : "text-muted-foreground")} aria-hidden />
                        <div className="min-w-0">
                          <p className="font-display text-lg leading-snug text-foreground">{s.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.detail}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[0.62rem]", severityTone[s.severity])}>
                              {s.severity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Created Ch {s.createdInChapter}
                              {s.revealedInChapter ? ` · revealed Ch ${s.revealedInChapter}` : " · still hidden"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
        </ul>

        {selected ? (
          <div key={selected.id} className="animate-rise space-y-5">
            <Panel className="p-6 sm:p-7">
              <h2 className="font-display text-2xl text-foreground">{selected.title}</h2>
              <p className="mt-2 text-[1.02rem] leading-relaxed text-muted-foreground">
                {selected.detail}
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Group icon={<Eye className="size-3.5 text-forest" />} label="Knows" ids={selected.knownByIds} byId={byId} />
                <Group icon={<TriangleAlert className="size-3.5 text-gold" />} label="Suspects" ids={selected.suspectedByIds} byId={byId} />
                <Group icon={<ShieldAlert className="size-3.5 text-wine" />} label="Believes incorrectly" ids={selected.believesFalselyIds} byId={byId} />
                <Group icon={<EyeOff className="size-3.5 text-ember" />} label="Must not know" ids={selected.mustNotKnowIds} byId={byId} />
              </div>
            </Panel>

            <Panel>
              <PanelTitle>Supporting passages</PanelTitle>
              <div className="space-y-3 p-5">
                {selected.evidenceIds.map((id) => (
                  <EvidenceQuote key={id} evidence={evidenceById[id]} label="Evidence" />
                ))}
              </div>
            </Panel>

            {selected.findingIds.length ? (
              <Panel>
                <PanelTitle
                  action={
                    <WLink to={path("continuity")} className="text-xs text-gold underline-offset-4 hover:underline">
                      Continuity inbox
                    </WLink>
                  }
                >
                  Related findings
                </PanelTitle>
                <ul className="divide-y divide-border/50">
                  {selected.findingIds.map((id) => {
                    const f = findings.data?.find((x) => x.id === id);
                    return (
                      <li key={id} className="px-5 py-3.5">
                        <p className="text-sm text-foreground">{f?.title ?? id}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{f?.explanation}</p>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Group({
  icon,
  label,
  ids,
  byId,
}: {
  icon: React.ReactNode;
  label: string;
  ids: string[];
  byId: Record<string, import("@/types/lorebound").Character>;
}) {
  return (
    <section>
      <h3 className="mb-2 inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {ids.length ? (
          ids.map((id) => <CharacterChip key={id} character={byId[id]} />)
        ) : (
          <span className="text-sm text-muted-foreground">No one recorded.</span>
        )}
      </div>
    </section>
  );
}
