import { useState } from "react";
import {
  Camera,
  Check,
  Eye,
  History,
  KeyRound,
  Link2,
  Lock,
  MapPin,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CharacterChip, WLink, chapterStatusMeta, useCharacters } from "./shared";
import { useWorldMode, useWorldPath } from "@/components/app/world-mode";
import type { OutlineStatus, Snapshot } from "@/lib/manuscript-store";
import type { SceneMemory } from "@/data/terra-manuscript";
import type { Chapter } from "@/types/lorebound";
import type { StudioPart } from "@/data/terra-manuscript";

/** A scene as the studio sees it — base mock data plus local overrides. */
export interface SceneNode {
  id: string;
  chapterId: string;
  chapterNumber: number;
  number: number;
  title: string;
  summary: string;
  body: string[];
  memory: SceneMemory;
  archived: boolean;
  status: OutlineStatus;
}

export const outlineColumns: { key: OutlineStatus; label: string }[] = [
  { key: "planned", label: "Planned" },
  { key: "drafting", label: "Drafting" },
  { key: "revised", label: "Revised" },
  { key: "final", label: "Final" },
];

/* --------------------------------------------------------- story memory ---- */

function MemoryBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Users;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/50 px-4 py-3.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="size-3" aria-hidden />
        {title}
      </p>
      {children}
    </div>
  );
}

function MemoryLinks({
  icon,
  title,
  items,
  to,
  tone,
}: {
  icon: typeof Users;
  title: string;
  items: string[];
  to: string;
  tone?: "wine" | undefined;
}) {
  return (
    <MemoryBlock icon={icon} title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded for this scene.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i}>
              <WLink
                to={to}
                className={cn(
                  "text-sm leading-relaxed underline-offset-4 hover:underline",
                  tone === "wine" ? "text-wine" : "text-foreground/90 hover:text-gold",
                )}
              >
                {i}
              </WLink>
            </li>
          ))}
        </ul>
      )}
    </MemoryBlock>
  );
}

export function StoryMemory({
  scene,
  identities,
  unreviewed,
  quiet,
  onClose,
}: {
  scene: SceneNode;
  identities: string[];
  unreviewed: number;
  quiet: boolean;
  onClose: () => void;
}) {
  const path = useWorldPath();
  const { byId } = useCharacters();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="font-display text-lg">Story Memory</h2>
          <p className="text-xs text-muted-foreground">What Lorebound holds for this scene.</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Collapse story memory"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MemoryBlock icon={Users} title="Characters present">
          <div className="flex flex-wrap gap-1.5">
            {scene.memory.characterIds.map((id) => (
              <CharacterChip key={id} character={byId[id]} />
            ))}
          </div>
        </MemoryBlock>

        <MemoryBlock icon={MapPin} title="Location">
          <WLink
            to={path("places")}
            className="text-sm text-foreground underline-offset-4 hover:text-gold hover:underline"
          >
            {scene.memory.location}
          </WLink>
        </MemoryBlock>

        <MemoryBlock icon={Users} title="Active identities">
          {identities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No borrowed identity in this scene.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {identities.map((name) => (
                <WLink
                  key={name}
                  to={path("characters")}
                  className="rounded-full border border-plum/40 px-2 py-0.5 text-xs text-foreground hover:bg-plum/10"
                >
                  {name}
                </WLink>
              ))}
            </div>
          )}
        </MemoryBlock>

        <MemoryLinks
          icon={Eye}
          title="What each character knows"
          items={scene.memory.knowledge}
          to={path("knowledge")}
        />
        <MemoryLinks
          icon={KeyRound}
          title="Active secrets"
          items={scene.memory.secrets}
          to={path("secrets")}
        />
        <MemoryLinks
          icon={ScrollText}
          title="Relevant lore"
          items={scene.memory.lore}
          to={path("lore")}
        />
        <MemoryLinks
          icon={Link2}
          title="Open plot threads"
          items={scene.memory.threads}
          to={path("timeline")}
        />
        {quiet ? (
          <MemoryLinks
            icon={ShieldAlert}
            title="Possible continuity concerns"
            items={scene.memory.concerns}
            to={path("continuity")}
            tone="wine"
          />
        ) : (
          <MemoryBlock icon={ShieldAlert} title="Possible continuity concerns">
            <p className="text-sm text-muted-foreground">
              Held back while drafting. Switch to Quiet Analysis to see{" "}
              {scene.memory.concerns.length} for this scene.
            </p>
          </MemoryBlock>
        )}
      </div>

      <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
        <WLink to={path("continuity")} className="underline-offset-4 hover:text-gold hover:underline">
          {unreviewed} findings await review across the world.
        </WLink>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- outline ---- */

