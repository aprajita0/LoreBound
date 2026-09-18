import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  Bold,
  Check,
  Copy,
  Expand,
  FileText,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Quote,
  Redo2,
  Save,
  ScrollText,
  SlidersHorizontal,
  Shrink,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/app/primitives";
import {
  createChapter,
  createChapterVersion,
  deleteChapter,
  duplicateChapter,
  getManuscript,
  saveChapter,
  updateChapterStatus,
  type ManuscriptChapter,
  type ManuscriptData,
  type SaveChapterInput,
} from "@/services/manuscripts";
import { cn } from "@/lib/utils";

type SaveState = "saved" | "saving" | "error" | "offline";
type ManuscriptFont = "literary" | "classic" | "book" | "modern";
type ManuscriptSize = "small" | "medium" | "large";
type ManuscriptSpacing = "compact" | "comfortable" | "spacious";
type ManuscriptView = "continuous" | "pages";

interface ManuscriptPreferences {
  font: ManuscriptFont;
  size: ManuscriptSize;
  spacing: ManuscriptSpacing;
  view: ManuscriptView;
}

const DEFAULT_PREFERENCES: ManuscriptPreferences = {
  font: "literary",
  size: "medium",
  spacing: "comfortable",
  view: "continuous",
};

const PREFERENCES_KEY = "lorebound.manuscript-preferences";

interface DatabaseManuscriptPageProps {
  worldId: string;
}

