import { cn } from "@/lib/utils";
import type { Character } from "@/types/lorebound";

const accentRing: Record<NonNullable<Character["accent"]>, string> = {
  gold: "ring-gold/45 bg-gold/15 text-gold",
  forest: "ring-forest/45 bg-forest/15 text-forest",
  plum: "ring-plum/50 bg-plum/15 text-plum",
  wine: "ring-wine/50 bg-wine/15 text-wine",
  mist: "ring-mist/45 bg-mist/15 text-mist",
  ember: "ring-ember/45 bg-ember/15 text-ember",
  rose: "ring-rose/45 bg-rose/15 text-rose",
};

const sizes = {
  xs: "size-7 text-[0.6rem]",
  sm: "size-9 text-[0.68rem]",
  md: "size-12 text-xs",
  lg: "size-16 text-sm",
  xl: "size-24 text-base",
};

export function Portrait({
  character,
  size = "md",
  className,
  square,
}: {
  character: Pick<Character, "name" | "shortName" | "portraitUrl" | "accent">;
  size?: keyof typeof sizes;
  className?: string;
  square?: boolean;
}) {
  const initials = character.shortName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-medium uppercase tracking-wide ring-1",
        square ? "rounded-md" : "rounded-full",
        sizes[size],
        accentRing[character.accent ?? "gold"],
        className,
      )}
      title={character.name}
    >
      {character.portraitUrl ? (
        <img
          src={character.portraitUrl}
          alt={character.name}
          loading="lazy"
          className="size-full object-cover object-top"
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
      {character.portraitUrl ? null : <span className="sr-only">{character.name}</span>}
    </span>
  );
}
