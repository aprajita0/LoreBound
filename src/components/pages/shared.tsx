import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { characterService, evidenceService } from "@/services/lorebound";
import type { Character, KnowledgeStateValue, RelationshipType } from "@/types/lorebound";
import { Portrait } from "@/components/app/portrait";
import { useWorldPath } from "@/components/app/world-mode";
import { cn } from "@/lib/utils";

/** All Terra characters keyed by id — every page needs names for ids. */
export function useCharacters() {
  const q = useQuery({ queryKey: ["terra", "characters"], queryFn: () => characterService.list() });
  const byId: Record<string, Character> = {};
  for (const c of q.data ?? []) byId[c.id] = c;
  return { ...q, byId, list: q.data ?? [] };
}

export function useEvidence() {
  const q = useQuery({ queryKey: ["terra", "evidence"], queryFn: () => evidenceService.list() });
  const byId = Object.fromEntries((q.data ?? []).map((e) => [e.id, e]));
  return { ...q, byId };
}

/**
 * Link for paths built at runtime (demo vs authenticated bases). TanStack's
 * `to` is a literal union; these paths are validated by the route tree at
 * build time, so the cast is safe here.
 */
export function WLink({
  to,
  children,
  className,
  onClick,
  title,
  "aria-current": ariaCurrent,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  "aria-current"?: "page";
}) {
  return (
    <Link
      to={to as never}
      className={className}
      onClick={onClick}
      title={title}
      aria-current={ariaCurrent}
    >
      {children}
    </Link>
  );
}

export function characterSlug(id: string) {
  return id.replace(/^ch-/, "");
}

export function CharacterChip({
  character,
  size = "xs",
}: {
  character?: Character | undefined;
  size?: "xs" | "sm" | undefined;
}) {
  const path = useWorldPath();
  if (!character) return null;
  return (
    <WLink
      to={path(`characters/${characterSlug(character.id)}`)}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 py-0.5 pl-0.5 pr-2.5 text-xs text-foreground transition-colors hover:border-gold/50 hover:bg-accent/60"
    >
      <Portrait character={character} size={size} />
      {character.shortName}
    </WLink>
  );
}

/* --------------------------------------------------------- knowledge ---- */

export const knowledgeMeta: Record<
  KnowledgeStateValue,
  { label: string; glyph: string; className: string; dot: string }
> = {
  knows: {
    label: "Knows",
    glyph: "●",
    className: "bg-forest/18 text-forest border-forest/40",
    dot: "bg-forest",
  },
  suspects: {
    label: "Suspects",
    glyph: "◐",
    className: "bg-gold/15 text-gold border-gold/40",
    dot: "bg-gold",
  },
  "believes-incorrectly": {
    label: "Believes incorrectly",
    glyph: "✕",
    className: "bg-wine/18 text-rose border-wine/45",
    dot: "bg-wine",
  },
  "does-not-know": {
    label: "Does not know",
    glyph: "○",
    className: "bg-transparent text-muted-foreground border-border/60",
    dot: "bg-muted-foreground/50",
  },
  unknown: {
    label: "Unknown to Lorebound",
    glyph: "–",
    className: "bg-muted/40 text-muted-foreground border-dashed border-border/70",
    dot: "bg-muted-foreground/30",
  },
};

/* ------------------------------------------------------ relationships ---- */

export const relationshipMeta: Record<RelationshipType, { label: string; className: string }> = {
  soulbond: { label: "Soulbond", className: "border-plum/50 text-plum" },
  "found-family": { label: "Found family", className: "border-gold/45 text-gold-soft" },
  family: { label: "Family", className: "border-parchment/40 text-parchment" },
  "romantic-interest": { label: "Romantic interest", className: "border-rose/50 text-rose" },
  friendship: { label: "Friendship", className: "border-mist/50 text-mist" },
  alliance: { label: "Alliance", className: "border-forest/50 text-forest" },
  "political-tension": { label: "Political tension", className: "border-ember/50 text-ember" },
  "familiar-bond": { label: "Familiar bond", className: "border-gold/50 text-gold" },
  suspicion: { label: "Suspicion", className: "border-ember/45 text-ember" },
  secrecy: { label: "Secrecy", className: "border-wine/45 text-rose" },
  mentorship: { label: "Mentorship", className: "border-mist/45 text-mist" },
};

export function TypeTag({ type }: { type: RelationshipType }) {
  const meta = relationshipMeta[type];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[0.68rem] leading-relaxed",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

/* --------------------------------------------------------------- misc ---- */

export function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(7.5rem,auto)_1fr] gap-3 py-2">
      <dt className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export const severityTone: Record<string, string> = {
  high: "border-wine/50 bg-wine/15 text-rose",
  medium: "border-ember/45 bg-ember/12 text-ember",
  low: "border-mist/45 bg-mist/12 text-mist",
  "world-shaking": "border-wine/50 bg-wine/15 text-rose",
  dangerous: "border-ember/45 bg-ember/12 text-ember",
  personal: "border-plum/45 bg-plum/12 text-plum",
};

export const chapterStatusMeta: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-border/70 text-muted-foreground" },
  "ready-for-analysis": { label: "Ready for analysis", className: "border-mist/50 text-mist" },
  processing: { label: "Processing", className: "border-gold/50 text-gold" },
  reviewed: { label: "Reviewed", className: "border-forest/50 text-forest" },
  "needs-attention": { label: "Needs attention", className: "border-wine/50 text-rose" },
};