function countWords(text: string): number {
  const trimmed = text.trim();

  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function recoveryKey(chapterId: string): string {
  return `lorebound.manuscript-recovery.${chapterId}`;
}

export function DatabaseManuscriptPage({
  worldId,
}: DatabaseManuscriptPageProps) {
  const queryClient = useQueryClient();

  const manuscriptQuery = useQuery({
    queryKey: ["manuscript", worldId],
    queryFn: () => getManuscript(worldId),
  });

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null,
  );
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterSubtitle, setChapterSubtitle] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [wordCount, setWordCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [chapterMenuOpen, setChapterMenuOpen] = useState(false);
  const [chapterActionPending, setChapterActionPending] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<ManuscriptPreferences>(DEFAULT_PREFERENCES);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<SaveChapterInput | null>(null);
  const loadingChapter = useRef(false);
  const chapterTitleRef = useRef("");
  const chapterSubtitleRef = useRef("");
  const typewriterModeRef = useRef(false);

  const chapters = manuscriptQuery.data?.chapters ?? [];

  const selectedChapter =
    chapters.find((chapter) => chapter.id === selectedChapterId) ??
    chapters[0] ??
    null;

  const updateCachedChapter = useCallback(
    (payload: SaveChapterInput) => {
      queryClient.setQueryData<ManuscriptData>(
        ["manuscript", worldId],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            chapters: current.chapters.map((chapter) =>
              chapter.id === payload.chapterId
                ? {
                    ...chapter,
                    title: payload.title,
                    subtitle: payload.subtitle,
                    contentJson: payload.contentJson,
                    plainText: payload.plainText,
                    wordCount: payload.wordCount,
                    updatedAt: new Date().toISOString(),
                  }
                : chapter,
            ),
          };
        },
      );
    },
    [queryClient, worldId],
  );

  const persistPayload = useCallback(
    async (payload: SaveChapterInput) => {
      if (!navigator.onLine) {
        setSaveState("offline");
        return;
      }

      setSaveState("saving");

      try {
        await saveChapter(payload);
        updateCachedChapter(payload);

        if (pendingSave.current?.chapterId === payload.chapterId) {
          pendingSave.current = null;
        }

        window.localStorage.removeItem(recoveryKey(payload.chapterId));

        setSaveState("saved");
      } catch (error) {
        console.error("Unable to save chapter:", error);
        setSaveState("error");

        toast.error(
          error instanceof Error
            ? error.message
            : "Your chapter could not be saved.",
        );
      }
    },
    [updateCachedChapter],
  );

  const scheduleSave = useCallback(
    (payload: SaveChapterInput) => {
      pendingSave.current = payload;
      setSaveState("saving");

      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        void persistPayload(payload);
      }, 1_200);
    },
    [persistPayload],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder: "Begin writing this chapter…",
      }),
    ],
    content: {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editorProps: {
      attributes: {
        class:
          "studio-prose min-h-[58vh] font-display text-[1.15rem] leading-[1.95] text-foreground/90 outline-none",
        spellcheck: "true",
        "aria-label": "Manuscript editor",
      },
    },
    onUpdate({ editor: currentEditor }) {
      if (loadingChapter.current || !selectedChapterId) {
        return;
      }

      const plainText = currentEditor.getText({
        blockSeparator: "\n\n",
      });

      const nextWordCount = countWords(plainText);
      setWordCount(nextWordCount);

      const payload = {
        chapterId: selectedChapterId,
        title: chapterTitleRef.current.trim() || "Untitled Chapter",
        subtitle: chapterSubtitleRef.current.trim(),
        contentJson: currentEditor.getJSON(),
        plainText,
        wordCount: nextWordCount,
      };

      window.localStorage.setItem(
        recoveryKey(selectedChapterId),
        JSON.stringify({ ...payload, savedAt: Date.now() }),
      );

      scheduleSave(payload);
    },
    onSelectionUpdate({ editor: currentEditor }) {
      if (!typewriterModeRef.current) return;

      requestAnimationFrame(() => {
        const selection = window.getSelection();
        const node = selection?.anchorNode;
        const element =
          node instanceof HTMLElement ? node : node?.parentElement;

        element?.closest("p, h2, blockquote, li")?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      });
    },
  });

  const buildCurrentPayload = useCallback((): SaveChapterInput | null => {
    if (!editor || !selectedChapterId) {
      return null;
    }

    const plainText = editor.getText({
      blockSeparator: "\n\n",
    });

    return {
      chapterId: selectedChapterId,
      title: chapterTitleRef.current.trim() || "Untitled Chapter",
      subtitle: chapterSubtitleRef.current.trim(),
      contentJson: editor.getJSON(),
      plainText,
      wordCount: countWords(plainText),
    };
  }, [editor, selectedChapterId]);

  const saveImmediately = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const payload = pendingSave.current ?? buildCurrentPayload();

    if (payload) {
      await persistPayload(payload);
    }
  }, [buildCurrentPayload, persistPayload]);

  useEffect(() => {
    if (!selectedChapterId && chapters[0]) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  useEffect(() => {
    if (!editor || !selectedChapter) {
      return;
    }

    loadingChapter.current = true;

    setChapterTitle(selectedChapter.title);
    chapterTitleRef.current = selectedChapter.title;
    setChapterSubtitle(selectedChapter.subtitle);
    chapterSubtitleRef.current = selectedChapter.subtitle;
    setWordCount(selectedChapter.wordCount);
    setSessionStart(selectedChapter.wordCount);

    let content = selectedChapter.contentJson;
    const recovery = window.localStorage.getItem(
      recoveryKey(selectedChapter.id),
    );

    if (recovery) {
      try {
        const parsed = JSON.parse(recovery) as SaveChapterInput & {
          savedAt: number;
        };

        if (parsed.savedAt > new Date(selectedChapter.updatedAt).getTime()) {
          content = parsed.contentJson;
          setChapterTitle(parsed.title);
          chapterTitleRef.current = parsed.title;
          setChapterSubtitle(parsed.subtitle ?? "");
          chapterSubtitleRef.current = parsed.subtitle ?? "";
          setWordCount(parsed.wordCount);
          pendingSave.current = parsed;
          setSaveState(navigator.onLine ? "saving" : "offline");
          toast.info("Recovered unsaved writing from this browser.");
        }
      } catch {
        window.localStorage.removeItem(recoveryKey(selectedChapter.id));
      }
    }

    editor.commands.setContent(content, {
      emitUpdate: false,
    });

    queueMicrotask(() => {
      loadingChapter.current = false;
    });
  }, [editor, selectedChapter?.id]);

  useEffect(() => {
    typewriterModeRef.current = typewriterMode;
  }, [typewriterMode]);

  useEffect(() => {
    const stored = window.localStorage.getItem(PREFERENCES_KEY);

    if (!stored) return;

    try {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...(JSON.parse(stored) as Partial<ManuscriptPreferences>),
      });
    } catch {
      window.localStorage.removeItem(PREFERENCES_KEY);
    }
  }, []);

  const changePreference = useCallback(
    <Key extends keyof ManuscriptPreferences>(
      key: Key,
      value: ManuscriptPreferences[Key],
    ) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value };
        window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    function handleKeyboardSave(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveImmediately();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && pendingSave.current) {
        void saveImmediately();
      }
    }

    function handleOnline() {
      if (pendingSave.current) void saveImmediately();
    }

    function handleOffline() {
      if (pendingSave.current) setSaveState("offline");
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!pendingSave.current) return;
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyboardSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("keydown", handleKeyboardSave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveImmediately]);

  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      if (pendingSave.current) {
        void persistPayload(pendingSave.current);
      }
    },
    [persistPayload],
  );

  async function selectChapter(chapter: ManuscriptChapter) {
    if (chapter.id === selectedChapterId) {
      return;
    }

    await saveImmediately();
    setSelectedChapterId(chapter.id);
  }

  function changeChapterTitle(value: string) {
    setChapterTitle(value);
    chapterTitleRef.current = value;

    if (!editor || !selectedChapterId) {
      return;
    }

    const plainText = editor.getText({
      blockSeparator: "\n\n",
    });

    scheduleSave({
      chapterId: selectedChapterId,
      title: value.trim() || "Untitled Chapter",
      subtitle: chapterSubtitleRef.current.trim(),
      contentJson: editor.getJSON(),
      plainText,
      wordCount: countWords(plainText),
    });
  }

  function changeChapterSubtitle(value: string) {
    setChapterSubtitle(value);
    chapterSubtitleRef.current = value;

    if (!editor || !selectedChapterId) return;

    const plainText = editor.getText({ blockSeparator: "\n\n" });

    scheduleSave({
      chapterId: selectedChapterId,
      title: chapterTitleRef.current.trim() || "Untitled Chapter",
      subtitle: value.trim(),
      contentJson: editor.getJSON(),
      plainText,
      wordCount: countWords(plainText),
    });
  }

  async function addChapter() {
    if (creatingChapter) {
      return;
    }

    setCreatingChapter(true);

    try {
      await saveImmediately();

      const chapter = await createChapter(worldId);

      queryClient.setQueryData<ManuscriptData>(
        ["manuscript", worldId],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            chapters: [...current.chapters, chapter],
          };
        },
      );

      setSelectedChapterId(chapter.id);
      toast.success("A new chapter has been added.");
    } catch (error) {
      console.error("Unable to add chapter:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "The chapter could not be created.",
      );
    } finally {
      setCreatingChapter(false);
    }
  }

  async function duplicateSelectedChapter() {
    if (!editor || !selectedChapter || chapterActionPending) return;
    setChapterActionPending(true);

    try {
      await saveImmediately();
      const duplicate = await duplicateChapter({
        ...selectedChapter,
        title: chapterTitleRef.current.trim() || selectedChapter.title,
        subtitle: chapterSubtitleRef.current.trim(),
        contentJson: editor.getJSON(),
        plainText: editor.getText({ blockSeparator: "\n\n" }),
        wordCount,
      });
      queryClient.setQueryData<ManuscriptData>(
        ["manuscript", worldId],
        (current) =>
          current
            ? { ...current, chapters: [...current.chapters, duplicate] }
            : current,
      );
      setSelectedChapterId(duplicate.id);
      setChapterMenuOpen(false);
      toast.success("Chapter duplicated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not duplicate chapter.",
      );
    } finally {
      setChapterActionPending(false);
    }
  }

  async function removeSelectedChapter() {
    if (!selectedChapter || chapters.length === 1 || chapterActionPending)
      return;
    if (
      !window.confirm(
        `Delete “${selectedChapter.title}”? This cannot be undone.`,
      )
    )
      return;
    setChapterActionPending(true);

    try {
      await deleteChapter(selectedChapter.id);
      window.localStorage.removeItem(recoveryKey(selectedChapter.id));
      const remaining = chapters.filter(
        (chapter) => chapter.id !== selectedChapter.id,
      );
      queryClient.setQueryData<ManuscriptData>(
        ["manuscript", worldId],
        (current) => (current ? { ...current, chapters: remaining } : current),
      );
      pendingSave.current = null;
      setSelectedChapterId(remaining[0]?.id ?? null);
      setChapterMenuOpen(false);
      toast.success("Chapter deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete chapter.",
      );
    } finally {
      setChapterActionPending(false);
    }
  }

  async function createSnapshot() {
    if (!editor || !selectedChapter || chapterActionPending) return;
    setChapterActionPending(true);

    try {
      await saveImmediately();
      await createChapterVersion({
        ...selectedChapter,
        title: chapterTitleRef.current.trim() || selectedChapter.title,
        subtitle: chapterSubtitleRef.current.trim(),
        contentJson: editor.getJSON(),
        plainText: editor.getText({ blockSeparator: "\n\n" }),
        wordCount,
      });
      setChapterMenuOpen(false);
      toast.success("Version snapshot created.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create snapshot.",
      );
    } finally {
      setChapterActionPending(false);
    }
  }

  async function changeStatus(status: ManuscriptChapter["status"]) {
    if (!selectedChapter) return;
    try {
      await updateChapterStatus(selectedChapter.id, status);
      queryClient.setQueryData<ManuscriptData>(
        ["manuscript", worldId],
        (current) =>
          current
            ? {
                ...current,
                chapters: current.chapters.map((chapter) =>
                  chapter.id === selectedChapter.id
                    ? { ...chapter, status }
                    : chapter,
                ),
              }
            : current,
      );
      toast.success(`Chapter marked ${status}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update status.",
      );
    }
  }

  if (manuscriptQuery.isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={
            manuscriptQuery.error instanceof Error
              ? manuscriptQuery.error.message
              : "The manuscript could not be loaded."
          }
          retry={() => {
            void manuscriptQuery.refetch();
          }}
        />
      </div>
    );
  }

  if (manuscriptQuery.isLoading || !editor) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl text-foreground">
            Begin your manuscript
          </h1>

          <p className="mt-3 text-muted-foreground">
            This world does not have any chapters yet.
          </p>

          <Button className="mt-6" onClick={addChapter}>
            <Plus className="size-4" />
            Create Chapter One
          </Button>
        </div>
      </div>
    );
  }

  const sessionWords =
    sessionStart === null ? 0 : Math.max(0, wordCount - sessionStart);
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 275));

  const toolbar = (
    <div className="sticky top-14 z-30 flex flex-wrap items-center gap-1 border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur-sm">
      {!focusMode && !leftOpen ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLeftOpen(true)}
          aria-label="Show chapters"
        >
          <PanelLeftOpen className="size-4" />
        </Button>
      ) : null}

      <Button
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="size-4" />
      </Button>

      <Button
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="size-4" />
      </Button>

      <Button
        variant={
          editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
        }
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Heading"
      >
        <Heading2 className="size-4" />
      </Button>

      <Button
        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
      >
        <Quote className="size-4" />
      </Button>

      <Button
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <List className="size-4" />
      </Button>

      <Button
        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Numbered list"
      >
        <ListOrdered className="size-4" />
      </Button>

      <div className="mx-1 h-5 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo2 className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo2 className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        * * *
      </Button>

      <div
        className={cn(
          "ml-2 flex items-center gap-1.5 text-xs",
          saveState === "error"
            ? "text-destructive"
            : saveState === "offline"
              ? "text-ember"
              : saveState === "saved"
                ? "text-forest"
                : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {saveState === "saving" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : saveState === "saved" ? (
          <Check className="size-3.5" />
        ) : (
          <Save className="size-3.5" />
        )}

        {saveState === "saving"
          ? "Saving…"
          : saveState === "saved"
            ? "Saved"
            : saveState === "offline"
              ? "Saved locally"
              : "Save failed"}
      </div>

      <span className="ml-2 text-xs text-muted-foreground">
        {wordCount.toLocaleString()} words
        {sessionWords > 0
          ? ` · ${sessionWords.toLocaleString()} this session`
          : ""}
        {` · ${estimatedPages} ${estimatedPages === 1 ? "page" : "pages"}`}
      </span>

      <div className="relative ml-auto">
        <Button
          variant={preferencesOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setPreferencesOpen((current) => !current)}
          aria-label="Writing appearance"
          aria-expanded={preferencesOpen}
        >
          <SlidersHorizontal className="size-4" />
          Appearance
        </Button>

        {preferencesOpen ? (
          <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Writing appearance
            </p>

            <label className="mt-4 block text-xs text-muted-foreground">
              Font
              <select
                value={preferences.font}
                onChange={(event) =>
                  changePreference("font", event.target.value as ManuscriptFont)
                }
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
              >
                <option value="literary">Cormorant Garamond</option>
                <option value="classic">Georgia</option>
                <option value="book">Book serif</option>
                <option value="modern">Clean sans-serif</option>
              </select>
            </label>

            <label className="mt-3 block text-xs text-muted-foreground">
              Text size
              <select
                value={preferences.size}
                onChange={(event) =>
                  changePreference("size", event.target.value as ManuscriptSize)
                }
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
              >
                <option value="small">Small</option>
                <option value="medium">Comfortable</option>
                <option value="large">Large</option>
              </select>
            </label>

            <label className="mt-3 block text-xs text-muted-foreground">
              Line spacing
              <select
                value={preferences.spacing}
                onChange={(event) =>
                  changePreference(
                    "spacing",
                    event.target.value as ManuscriptSpacing,
                  )
                }
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => changePreference("view", "continuous")}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs transition-colors",
                  preferences.view === "continuous"
                    ? "border-gold/60 bg-gold/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Continuous
              </button>
              <button
                type="button"
                onClick={() => changePreference("view", "pages")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs transition-colors",
                  preferences.view === "pages"
                    ? "border-gold/60 bg-gold/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <FileText className="size-3.5" />
                Pages
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Button
        variant={typewriterMode ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setTypewriterMode((current) => !current)}
        title="Keep the active paragraph near the center of the screen"
      >
        <ScrollText className="size-4" />
        Typewriter
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setFocusMode((current) => !current)}
      >
        {focusMode ? (
          <Shrink className="size-4" />
        ) : (
          <Expand className="size-4" />
        )}

        {focusMode ? "Exit focus" : "Focus"}
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        "min-h-[calc(100vh-3.5rem)]",
        focusMode && "fixed inset-0 z-50 overflow-y-auto bg-background",
      )}
    >
      {toolbar}

      <div className="flex min-h-[calc(100vh-6.5rem)]">
        {!focusMode && leftOpen ? (
          <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-sidebar/40 lg:block">
            <div className="sticky top-[6.75rem]">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Chapters
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={addChapter}
                    disabled={creatingChapter}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    aria-label="Add chapter"
                  >
                    {creatingChapter ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setLeftOpen(false)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Hide chapters"
                  >
                    <PanelLeftClose className="size-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-2">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      void selectChapter(chapter);
                    }}
                    className={cn(
                      "mb-1 w-full rounded-md px-3 py-2.5 text-left transition-colors",
                      chapter.id === selectedChapter.id
                        ? "bg-accent text-foreground shadow-[inset_2px_0_0_0_var(--color-gold)]"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <span className="block text-[0.65rem] uppercase tracking-[0.16em]">
                      Chapter {chapter.position}
                    </span>

                    <span className="mt-0.5 block truncate font-display text-base">
                      {chapter.title}
                    </span>

                    <span className="mt-1 block text-xs">
                      {chapter.wordCount.toLocaleString()} words
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        ) : null}

        <main className="manuscript-workspace min-w-0 flex-1 overflow-x-hidden">
          <article
            className={cn(
              "manuscript-page mx-auto w-full px-6 py-12 sm:px-10 lg:py-16",
              focusMode ? "max-w-[820px]" : "max-w-[760px]",
              typewriterMode && "manuscript-page--typewriter",
              preferences.view === "pages" && "manuscript-page--paged",
            )}
            data-manuscript-font={preferences.font}
            data-manuscript-size={preferences.size}
            data-manuscript-spacing={preferences.spacing}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold-soft">
                  Chapter {selectedChapter.position}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    const statuses: ManuscriptChapter["status"][] = [
                      "draft",
                      "reviewed",
                      "final",
                    ];
                    const index = statuses.indexOf(selectedChapter.status);
                    const nextStatus =
                      statuses[(index + 1) % statuses.length] ?? "draft";
                    void changeStatus(nextStatus);
                  }}
                  className="mt-2 rounded-full border border-border/70 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
                  title="Click to change chapter status"
                >
                  {selectedChapter.status}
                </button>
              </div>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChapterMenuOpen((current) => !current)}
                  aria-label="Chapter actions"
                  aria-expanded={chapterMenuOpen}
                >
                  {chapterActionPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="size-4" />
                  )}
                </Button>

                {chapterMenuOpen ? (
                  <div className="absolute right-0 top-10 z-40 w-52 overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-xl">
                    <button
                      type="button"
                      onClick={() => void createSnapshot()}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"
                    >
                      <Save className="size-4" />
                      Create snapshot
                    </button>
                    <button
                      type="button"
                      onClick={() => void duplicateSelectedChapter()}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"
                    >
                      <Copy className="size-4" />
                      Duplicate chapter
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeSelectedChapter()}
                      disabled={chapters.length === 1}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="size-4" />
                      Delete chapter
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <input
              value={chapterTitle}
              onChange={(event) => changeChapterTitle(event.target.value)}
              aria-label="Chapter title"
              className="mt-2 w-full border-none bg-transparent font-display text-4xl leading-tight text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Untitled Chapter"
            />

            <input
              value={chapterSubtitle}
              onChange={(event) => changeChapterSubtitle(event.target.value)}
              aria-label="Chapter subtitle"
              className="mt-2 w-full border-none bg-transparent font-display text-lg italic text-muted-foreground outline-none placeholder:text-muted-foreground/45"
              placeholder="Add an optional subtitle…"
            />

            <div className="mt-10">
              <EditorContent editor={editor} />
            </div>

            {preferences.view === "pages" ? (
              <footer className="manuscript-page__footer" aria-hidden="true">
                <span>{manuscriptQuery.data.world.title}</span>
                <span>
                  {estimatedPages} {estimatedPages === 1 ? "page" : "pages"}
                </span>
              </footer>
            ) : null}
          </article>
        </main>

        {!focusMode ? (
          <aside className="hidden w-72 shrink-0 border-l border-border/60 bg-sidebar/20 xl:block">
            <div className="sticky top-[6.75rem] p-5">
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                Story Memory
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Character, place, lore and continuity information will appear
                here after chapter analysis is connected.
              </p>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
