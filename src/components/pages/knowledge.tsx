import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { PageHeader, Panel, EvidenceQuote, ErrorState } from "@/components/app/primitives";
import { Portrait } from "@/components/app/portrait";
import { useWorldMode } from "@/components/app/world-mode";
import { knowledgeMeta, useCharacters, useEvidence } from "./shared";
import { knowledgeService } from "@/services/lorebound";
import { cn } from "@/lib/utils";
import type { KnowledgeState, KnowledgeStateValue, StoryFact } from "@/types/lorebound";

export function KnowledgePage() {
  const { guard } = useWorldMode();
  const facts = useQuery({ queryKey: ["terra", "facts"], queryFn: () => knowledgeService.facts() });
  const states = useQuery({ queryKey: ["terra", "knowledge"], queryFn: () => knowledgeService.states() });
  const columns = useQuery({ queryKey: ["terra", "knowledge-columns"], queryFn: () => knowledgeService.columns() });
  const { byId } = useCharacters();
  const { byId: evidenceById } = useEvidence();

  const [chapter, setChapter] = useState(24);
  const [cell, setCell] = useState<{ fact: StoryFact; characterId: string } | null>(null);

  const stateFor = (factId: string, characterId: string): KnowledgeState | undefined => {
    const row = (states.data ?? []).find((s) => s.factId === factId && s.characterId === characterId);
    if (!row) return undefined;
    if (row.sinceChapter > chapter) {
      return { ...row, state: "does-not-know", confidence: row.confidence };
    }
    return row;
  };

  const loading = facts.isLoading || states.isLoading || columns.isLoading;
  const cols = (columns.data ?? []).filter((id) => byId[id]);
  const selectedState = cell ? stateFor(cell.fact.id, cell.characterId) : undefined;

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Knowledge tracker"
        title="Who knows what—and when"
        lede="Move the chapter marker to see what each character could truthfully say at that point in the story."
      />

      <div className="flex flex-wrap items-center gap-6 pb-6">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="chapter-pos" className="mb-2 block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            Story position — Chapter {chapter}
          </label>
          <Slider
            id="chapter-pos"
            value={[chapter]}
            onValueChange={(v) => setChapter(v[0] ?? 24)}
            min={18}
            max={24}
            step={1}
          />
        </div>
        <ul className="flex flex-wrap gap-3">
          {(Object.keys(knowledgeMeta) as KnowledgeStateValue[]).map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("flex size-5 items-center justify-center rounded border text-[0.7rem]", knowledgeMeta[k].className)} aria-hidden>
                {knowledgeMeta[k].glyph}
              </span>
              {knowledgeMeta[k].label}
            </li>
          ))}
        </ul>
      </div>

      {facts.isError || states.isError ? (
        <ErrorState message="The knowledge matrix didn't load." retry={() => { facts.refetch(); states.refetch(); }} />
      ) : null}

      {loading ? (
        <Skeleton className="h-80 w-full rounded-lg" />
      ) : (
        <>
          {/* Desktop matrix */}
          <Panel className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Character knowledge of each story fact as of Chapter {chapter}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[22rem] bg-surface px-5 py-3 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Story fact
                  </th>
                  {cols.map((id) => (
                    <th key={id} scope="col" className="px-2 py-3 text-center align-bottom">
                      <span className="flex flex-col items-center gap-1.5">
                        <Portrait character={byId[id]!} size="sm" />
                        <span className="text-[0.66rem] text-muted-foreground">{byId[id]!.shortName}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(facts.data ?? []).map((f) => (
                  <tr key={f.id} className="border-t border-border/50">
                    <th scope="row" className="sticky left-0 z-10 bg-surface px-5 py-3 font-normal">
                      <span className="block text-sm text-foreground">{f.statement}</span>
                      <span className="block text-xs text-muted-foreground">
                        True from Chapter {f.becameTrueInChapter}
                      </span>
                    </th>
                    {cols.map((id) => {
                      const st = stateFor(f.id, id)?.state ?? "unknown";
                      const meta = knowledgeMeta[st];
                      const active = cell?.fact.id === f.id && cell.characterId === id;
                      return (
                        <td key={id} className="p-1.5 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setCell({ fact: f, characterId: id })}
                                aria-label={`${byId[id]!.shortName}: ${meta.label} — ${f.statement}`}
                                className={cn(
                                  "mx-auto flex size-8 items-center justify-center rounded border text-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                                  meta.className,
                                  active && "ring-2 ring-gold",
                                )}
                              >
                                <span aria-hidden>{meta.glyph}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {byId[id]!.shortName} — {meta.label}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Mobile: fact-by-fact list, built for narrow screens */}
          <div className="space-y-4 md:hidden">
            {(facts.data ?? []).map((f) => (
              <Panel key={f.id} className="p-4">
                <p className="text-sm text-foreground">{f.statement}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  True from Chapter {f.becameTrueInChapter}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {cols.map((id) => {
                    const st = stateFor(f.id, id)?.state ?? "unknown";
                    const meta = knowledgeMeta[st];
                    return (
                      <li key={id}>
                        <button
                          onClick={() => setCell({ fact: f, characterId: id })}
                          className="flex w-full items-center gap-2.5 rounded-md border border-border/50 px-2.5 py-2 text-left"
                        >
                          <Portrait character={byId[id]!} size="xs" />
                          <span className="flex-1 text-sm text-foreground">{byId[id]!.shortName}</span>
                          <span className={cn("rounded border px-2 py-0.5 text-[0.65rem]", meta.className)}>
                            {meta.glyph} {meta.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ))}
          </div>
        </>
      )}

      <Sheet open={!!cell} onOpenChange={(o) => !o && setCell(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {cell && byId[cell.characterId] ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 font-display text-2xl">
                  <Portrait character={byId[cell.characterId]!} size="md" />
                  {byId[cell.characterId]!.name}
                </SheetTitle>
                <SheetDescription>{cell.fact.statement}</SheetDescription>
              </SheetHeader>

              <dl className="mt-6 space-y-4">
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Knowledge state
                  </dt>
                  <dd className="mt-1.5">
                    <span className={cn("inline-flex items-center gap-2 rounded border px-2.5 py-1 text-sm", knowledgeMeta[selectedState?.state ?? "unknown"].className)}>
                      <span aria-hidden>{knowledgeMeta[selectedState?.state ?? "unknown"].glyph}</span>
                      {knowledgeMeta[selectedState?.state ?? "unknown"].label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Confidence
                  </dt>
                  <dd className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                      <span
                        className="block h-full bg-gold"
                        style={{ width: `${Math.round((selectedState?.confidence ?? 0) * 100)}%` }}
                      />
                    </span>
                    <span className="text-sm text-foreground">
                      {Math.round((selectedState?.confidence ?? 0) * 100)}%
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Learning event
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {selectedState?.learningEvent ?? "No recorded moment of learning."}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <EvidenceQuote evidence={evidenceById[selectedState?.evidenceId ?? ""]} label="Evidence" />
                {!selectedState?.evidenceId ? (
                  <p className="flex items-start gap-2 rounded-md border border-dashed border-border/70 px-3 py-3 text-sm text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    No passage supports this state — Lorebound inferred it from the surrounding
                    scenes.
                  </p>
                ) : null}
              </div>

              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => guard(() => toast.success("Correction recorded for review."))}
              >
                Correct this fact
              </Button>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
