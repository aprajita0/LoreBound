import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  Eye,
  KeyRound,
  Landmark,
  Link2,
  ScrollText,
  Search,
  ShieldAlert,
  Sparkle,
  User as UserIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchService } from "@/services/lorebound";
import type { AnswerResult, SearchResult } from "@/types/lorebound";
import { Badge } from "@/components/ui/badge";
import { useWorldMode } from "./world-mode";

const kindIcon: Record<SearchResult["kind"], typeof UserIcon> = {
  character: UserIcon,
  identity: Eye,
  chapter: BookOpen,
  event: CalendarClock,
  location: Landmark,
  lore: ScrollText,
  relationship: Link2,
  secret: KeyRound,
  fact: Sparkle,
  finding: ShieldAlert,
};

const kindLabel: Record<SearchResult["kind"], string> = {
  character: "Characters",
  identity: "Identities",
  chapter: "Chapters",
  event: "Events",
  location: "Places",
  lore: "Lore",
  relationship: "Relationships",
  secret: "Secrets",
  fact: "Story facts",
  finding: "Continuity",
};

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { base } = useWorldMode();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const [r, a] = await Promise.all([searchService.query(term), searchService.answer(term)]);
      if (cancelled) return;
      setResults(r);
      setAnswer(a);
      setLoading(false);
    }, 130);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [term]);

  const groups = Array.from(new Set(results.map((r) => r.kind)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search this world — try “Who knows Mira is Omir?”"
        value={term}
        onValueChange={setTerm}
      />
      <CommandList className="max-h-[26rem]">
        {answer ? (
          <div className="border-b border-border/60 bg-surface/60 px-4 py-3.5">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-gold-soft">
              Structured answer
            </p>
            <p className="mt-1 text-sm text-foreground">{answer.answer}</p>
            <ul className="mt-2.5 space-y-1">
              {answer.rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">{row.label}</span>
                  <span className="text-muted-foreground">{row.value}</span>
                </li>
              ))}
            </ul>
            {answer.evidence.map((e) => (
              <p key={e.id} className="mt-2.5 border-l-2 border-gold/50 pl-3 font-display text-sm text-foreground/85">
                &ldquo;{e.passage}&rdquo;
                <span className="mt-1 block font-sans text-xs text-muted-foreground">
                  {e.locationInChapter}
                </span>
              </p>
            ))}
          </div>
        ) : null}

        {!loading && results.length === 0 ? (
          <CommandEmpty>Nothing in this world matches that yet.</CommandEmpty>
        ) : null}

        {groups.map((kind) => {
          const Icon = kindIcon[kind];
          return (
            <CommandGroup key={kind} heading={kindLabel[kind]}>
              {results
                .filter((r) => r.kind === kind)
                .map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.id}
                    onSelect={() => {
                      onOpenChange(false);
                      navigate({ to: `${base}/${r.to}` });
                    }}
                    className="gap-3"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{r.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          );
        })}
      </CommandList>
      <div className="flex items-center gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
        <Search className="size-3" aria-hidden />
        Characters, identities, chapters, events, places, lore, relationships, secrets, facts and findings.
        <Badge variant="outline" className="ml-auto font-mono text-[0.65rem]">
          ⌘K
        </Badge>
      </div>
    </CommandDialog>
  );
}