export function OutlineBoard({
  scenes,
  onMove,
  onOpen,
}: {
  scenes: SceneNode[];
  onMove: (sceneId: string, status: OutlineStatus) => void;
  onOpen: (sceneId: string) => void;
}) {
  const [over, setOver] = useState<OutlineStatus | null>(null);
  return (
    <div className="grid gap-4 px-5 py-8 sm:px-8 lg:grid-cols-4">
      {outlineColumns.map((col) => {
        const items = scenes.filter((s) => s.status === col.key);
        return (
          <section
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.key);
            }}
            onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) onMove(id, col.key);
            }}
            className={cn(
              "rounded-lg border border-border/60 bg-surface/50 p-3 transition-colors",
              over === col.key && "border-gold/50 bg-gold/5",
            )}
          >
            <p className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.18em] text-gold-soft">
              {col.label}
              <span className="text-muted-foreground">{items.length}</span>
            </p>
            <ul className="mt-3 space-y-2">
              {items.map((s) => (
                <li key={s.id}>
                  <div
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", s.id)}
                    className="cursor-grab rounded-md border border-border/70 bg-background/70 p-3 active:cursor-grabbing"
                  >
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Chapter {s.chapterNumber} · Scene {s.number}
                    </p>
                    <button
                      onClick={() => onOpen(s.id)}
                      className="mt-1 text-left text-sm text-foreground underline-offset-4 hover:text-gold hover:underline"
                    >
                      {s.title}
                    </button>
                  </div>
                </li>
              ))}
              {items.length === 0 ? (
                <li className="rounded-md border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
                  Drag a scene here
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- chapters ---- */

export function ChaptersTable({
  parts,
  chapters,
  scenesOf,
  titleOf,
  findingsFor,
  povOf,
  onOpen,
}: {
  parts: StudioPart[];
  chapters: Chapter[];
  scenesOf: (chapterId: string) => SceneNode[];
  titleOf: (chapter: Chapter) => string;
  findingsFor: (chapterNumber: number) => number;
  povOf: (chapterNumber: number) => string;
  onOpen: (sceneId: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <h2 className="font-display text-2xl">Chapters</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Parts, chapters and scenes with point of view, status, length and open findings.
      </p>
      <div className="mt-8 space-y-8">
        {parts.map((part) => (
          <section key={part.id}>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold-soft">{part.subtitle}</p>
            <h3 className="mt-1 font-display text-xl">{part.title}</h3>
            <ul className="mt-4 divide-y divide-border/60 rounded-lg border border-border/70 bg-surface/70">
              {part.chapterNumbers
                .map((n) => chapters.find((c) => c.number === n))
                .filter((c): c is Chapter => Boolean(c))
                .map((c) => {
                  const meta = chapterStatusMeta[c.status]!;
                  const scenes = scenesOf(c.id);
                  const findings = findingsFor(c.number);
                  return (
                    <li key={c.id} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">
                            Chapter {c.number} — {titleOf(c)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{c.summary}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">POV: {povOf(c.number)}</span>
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {c.wordCount.toLocaleString()} words
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            findings ? "text-wine" : "text-muted-foreground",
                          )}
                        >
                          {findings} findings
                        </span>
                      </div>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {scenes.map((s) => (
                          <li key={s.id}>
                            <button
                              onClick={() => onOpen(s.id)}
                              className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
                            >
                              {s.number}. {s.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- versions ---- */

const autosaves = [
  { id: "auto-1", when: "Two hours ago", note: "Autosave — added the vow-stone passage", words: 4180 },
  { id: "auto-2", when: "Yesterday, 21:04", note: "Autosave — rewrote the delegate's entrance", words: 3905 },
  { id: "auto-3", when: "Yesterday, 09:12", note: "Autosave — first full draft", words: 3540 },
  { id: "auto-4", when: "Three days ago", note: "Autosave — scene skeleton from the outline", words: 1120 },
];

export function VersionsTab({
  chapterLabel,
  snapshots,
  onSnapshot,
  onRestore,
}: {
  chapterLabel: string;
  snapshots: Snapshot[];
  onSnapshot: () => void;
  onRestore: (id: string) => void;
}) {
  const { guard, readOnly } = useWorldMode();
  const [compare, setCompare] = useState<string[]>([]);

  const all = [
    ...snapshots.map((s) => ({
      id: s.id,
      when: new Date(s.when).toLocaleString(),
      note: s.label,
      words: s.words,
      manual: true,
    })),
    ...autosaves.map((a) => ({ ...a, manual: false })),
  ];

  const picked = all.filter((v) => compare.includes(v.id)).slice(0, 2);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Versions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Autosaves and manual snapshots of {chapterLabel}, newest first.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => guard(onSnapshot)}>
          <Camera className="size-4" /> Take snapshot
          {readOnly ? <Lock className="ml-1 size-3 opacity-70" aria-hidden /> : null}
        </Button>
      </div>

      {picked.length === 2 ? (
        <div className="mt-6 grid gap-3 rounded-lg border border-gold/25 bg-gold/5 p-4 sm:grid-cols-2">
          {picked.map((v) => (
            <div key={v.id}>
              <p className="text-xs uppercase tracking-[0.16em] text-gold-soft">{v.when}</p>
              <p className="mt-1 text-sm text-foreground">{v.note}</p>
              <p className="text-xs text-muted-foreground">{v.words.toLocaleString()} words</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Difference: {Math.abs((picked[0]?.words ?? 0) - (picked[1]?.words ?? 0)).toLocaleString()}{" "}
            words between these two versions.
          </p>
        </div>
      ) : null}

      <ul className="mt-6 space-y-3">
        {all.map((v) => (
          <li key={v.id} className="rounded-lg border border-border/70 bg-surface/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-foreground">{v.note}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {v.when} · {v.words.toLocaleString()} words ·{" "}
                  {v.manual ? "Manual snapshot" : "Autosave"}
                </p>
              </div>
              {v.manual ? (
                <History className="size-4 text-gold-soft" aria-hidden />
              ) : (
                <Check className="size-4 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setCompare((c) =>
                    c.includes(v.id) ? c.filter((x) => x !== v.id) : [...c, v.id].slice(-2),
                  )
                }
              >
                {compare.includes(v.id) ? "Selected for compare" : "Compare"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  guard(() => {
                    onRestore(v.id);
                    toast.success("Restored this version into the editor.");
                  })
                }
              >
                <RotateCcw className="size-3.5" /> Restore
                {readOnly ? <Lock className="ml-1 size-3 opacity-70" aria-hidden /> : null}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
