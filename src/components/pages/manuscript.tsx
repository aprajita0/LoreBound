import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bold,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  Italic,
  Loader2,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  Quote as QuoteIcon,
  Redo2,
  Replace,
  Search,
  Shrink,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ErrorState } from "@/components/app/primitives";
import { useWorldMode } from "@/components/app/world-mode";
import { chapterService, analysisStages, continuityService } from "@/services/lorebound";
import { chapterStatusMeta } from "./shared";
import { useStudioStore, type OutlineStatus } from "@/lib/manuscript-store";
import {
  terraParts,
  terraScenes,
  reviewGroups,
  reviewSuggestionsFor,
  type ReviewSuggestion,
} from "@/data/terra-manuscript";
import {
  ChaptersTable,
  OutlineBoard,
  StoryMemory,
  VersionsTab,
  type SceneNode,
} from "./manuscript-parts";
import { cn } from "@/lib/utils";
import type { AnalysisStage, Chapter } from "@/types/lorebound";

const studioTabs = [
  { key: "write", label: "Write" },
  { key: "outline", label: "Outline" },
  { key: "chapters", label: "Chapters" },
  { key: "versions", label: "Versions" },
] as const;

const writingModes = [
  { key: "drafting", label: "Drafting", hint: "Nothing interrupts you." },
  { key: "quiet", label: "Quiet Analysis", hint: "Concerns surface quietly in Story Memory." },
] as const;

type WritingMode = (typeof writingModes)[number]["key"];

const povByChapter: Record<number, string> = {
  4: "Aria",
  15: "Arthur",
  18: "Omir",
  19: "Omir",
  20: "Omir",
  21: "Omir",
  22: "Ethan",
  23: "Omir",
  24: "Omir",
};

const identitiesByChapter: Record<number, string[]> = {
  20: ["Mira"],
  21: ["Mira"],
  22: ["Mira"],
  23: ["Mira"],
  24: ["Mira"],
};

