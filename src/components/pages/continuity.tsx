import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Inbox, MessageSquarePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader, Panel, EmptyState, ErrorState, EvidenceQuote, ListSkeleton } from "@/components/app/primitives";
import { useWorldMode } from "@/components/app/world-mode";
import { CharacterChip, useCharacters, useEvidence, severityTone } from "./shared";
import { continuityService } from "@/services/lorebound";
import { cn } from "@/lib/utils";
import type { ContinuityFinding } from "@/types/lorebound";

const filters = [
  { key: "unreviewed", label: "Unreviewed", test: (f: ContinuityFinding) => f.status === "unreviewed" },
  { key: "high", label: "High confidence", test: (f: ContinuityFinding) => f.confidence >= 0.8 },
  { key: "character-knowledge", label: "Character knowledge", test: (f: ContinuityFinding) => f.category === "character-knowledge" },
  { key: "timeline", label: "Timeline", test: (f: ContinuityFinding) => f.category === "timeline" },
  { key: "location", label: "Location", test: (f: ContinuityFinding) => f.category === "location" },
  { key: "relationship", label: "Relationship", test: (f: ContinuityFinding) => f.category === "relationship" },
  { key: "inventory", label: "Inventory", test: (f: ContinuityFinding) => f.category === "inventory" },
  { key: "physical-state", label: "Physical state", test: (f: ContinuityFinding) => f.category === "physical-state" },
  { key: "world-rule", label: "World rule", test: (f: ContinuityFinding) => f.category === "world-rule" },
  { key: "resolved", label: "Resolved", test: (f: ContinuityFinding) => f.status !== "unreviewed" },
];

const actions = [
  { key: "confirmed", label: "Confirm issue" },
  { key: "intentional", label: "Mark intentional" },
  { key: "foreshadowing", label: "Foreshadowing" },
  { key: "explained-later", label: "Explained later" },
  { key: "corrected", label: "Correct extracted fact" },
  { key: "dismissed", label: "Dismiss" },
];

export function ContinuityPage() {
  const { guard, readOnly } = useWorldMode();
  const q = useQuery({ queryKey: ["terra", "findings"], queryFn: () => continuityService.list() });
  const { byId } = useCharacters();
  const { byId: evidenceById } = useEvidence();

  const [active, setActive] = useState<string[]>(["unreviewed"]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [confirming, setConfirming] = useState<{ id: string; action: string } | null>(null);

  const list = (q.data ?? []).filter((f) =>
    active.every((k) => filters.find((x) => x.key === k)?.test(f)),
  );

  async function applyDecision(id: string, action: string) {
    const label = actions.find((a) => a.key === action)?.label ?? action;
    await continuityService.review(id, action);
    setDecisions((d) => ({ ...d, [id]: label }));
    toast.success(`${label} — recorded in the decision history.`);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="Continuity inbox"
        title="Evidence cases"
        lede="Each finding sets the current passage beside the earlier one it disagrees with. You decide what's true."
      />

      <div className="flex flex-wrap gap-1.5 pb-6">
        {filters.map((f) => {
          const on = active.includes(f.key);
          return (
            <button
              key={f.key}
              aria-pressed={on}
              onClick={() => setActive((a) => (on ? a.filter((k) => k !== f.key) : [...a, f.key]))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                on ? "border-gold/50 bg-gold/12 text-gold" : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {q.isError ? <ErrorState message="Findings didn't load." retry={() => q.refetch()} /> : null}

      {q.isLoading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="Nothing to review"
          description="No findings match these filters. Clear a filter to see resolved cases."
        />
      ) : (
        <ul className="space-y-4">
          {list.map((f) => {
            const open = openId === f.id;
            const decided = decisions[f.id];
            return (
              <li key={f.id}>
                <Panel className={cn("transition-colors", open && "border-gold/40")}>
                  <button
                    onClick={() => setOpenId(open ? null : f.id)}
                    aria-expanded={open}
                    className="flex w-full items-start gap-4 px-5 py-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl text-foreground">{f.title}</h2>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[0.62rem] capitalize", severityTone[f.severity])}>
                          {f.severity} severity
                        </span>
                        <Badge variant="outline" className="border-border/70 text-muted-foreground">
                          {Math.round(f.confidence * 100)}% confidence
                        </Badge>
                        <Badge variant="outline" className="border-border/70 capitalize text-muted-foreground">
                          {f.category.replace("-", " ")}
                        </Badge>
                        {decided || f.status !== "unreviewed" ? (
                          <Badge variant="outline" className="border-forest/50 text-forest">
                            {decided ?? f.status}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {f.explanation}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Chapters {f.chapters.join(", ")}
                      </p>
                    </div>
                  </button>

                  {open ? (
                    <div className="animate-rise space-y-5 border-t border-border/60 p-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <EvidenceQuote evidence={evidenceById[f.currentEvidenceId]} label="Current passage" />
                        <EvidenceQuote evidence={evidenceById[f.earlierEvidenceId ?? ""]} label="Earlier conflicting evidence" tone="earlier" />
                      </div>

                      <div>
                        <p className="mb-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                          Related characters
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {f.relatedCharacterIds.map((id) => (
                            <CharacterChip key={id} character={byId[id]} />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-md border-l-2 border-l-plum/60 bg-background/50 px-4 py-3">
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                          Suggested interpretation
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                          {f.suggestedInterpretation}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {actions.map((a) => (
                          <Button
                            key={a.key}
                            variant={a.key === "confirmed" ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              guard(() =>
                                a.key === "dismissed"
                                  ? setConfirming({ id: f.id, action: a.key })
                                  : void applyDecision(f.id, a.key),
                              )
                            }
                          >
                            {a.key === "confirmed" ? <Check className="size-3.5" /> : null}
                            {a.key === "dismissed" ? <X className="size-3.5" /> : null}
                            {a.label}
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => guard(() => setNoteFor(noteFor === f.id ? null : f.id))}
                        >
                          <MessageSquarePlus className="size-3.5" /> Add note
                        </Button>
                      </div>

                      {noteFor === f.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={3}
                            placeholder="Why this reading is right…"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              toast.success("Note attached to this finding.");
                              setNoteText("");
                              setNoteFor(null);
                            }}
                          >
                            Save note
                          </Button>
                        </div>
                      ) : null}

                      <div>
                        <p className="mb-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                          Decision history
                        </p>
                        <ol className="space-y-1.5">
                          {decided ? (
                            <li className="text-sm text-foreground">
                              {decided} <span className="text-muted-foreground">· just now · you</span>
                            </li>
                          ) : null}
                          {f.decisions.length ? (
                            f.decisions.map((d) => (
                              <li key={d.id} className="text-sm text-foreground">
                                {d.label}{" "}
                                <span className="text-muted-foreground">
                                  · {d.at} · {d.by}
                                </span>
                              </li>
                            ))
                          ) : decided ? null : (
                            <li className="text-sm text-muted-foreground">
                              No decisions recorded yet.
                            </li>
                          )}
                        </ol>
                      </div>

                      {readOnly ? (
                        <p className="text-xs text-muted-foreground">
                          Reviewing is available once you have a world of your own.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Dismiss this finding?</AlertDialogTitle>
            <AlertDialogDescription>
              It leaves the inbox and stops appearing in reviews. You can still find it under the
              Resolved filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirming) void applyDecision(confirming.id, confirming.action);
                setConfirming(null);
              }}
            >
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
