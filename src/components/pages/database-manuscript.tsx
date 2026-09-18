import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  Bold,
  Check,
  Expand,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Quote,
  Redo2,
  Save,
  Shrink,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/app/primitives";
import {
  createChapter,
  getManuscript,
  saveChapter,
  type ManuscriptChapter,
  type ManuscriptData,
  type SaveChapterInput,
} from "@/services/manuscripts";
import { cn } from "@/lib/utils";

type SaveState = "saved" | "saving" | "error";

interface DatabaseManuscriptPageProps {
  worldId: string;
}

function countWords(text: string): number {
  const trimmed = text.trim();

  return trimmed ? trimmed.split(/\s+/u).length : 0;
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
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [wordCount, setWordCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [creatingChapter, setCreatingChapter] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<SaveChapterInput | null>(null);
  const loadingChapter = useRef(false);
  const chapterTitleRef = useRef("");

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
      setSaveState("saving");

      try {
        await saveChapter(payload);
        updateCachedChapter(payload);

        if (pendingSave.current?.chapterId === payload.chapterId) {
          pendingSave.current = null;
        }

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

      scheduleSave({
        chapterId: selectedChapterId,
        title: chapterTitleRef.current.trim() || "Untitled Chapter",
        contentJson: currentEditor.getJSON(),
        plainText,
        wordCount: nextWordCount,
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
    setWordCount(selectedChapter.wordCount);
    setSessionStart(selectedChapter.wordCount);

    editor.commands.setContent(selectedChapter.contentJson, {
      emitUpdate: false,
    });

    queueMicrotask(() => {
      loadingChapter.current = false;
    });
  }, [editor, selectedChapter?.id]);

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

    window.addEventListener("keydown", handleKeyboardSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyboardSave);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
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
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
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
            : "Save failed"}
      </div>

      <span className="ml-2 text-xs text-muted-foreground">
        {wordCount.toLocaleString()} words
        {sessionWords > 0
          ? ` · ${sessionWords.toLocaleString()} this session`
          : ""}
      </span>

      <Button
        variant="ghost"
        size="sm"
        className="ml-auto"
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

        <main className="min-w-0 flex-1">
          <article className="mx-auto w-full max-w-[780px] px-5 py-12 sm:px-8 lg:py-16">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-gold-soft">
              Chapter {selectedChapter.position}
            </p>

            <input
              value={chapterTitle}
              onChange={(event) => changeChapterTitle(event.target.value)}
              aria-label="Chapter title"
              className="mt-2 w-full border-none bg-transparent font-display text-4xl leading-tight text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Untitled Chapter"
            />

            <div className="mt-8">
              <EditorContent editor={editor} />
            </div>
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