import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NodeKind = "character" | "identity" | "place" | "concept" | "creature";

interface WorldNode {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
  detail: { heading: string; lines: string[] };
}

const NODES: WorldNode[] = [
  {
    id: "omir",
    label: "Omir",
    kind: "character",
    x: 256,
    y: 176,
    detail: {
      heading: "Omir",
      lines: [
        "Student and hidden Igwe heir",
        "Appears in 12 chapters",
        "Holds 5 secrets",
        "Keeps 2 identities",
        "Connected to 4 continuity findings",
      ],
    },
  },
  {
    id: "mira",
    label: "Mira",
    kind: "identity",
    x: 96,
    y: 62,
    detail: {
      heading: "Mira",
      lines: [
        "Hidden identity of Omir",
        "Created in Chapter 20",
        "Known by Omir",
        "Suspected by Aria",
        "Connected to two continuity findings",
      ],
    },
  },
  {
    id: "identity",
    label: "Hidden identity",
    kind: "concept",
    x: 176,
    y: 300,
    detail: {
      heading: "Hidden identity",
      lines: [
        "Fact type recorded by Lorebound",
        "True from Chapter 20",
        "1 identity currently active",
        "Evidence: the mirror passage",
      ],
    },
  },
  {
    id: "lynx",
    label: "Lynx",
    kind: "character",
    x: 88,
    y: 214,
    detail: {
      heading: "Lynx",
      lines: [
        "Omir's familiar",
        "Registered as an eagle",
        "Bonded since Chapter 6",
        "True species recorded in Chapter 23",
      ],
    },
  },
  {
    id: "griffin",
    label: "Griffin",
    kind: "creature",
    x: 62,
    y: 338,
    detail: {
      heading: "Griffin",
      lines: [
        "True species of Lynx",
        "Contradicts the Academy register",
        "Known by Omir only",
        "Evidence: the shadow on the wall, Chapter 23",
      ],
    },
  },
  {
    id: "lantern",
    label: "The Low Lantern",
    kind: "place",
    x: 404,
    y: 86,
    detail: {
      heading: "The Low Lantern",
      lines: [
        "Tavern in the harbour quarter",
        "Appears in 5 chapters",
        "Mira's current location",
        "Visited 4 times by the Mokshan delegation",
      ],
    },
  },
  {
    id: "vow",
    label: "Vow-breaker",
    kind: "concept",
    x: 416,
    y: 278,
    detail: {
      heading: "Vow-breaker",
      lines: [
        "Open plot thread",
        "Investigation approaching a turning point",
        "Chapters 18 – 24",
        "1 high-confidence continuity finding",
      ],
    },
  },
];

const EDGES: { from: string; to: string; label: string }[] = [
  { from: "omir", to: "mira", label: "hidden identity" },
  { from: "omir", to: "lynx", label: "familiar bond" },
  { from: "lynx", to: "griffin", label: "true species" },
  { from: "mira", to: "lantern", label: "current location" },
  { from: "lantern", to: "vow", label: "investigation" },
  { from: "omir", to: "identity", label: "carries" },
];

const W = 500;
const H = 400;

const kindStyle: Record<NodeKind, string> = {
  character: "border-gold/55 bg-gold/12 text-foreground",
  identity: "border-plum/60 bg-plum/15 text-foreground",
  place: "border-mist/55 bg-mist/12 text-foreground",
  concept: "border-forest/55 bg-forest/12 text-foreground",
  creature: "border-ember/55 bg-ember/12 text-foreground",
};

export function WorldWindow({ coverUrl }: { coverUrl: string }) {
  const [selectedId, setSelectedId] = useState("mira");
  const selected = NODES.find((n) => n.id === selectedId)!;
  const byId: Record<string, WorldNode> = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <figure className="overflow-hidden rounded-xl border border-gold/25 bg-surface/90 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
      {/* Cover + title band */}
      <div className="relative">
        <img
          src={coverUrl}
          alt="Cover artwork for The Isles of Terra: green stone islands at dusk"
          width={1024}
          height={1344}
          className="h-48 w-full object-cover object-[center_28%] sm:h-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4 sm:px-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-2xl text-foreground sm:text-[1.75rem]">
              The Isles of Terra
            </h2>
            <span className="text-[0.7rem] uppercase tracking-[0.2em] text-gold-soft">
              Epic Fantasy
            </span>
            <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              Chapter 24
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A hidden heir follows a foreign delegate through borrowed identities and broken vows.
          </p>
        </div>
      </div>

      <div className="grid gap-0 border-t border-border/60 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Connected elements */}
        <div className="relative border-b border-border/60 p-4 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-[0.66rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Connected elements
          </p>
          <div className="relative mx-auto w-full max-w-[500px]" style={{ aspectRatio: `${W}/${H}` }}>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="absolute inset-0 size-full"
              aria-hidden
              role="presentation"
            >
              {EDGES.map((e, i) => {
                const a = byId[e.from]!;
                const b = byId[e.to]!;
                const active = selectedId === e.from || selectedId === e.to;
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                return (
                  <g key={`${e.from}-${e.to}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={active ? "var(--color-gold)" : "var(--color-border)"}
                      strokeWidth={active ? 1.4 : 1}
                      className="animate-draw transition-[stroke] duration-500"
                      style={{ ["--lb-dash" as string]: 420, animationDelay: `${i * 90}ms` }}
                    />
                    <text
                      x={mx}
                      y={my - 5}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px] uppercase"
                      style={{
                        letterSpacing: "0.12em",
                        fill: active ? "var(--color-gold-soft)" : "var(--color-muted-foreground)",
                      }}
                    >
                      {e.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {NODES.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                aria-pressed={selectedId === n.id}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.72rem] font-medium transition-all duration-300",
                  kindStyle[n.kind],
                  selectedId === n.id
                    ? "scale-105 border-gold bg-gold/25 shadow-[0_0_0_4px_color-mix(in_oklch,var(--color-gold)_12%,transparent)]"
                    : "hover:border-gold/70",
                )}
                style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` }}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Attached details panel */}
        <div className="flex flex-col p-5">
          <p className="text-[0.66rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Selected element
          </p>
          <h3 key={selected.id} className="animate-rise mt-2 font-display text-2xl text-foreground">
            {selected.detail.heading}
          </h3>
          <dl className="mt-3 space-y-2 border-t border-border/60 pt-3">
            {selected.detail.lines.map((line) => (
              <dd key={line} className="text-sm leading-relaxed text-muted-foreground">
                {line}
              </dd>
            ))}
          </dl>
          <div className="mt-auto pt-5">
            <Button asChild variant="outline" className="w-full border-gold/40 text-foreground">
              <Link to="/demo/terra">
                Enter This World
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </figure>
  );
}