function countWords(text: string) {
  const plain = text.replace(/<[^>]*>/g, " ");
  return plain.trim() ? plain.trim().split(/\s+/).length : 0;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bodyToHtml(body: string[]) {
  return body.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
}

export function ManuscriptPage() {
  const { guard, readOnly, mode } = useWorldMode();
  const chapters = useQuery({ queryKey: ["terra", "chapters"], queryFn: () => chapterService.list() });
  const findings = useQuery({ queryKey: ["terra", "findings"], queryFn: () => continuityService.list() });
  const store = useStudioStore(mode === "demo" ? "demo-terra" : "terra");

  const sorted = useMemo(
    () => [...(chapters.data ?? [])].sort((a, b) => b.number - a.number),
    [chapters.data],
  );

  const [tab, setTab] = useState<(typeof studioTabs)[number]["key"]>("write");
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [openParts, setOpenParts] = useState<string[]>(terraParts.map((p) => p.id));
  const [openChapters, setOpenChapters] = useState<string[]>(["cp-24"]);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [writingMode, setWritingMode] = useState<WritingMode>("drafting");
  const [treeQuery, setTreeQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<ReviewSuggestion | null>(null);
  const [stageIndex, setStageIndex] = useState<number | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [liveWords, setLiveWords] = useState(0);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /* ------------------------------------------------- derived manuscript ---- */

  const scenesOf = useCallback(
    (chapterId: string): SceneNode[] => {
      const chapterNumber =
        terraScenes.find((s) => s.chapterId === chapterId)?.chapterNumber ??
        sorted.find((c) => c.id === chapterId)?.number ??
        0;
      const base: SceneNode[] = terraScenes
        .filter((s) => s.chapterId === chapterId)
        .map((s) => ({
          id: s.id,
          chapterId: s.chapterId,
          chapterNumber: s.chapterNumber,
          number: s.number,
          title: store.sceneOverrides[s.id]?.title ?? s.title,
          summary: s.summary,
          body: s.body,
          memory: s.memory,
          archived: store.sceneOverrides[s.id]?.archived ?? false,
          status:
            store.sceneOverrides[s.id]?.status ??
            (s.chapterNumber >= 24 ? "drafting" : s.chapterNumber >= 22 ? "revised" : "final"),
        }));
      const extras: SceneNode[] = store.extraScenes
        .filter((e) => e.chapterId === chapterId)
        .map((e, i) => ({
          id: e.id,
          chapterId,
          chapterNumber,
          number: base.length + i + 1,
          title: store.sceneOverrides[e.id]?.title ?? e.title,
          summary: "New scene",
          body: [""],
          memory: base[0]?.memory ?? {
            characterIds: [],
            location: "Unrecorded",
            secrets: [],
            lore: [],
            knowledge: [],
            threads: [],
            concerns: [],
          },
          archived: store.sceneOverrides[e.id]?.archived ?? false,
          status: store.sceneOverrides[e.id]?.status ?? "planned",
        }));
      const all = [...base, ...extras];
      const order = store.sceneOrder[chapterId];
      const ordered = order
        ? [...all].sort((a, b) => {
            const ai = order.indexOf(a.id);
            const bi = order.indexOf(b.id);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          })
        : all;
      return ordered.map((s, i) => ({ ...s, number: i + 1 }));
    },
    [sorted, store.extraScenes, store.sceneOrder, store.sceneOverrides],
  );

  const allScenes = useMemo(
    () => sorted.flatMap((c) => scenesOf(c.id)),
    [scenesOf, sorted],
  );

  const chapterTitle = useCallback(
    (c: Chapter) => store.chapterTitles[c.id] ?? c.title,
    [store.chapterTitles],
  );

  const scene: SceneNode | undefined =
    allScenes.find((s) => s.id === sceneId) ??
    allScenes.find((s) => s.chapterNumber === 24) ??
    allScenes[0];
  const chapter: Chapter | undefined = sorted.find((c) => c.id === scene?.chapterId) ?? sorted[0];

  const chapterScenes = chapter ? scenesOf(chapter.id) : [];
  const flatIndex = scene ? allScenes.findIndex((s) => s.id === scene.id) : -1;
  const prevScene = flatIndex > 0 ? allScenes[flatIndex - 1] : undefined;
  const nextScene = flatIndex >= 0 ? allScenes[flatIndex + 1] : undefined;

  const storedHtml = scene ? store.sceneText[scene.id] : undefined;
  const sceneHtml = storedHtml ?? (scene ? bodyToHtml(scene.body) : "");

  /* ----------------------------------------------------------- the editor ---- */

  // Paint the editor whenever the scene changes (or hydration completes).
  useEffect(() => {
    const el = editorRef.current;
    if (!el || !scene) return;
    el.innerHTML = sceneHtml;
    const w = countWords(sceneHtml);
    setLiveWords(w);
    setSessionStart((prev) => (prev === null ? w : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id, store.hydrated]);

  const words = liveWords;
  const sessionWords = sessionStart === null ? 0 : Math.max(0, words - sessionStart);

  function onEdit() {
    const el = editorRef.current;
    if (!el || !scene) return;
    setLiveWords(countWords(el.innerHTML));
    store.setSceneText(scene.id, el.innerHTML);
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onEdit();
  }

  function insertSceneBreak() {
    exec("insertHTML", '<p class="scene-break">* * *</p><p><br/></p>');
  }

  function runReplace(all: boolean) {
    const el = editorRef.current;
    if (!el || !scene || !findText) return;
    const html = el.innerHTML;
    const pattern = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), all ? "g" : "");
    if (!pattern.test(html)) {
      toast("No matches in this scene.");
      return;
    }
    const next = html.replace(pattern, replaceText);
    el.innerHTML = next;
    setLiveWords(countWords(next));
    store.setSceneText(scene.id, next);
    toast.success(all ? "Replaced every match in this scene." : "Replaced the first match.");
  }

  /* -------------------------------------------------------------- review ---- */

  const suggestions = chapter ? reviewSuggestionsFor(chapter) : [];
  const pending = suggestions.filter(
    (s) => !store.approved.includes(s.id) && !store.rejected.includes(s.id),
  );
  const currentStage: AnalysisStage | null =
    stageIndex === null ? null : (analysisStages[stageIndex]?.stage ?? null);
  const analysing = stageIndex !== null && currentStage !== "ready";

  function runReview() {
    setStageIndex(0);
    setReviewOpen(true);
    const step = (i: number) => {
      timer.current = setTimeout(() => {
        if (i >= analysisStages.length - 1) {
          setStageIndex(analysisStages.length - 1);
          toast.success(`Review ready — ${suggestions.length} suggestions await your approval.`);
          return;
        }
        setStageIndex(i + 1);
        step(i + 1);
      }, 800);
    };
    step(0);
  }

  /* ------------------------------------------------------ tree operations ---- */

  function move(sceneNode: SceneNode, dir: -1 | 1) {
    const ids = scenesOf(sceneNode.chapterId).map((s) => s.id);
    const i = ids.indexOf(sceneNode.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = [...ids];
    next[i] = ids[j]!;
    next[j] = ids[i]!;
    store.setSceneOrder(sceneNode.chapterId, next);
  }

  const unreviewed = findings.data?.filter((f) => f.status === "unreviewed").length ?? 0;
  const findingsFor = (chapterNumber: number) =>
    findings.data?.filter((f) => f.chapters.includes(chapterNumber)).length ?? 0;

  if (chapters.isError) {
    return (
      <div className="p-8">
        <ErrorState message="The manuscript couldn't be loaded." retry={() => chapters.refetch()} />
      </div>
    );
  }

  /* ----------------------------------------------------------- rendering ---- */

  const editorSurface = (
    <>
      {chapters.isLoading || !chapter || !scene ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-gold-soft">
            Chapter {chapter.number} · Scene {scene.number}
          </p>
          <input
            value={chapterTitle(chapter)}
            onChange={(e) => store.renameChapter(chapter.id, e.target.value)}
            readOnly={readOnly}
            onClick={() => readOnly && guard()}
            aria-label="Chapter title"
            className="mt-1.5 w-full border-none bg-transparent font-display text-4xl leading-tight text-foreground outline-none focus-visible:outline-none"
          />
          <input
            value={scene.title}
            onChange={(e) => store.renameScene(scene.id, e.target.value)}
            readOnly={readOnly}
            onClick={() => readOnly && guard()}
            aria-label="Scene title"
            className="mt-1 w-full border-none bg-transparent text-sm text-muted-foreground outline-none focus-visible:outline-none"
          />

          {activeSuggestion ? (
            <figure className="mt-6 rounded-md border-l-2 border-l-gold/60 bg-gold/8 py-3 pl-4 pr-4">
              <figcaption className="mb-1 flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                <QuoteIcon className="size-3" aria-hidden /> Supporting passage
              </figcaption>
              <blockquote className="font-display text-[1.02rem] leading-relaxed text-foreground/90">
                &ldquo;{activeSuggestion.passage}&rdquo;
              </blockquote>
            </figure>
          ) : null}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Manuscript text"
            onInput={onEdit}
            className="studio-prose mt-8 font-display text-[1.15rem] leading-[1.9] text-foreground/90 outline-none focus-visible:outline-none"
          />

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border/50 pt-5 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              disabled={!prevScene}
              onClick={() => prevScene && setSceneId(prevScene.id)}
            >
              <ChevronLeft className="size-3.5" /> Previous scene
            </Button>
            <span className="hidden sm:inline">
              {readOnly
                ? "Demo writing is kept on this device only."
                : "Changes save automatically to this device."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!nextScene}
              onClick={() => nextScene && setSceneId(nextScene.id)}
            >
              Next scene <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </>
      )}
    </>
  );

  const toolbar = (
    <div className="sticky top-[6.25rem] z-20 flex flex-wrap items-center gap-2 border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur-sm">
      {!focus && !leftOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLeftOpen(true)}
          aria-label="Show manuscript panel"
          className="hidden lg:inline-flex"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
      )}
      <div className="flex items-center gap-0.5">
        {[
          { cmd: "bold", icon: Bold, label: "Bold" },
          { cmd: "italic", icon: Italic, label: "Italic" },
          { cmd: "undo", icon: Undo2, label: "Undo" },
          { cmd: "redo", icon: Redo2, label: "Redo" },
        ].map(({ cmd, icon: Icon, label }) => (
          <Tooltip key={cmd}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec(cmd)}
              >
                <Icon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertSceneBreak}
            >
              * * *
            </Button>
          </TooltipTrigger>
          <TooltipContent>Scene break</TooltipContent>
        </Tooltip>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Find and replace">
              <Replace className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-2">
            <Input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Find"
              aria-label="Find"
            />
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with"
              aria-label="Replace with"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => runReplace(false)}>
                Replace
              </Button>
              <Button size="sm" onClick={() => runReplace(true)}>
                Replace all
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs",
          store.saveState === "saving" ? "text-muted-foreground" : "text-forest",
        )}
        aria-live="polite"
      >
        {store.saveState === "saving" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Check className="size-3.5" aria-hidden />
        )}
        {store.saveState === "saving" ? "Saving…" : "Saved"}
      </span>
      <span className="text-xs text-muted-foreground">
        {words.toLocaleString()} words · {sessionWords.toLocaleString()} this session
      </span>
      {chapter ? (
        <Badge variant="outline" className={chapterStatusMeta[chapter.status]!.className}>
          {chapterStatusMeta[chapter.status]!.label}
        </Badge>
      ) : null}

      <div className="ml-auto flex items-center gap-1">
        <div className="hidden items-center rounded-full border border-border/70 p-0.5 md:flex">
          {writingModes.map((m) => (
            <Tooltip key={m.key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setWritingMode(m.key)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs transition-colors",
                    writingMode === m.key
                      ? "bg-gold/15 text-gold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.label}
                </button>
              </TooltipTrigger>
              <TooltipContent>{m.hint}</TooltipContent>
            </Tooltip>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setTab("versions")}>
          <span className="hidden sm:inline">Version history</span>
          <span className="sm:hidden">Versions</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFocus((f) => !f)}>
          {focus ? <Shrink className="size-4" /> : <Expand className="size-4" />}
          <span className="hidden sm:inline">{focus ? "Exit focus" : "Focus mode"}</span>
        </Button>
        <Button size="sm" onClick={runReview} disabled={analysing}>
          {analysing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Review Chapter
        </Button>
        {!focus && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightOpen((d) => !d)}
            aria-label={rightOpen ? "Hide story memory" : "Show story memory"}
            className="hidden xl:inline-flex"
          >
            {rightOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </Button>
        )}
      </div>
    </div>
  );

  if (focus) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/50 bg-background/95 px-4 py-2 backdrop-blur-sm">
          <span className="text-xs text-muted-foreground">
            {chapter ? `Chapter ${chapter.number}` : ""} · {words.toLocaleString()} words ·{" "}
            {sessionWords.toLocaleString()} this session
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-forest">
            {store.saveState === "saving" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3.5" aria-hidden />
            )}
            {store.saveState === "saving" ? "Saving…" : "Saved"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setFocus(false)}>
            <Shrink className="size-4" /> Exit focus
          </Button>
        </div>
        <article className="mx-auto w-full max-w-[760px] px-5 py-16 sm:px-8">{editorSurface}</article>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="sticky top-14 z-30 flex items-center gap-1 border-b border-border/60 bg-background/85 px-3 py-1.5 backdrop-blur-sm">
        {studioTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              tab === t.key
                ? "bg-gold/12 text-gold shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--color-gold)_40%,transparent)]"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {chapter ? `Chapter ${chapter.number} · ${chapterTitle(chapter)}` : "—"}
        </span>
      </div>

      {tab === "write" ? (
        <div className="flex min-h-0 flex-1">
          {/* LEFT — manuscript organisation */}
          {leftOpen && (
            <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-sidebar/40 lg:block">
              <div className="sticky top-[6.25rem] max-h-[calc(100vh-6.25rem)] overflow-y-auto">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Manuscript
                  </p>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() =>
                            guard(() => {
                              const part = terraParts[terraParts.length - 1]!;
                              store.addChapter(part.id, "Untitled chapter", (sorted[0]?.number ?? 0) + 1);
                              toast.success("Chapter added to the manuscript.");
                            })
                          }
                          aria-label="Add chapter"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Add chapter</TooltipContent>
                    </Tooltip>
                    <button
                      onClick={() => setLeftOpen(false)}
                      aria-label="Collapse manuscript panel"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <PanelLeftClose className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="border-b border-border/60 px-3 py-2">
                  <div className="relative">
                    <Search
                      className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={treeQuery}
                      onChange={(e) => setTreeQuery(e.target.value)}
                      placeholder="Search the manuscript"
                      aria-label="Search the manuscript"
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                </div>

                {chapters.isLoading ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="p-2">
                    {terraParts.map((part) => {
                      const partOpen = openParts.includes(part.id);
                      return (
                        <div key={part.id} className="mb-1">
                          <button
                            onClick={() =>
                              setOpenParts((o) =>
                                o.includes(part.id) ? o.filter((x) => x !== part.id) : [...o, part.id],
                              )
                            }
                            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[0.72rem] uppercase tracking-[0.16em] text-gold-soft hover:bg-accent/50"
                          >
                            <ChevronDown
                              className={cn("size-3 transition-transform", !partOpen && "-rotate-90")}
                              aria-hidden
                            />
                            <span className="truncate">{part.title}</span>
                          </button>
                          {partOpen &&
                            part.chapterNumbers
                              .slice()
                              .sort((a, b) => b - a)
                              .map((num) => {
                                const c = sorted.find((x) => x.number === num);
                                if (!c) return null;
                                const title = chapterTitle(c);
                                const scenes = scenesOf(c.id).filter((s) => !s.archived);
                                const q = treeQuery.trim().toLowerCase();
                                const matches =
                                  !q ||
                                  title.toLowerCase().includes(q) ||
                                  scenes.some((s) => s.title.toLowerCase().includes(q));
                                if (!matches) return null;
                                const chOpen = openChapters.includes(c.id) || Boolean(q);
                                const meta = chapterStatusMeta[c.status]!;
                                return (
                                  <div key={c.id} className="ml-2">
                                    <div className="flex items-start gap-1">
                                      <button
                                        onClick={() =>
                                          setOpenChapters((o) =>
                                            o.includes(c.id)
                                              ? o.filter((x) => x !== c.id)
                                              : [...o, c.id],
                                          )
                                        }
                                        className={cn(
                                          "flex min-w-0 flex-1 items-start gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/50",
                                          chapter?.id === c.id ? "text-foreground" : "text-muted-foreground",
                                        )}
                                      >
                                        <ChevronDown
                                          className={cn(
                                            "mt-1 size-3 shrink-0 transition-transform",
                                            !chOpen && "-rotate-90",
                                          )}
                                          aria-hidden
                                        />
                                        <span className="min-w-0">
                                          <span className="block truncate text-sm">
                                            {c.number}. {title}
                                          </span>
                                          <span className="mt-1 flex items-center gap-1.5">
                                            <span
                                              className={cn(
                                                "inline-block rounded-full border px-1.5 text-[0.6rem]",
                                                meta.className,
                                              )}
                                            >
                                              {meta.label}
                                            </span>
                                            <span className="text-[0.62rem] text-muted-foreground">
                                              {c.wordCount.toLocaleString()}w
                                            </span>
                                          </span>
                                        </span>
                                      </button>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            aria-label={`Chapter ${c.number} actions`}
                                            className="mt-1.5 text-muted-foreground hover:text-foreground"
                                          >
                                            <MoreHorizontal className="size-3.5" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onSelect={() =>
                                              guard(() => {
                                                setRenaming(c.id);
                                                setRenameValue(title);
                                              })
                                            }
                                          >
                                            <Pencil className="size-3.5" /> Rename chapter
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onSelect={() =>
                                              guard(() => {
                                                const id = store.addScene(c.id, "New scene");
                                                setSceneId(id);
                                                toast.success("Scene added.");
                                              })
                                            }
                                          >
                                            <Plus className="size-3.5" /> Add scene
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {renaming === c.id ? (
                                      <form
                                        className="ml-5 mb-1 flex gap-1"
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          store.renameChapter(c.id, renameValue.trim() || title);
                                          setRenaming(null);
                                        }}
                                      >
                                        <Input
                                          autoFocus
                                          value={renameValue}
                                          onChange={(e) => setRenameValue(e.target.value)}
                                          className="h-7 text-xs"
                                          aria-label="Chapter name"
                                        />
                                        <Button type="submit" size="sm" className="h-7">
                                          Save
                                        </Button>
                                      </form>
                                    ) : null}

                                    {chOpen && (
                                      <ul className="ml-5 border-l border-border/60 pl-2">
                                        {scenes
                                          .filter(
                                            (s) => !q || s.title.toLowerCase().includes(q),
                                          )
                                          .map((s) => (
                                            <li key={s.id} className="group flex items-center gap-1">
                                              {renaming === s.id ? (
                                                <form
                                                  className="flex flex-1 gap-1 py-1"
                                                  onSubmit={(e) => {
                                                    e.preventDefault();
                                                    store.renameScene(s.id, renameValue.trim() || s.title);
                                                    setRenaming(null);
                                                  }}
                                                >
                                                  <Input
                                                    autoFocus
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    className="h-7 text-xs"
                                                    aria-label="Scene name"
                                                  />
                                                  <Button type="submit" size="sm" className="h-7">
                                                    Save
                                                  </Button>
                                                </form>
                                              ) : (
                                                <>
                                                  <button
                                                    onClick={() => {
                                                      setSceneId(s.id);
                                                      setActiveSuggestion(null);
                                                    }}
                                                    aria-current={scene?.id === s.id ? "true" : undefined}
                                                    className={cn(
                                                      "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-[0.8rem] transition-colors",
                                                      scene?.id === s.id
                                                        ? "bg-accent text-foreground shadow-[inset_2px_0_0_0_var(--color-gold)]"
                                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                                    )}
                                                  >
                                                    {s.number}. {s.title}
                                                  </button>
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <button
                                                        aria-label={`Scene ${s.number} actions`}
                                                        className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                                      >
                                                        <MoreHorizontal className="size-3.5" />
                                                      </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                      <DropdownMenuItem
                                                        onSelect={() =>
                                                          guard(() => {
                                                            setRenaming(s.id);
                                                            setRenameValue(s.title);
                                                          })
                                                        }
                                                      >
                                                        <Pencil className="size-3.5" /> Rename
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onSelect={() =>
                                                          guard(() => {
                                                            const id = store.duplicateScene(
                                                              s.chapterId,
                                                              `${s.title} (copy)`,
                                                              store.sceneText[s.id] ?? bodyToHtml(s.body),
                                                              s.id,
                                                            );
                                                            setSceneId(id);
                                                            toast.success("Scene duplicated.");
                                                          })
                                                        }
                                                      >
                                                        <Copy className="size-3.5" /> Duplicate
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onSelect={() => guard(() => move(s, -1))}
                                                      >
                                                        <ChevronLeft className="size-3.5 rotate-90" /> Move
                                                        up
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onSelect={() => guard(() => move(s, 1))}
                                                      >
                                                        <ChevronRight className="size-3.5 rotate-90" /> Move
                                                        down
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onSelect={() =>
                                                          guard(() => {
                                                            store.archiveScene(s.id, true);
                                                            toast.success("Scene archived.");
                                                          })
                                                        }
                                                      >
                                                        <Trash2 className="size-3.5" /> Archive
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </>
                                              )}
                                            </li>
                                          ))}
                                        <li>
                                          <button
                                            onClick={() =>
                                              guard(() => {
                                                const id = store.addScene(c.id, "New scene");
                                                setSceneId(id);
                                              })
                                            }
                                            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                          >
                                            <Plus className="size-3" /> Add scene
                                          </button>
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* CENTER — the writing canvas */}
          <div className="min-w-0 flex-1 bg-background">
            {toolbar}
            <article className="mx-auto w-full max-w-[780px] px-5 py-12 sm:px-8">
              {editorSurface}
            </article>
          </div>

          {/* RIGHT — story memory */}
          {rightOpen && scene ? (
            <aside className="hidden w-[22rem] shrink-0 border-l border-border/60 xl:block">
              <div className="sticky top-[6.25rem] h-[calc(100vh-6.25rem)]">
                <StoryMemory
                  scene={scene}
                  identities={identitiesByChapter[scene.chapterNumber] ?? []}
                  unreviewed={unreviewed}
                  quiet={writingMode === "quiet"}
                  onClose={() => setRightOpen(false)}
                />
              </div>
            </aside>
          ) : null}
        </div>
      ) : null}

      {tab === "outline" ? (
        <OutlineBoard
          scenes={allScenes.filter((s) => !s.archived)}
          onMove={(id, status: OutlineStatus) =>
            guard(() => {
              store.setSceneStatus(id, status);
              toast.success("Scene moved.");
            })
          }
          onOpen={(id) => {
            setSceneId(id);
            setTab("write");
          }}
        />
      ) : null}

      {tab === "chapters" ? (
        <ChaptersTable
          parts={terraParts}
          chapters={sorted}
          scenesOf={(id) => scenesOf(id).filter((s) => !s.archived)}
          titleOf={chapterTitle}
          findingsFor={findingsFor}
          povOf={(n) => povByChapter[n] ?? "Omir"}
          onOpen={(id) => {
            setSceneId(id);
            setTab("write");
          }}
        />
      ) : null}

      {tab === "versions" ? (
        <VersionsTab
          chapterLabel={chapter ? `Chapter ${chapter.number}` : "this chapter"}
          snapshots={store.snapshots.filter((s) => !scene || s.sceneId === scene.id)}
          onSnapshot={() => {
            if (!scene) return;
            store.saveSnapshot(scene.id, `Snapshot of ${scene.title}`, sceneHtml);
            toast.success("Snapshot saved.");
          }}
          onRestore={(id) => store.restoreSnapshot(id)}
        />
      ) : null}

      {/* Review Chapter */}
      <Sheet open={reviewOpen} onOpenChange={setReviewOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">
              Review {chapter ? `Chapter ${chapter.number}` : "chapter"}
            </SheetTitle>
            <SheetDescription>Nothing becomes canon until you approve it.</SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-8">
            {stageIndex !== null && (
              <div className="mt-4 rounded-lg border border-gold/25 bg-gold/5 p-4">
                <Progress value={((stageIndex + 1) / analysisStages.length) * 100} className="h-1.5" />
                <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                  {analysisStages.map((s, i) => (
                    <li
                      key={s.stage}
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        i < stageIndex
                          ? "text-muted-foreground"
                          : i === stageIndex
                            ? "text-gold"
                            : "text-muted-foreground/50",
                      )}
                    >
                      {i < stageIndex ? (
                        <Check className="size-3" aria-hidden />
                      ) : i === stageIndex && analysing ? (
                        <Loader2 className="size-3 animate-spin" aria-hidden />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                      )}
                      {s.label}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {!analysing && stageIndex !== null ? (
              <Tabs defaultValue="facts" className="mt-5">
                <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                  {reviewGroups.map((g) => (
                    <TabsTrigger
                      key={g.key}
                      value={g.key}
                      className="rounded-full border border-border/60 px-2.5 py-1 text-[0.7rem] data-[state=active]:border-gold/50 data-[state=active]:bg-gold/12 data-[state=active]:text-gold"
                    >
                      {g.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {reviewGroups.map((g) => (
                  <TabsContent key={g.key} value={g.key} className="mt-3 space-y-2">
                    {suggestions
                      .filter((s) => s.group === g.key)
                      .map((s) => {
                        const approved = store.approved.includes(s.id);
                        const rejected = store.rejected.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            className={cn(
                              "rounded-lg border p-3.5 transition-colors",
                              approved
                                ? "border-forest/45 bg-forest/8"
                                : rejected
                                  ? "border-border/50 opacity-60"
                                  : "border-border/70 bg-surface/60",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-foreground">{s.title}</p>
                              <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                                {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
                            <button
                              onClick={() =>
                                setActiveSuggestion(activeSuggestion?.id === s.id ? null : s)
                              }
                              className="mt-2 text-xs text-gold underline-offset-4 hover:underline"
                            >
                              {activeSuggestion?.id === s.id
                                ? "Hide supporting passage"
                                : "Show supporting passage"}
                            </button>
                            {activeSuggestion?.id === s.id ? (
                              <blockquote className="mt-2 border-l-2 border-l-gold/60 pl-3 font-display text-sm leading-relaxed text-foreground/85">
                                &ldquo;{s.passage}&rdquo;
                              </blockquote>
                            ) : null}
                            <div className="mt-3 flex items-center gap-2">
                              {approved ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-forest">
                                  <Check className="size-3.5" aria-hidden /> Confirmed canon
                                </span>
                              ) : rejected ? (
                                <span className="text-xs text-muted-foreground">Set aside</span>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      store.approve(s.id);
                                      toast.success("Recorded as confirmed canon.");
                                    }}
                                  >
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => store.reject(s.id)}>
                                    Set aside
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </TabsContent>
                ))}
                <p className="mt-4 text-xs text-muted-foreground">
                  {pending.length} suggestion{pending.length === 1 ? "" : "s"} still awaiting your
                  decision.
                </p>
              </Tabs>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
