import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader, Panel, EvidenceQuote, ErrorState } from "@/components/app/primitives";
import { CharacterChip, useCharacters, useEvidence } from "./shared";
import { loreService } from "@/services/lorebound";

const categoryTone: Record<string, string> = {
  bloodline: "text-wine",
  place: "text-mist",
  bond: "text-plum",
  creature: "text-forest",
  law: "text-ember",
  custom: "text-gold",
  magic: "text-gold-soft",
};

export function LorePage() {
  const lore = useQuery({ queryKey: ["terra", "lore"], queryFn: () => loreService.list() });
  const { byId } = useCharacters();
  const { byId: evidenceById } = useEvidence();

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 lg:py-12">
      <PageHeader
        eyebrow="World knowledge"
        title="Lore"
        lede="The rules, bloodlines, and bonds the story treats as true — each traced to the page that said so."
      />

      {lore.isError ? <ErrorState message="Lore didn't load." retry={() => lore.refetch()} /> : null}

      {lore.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Panel className="px-5 sm:px-7">
          <Accordion type="single" collapsible defaultValue={lore.data?.[0]?.id ?? ""}>
            {(lore.data ?? []).map((entry) => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger className="text-left">
                  <span>
                    <span className="block font-display text-xl text-foreground">{entry.title}</span>
                    <span className={`mt-0.5 block text-[0.65rem] uppercase tracking-[0.18em] ${categoryTone[entry.category] ?? "text-muted-foreground"}`}>
                      {entry.category}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-[0.95rem] text-muted-foreground">{entry.summary}</p>
                  <div className="mt-4 space-y-3">
                    {entry.body.map((para, i) => (
                      <p key={i} className="font-display text-[1.05rem] leading-relaxed text-foreground/90">
                        {para}
                      </p>
                    ))}
                  </div>
                  {entry.relatedCharacterIds.length ? (
                    <div className="mt-5">
                      <p className="mb-2 text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Relevant characters
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.relatedCharacterIds.map((id) => (
                          <CharacterChip key={id} character={byId[id]} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-5 space-y-3">
                    {entry.evidenceIds.map((id) => (
                      <EvidenceQuote key={id} evidence={evidenceById[id]} label="Source passage" />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Panel>
      )}
    </div>
  );
}
