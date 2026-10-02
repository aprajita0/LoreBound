import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  EditorContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import {
  Bold,
  ChevronDown,
  Eye,
  EyeOff,
  FileWarning,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Quote,
  Redo2,
  ShieldAlert,
  Star,
  Undo2,
  X,
} from "lucide-react";
import {
  createSecret,
  getKnowledgeStateLabel,
  getSecretCategoryLabel,
  getSecretSeverityLabel,
  getSecretStatusLabel,
  updateSecret,
  type KnowledgeState,
  type SaveSecretInput,
  type Secret,
  type SecretCategory,
  type SecretKnowledge,
  type SecretSeverity,
  type SecretStatus,
} from "@/services/secrets";
import type { Place } from "@/services/places";

export interface SecretCharacterOption {
  id: string;
  name: string;
  role?: string;
}

export interface SecretChapterOption {
  id: string;
  title: string;
  position?: number;
}

export interface SecretLoreOption {
  id: string;
  title: string;
  category?: string;
}

interface SecretEntryModalProps {
  open: boolean;
  worldId: string;
  secret?: Secret | null;

  characters: SecretCharacterOption[];
  chapters: SecretChapterOption[];
  places: Place[];
  loreEntries: SecretLoreOption[];

  onClose: () => void;
  onSaved: (secret: Secret) => void;
}

const SECRET_CATEGORIES: SecretCategory[] = [
  "identity",
  "betrayal",
  "relationship",
  "crime",
  "political",
  "magical",
  "historical",
  "prophecy",
  "lineage",
  "other",
];

const SECRET_SEVERITIES: SecretSeverity[] = [
  "minor",
  "dangerous",
  "catastrophic",
];

const SECRET_STATUSES: SecretStatus[] = [
  "buried",
  "active",
  "partially_revealed",
  "exposed",
];

const KNOWLEDGE_STATES: KnowledgeState[] = [
  "unaware",
  "suspects",
  "knows",
];

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

const controlClass =
  "w-full border border-border bg-background/70 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-red-400/55";

export function SecretEntryModal({
  open,
  worldId,
  secret,
  characters,
  chapters,
  places,
  loreEntries,
  onClose,
  onSaved,
}: SecretEntryModalProps) {
  const [title, setTitle] = useState("");

  const [category, setCategory] =
    useState<SecretCategory>("other");

  const [severity, setSeverity] =
    useState<SecretSeverity>("dangerous");

  const [status, setStatus] =
    useState<SecretStatus>("buried");

  const [publicStory, setPublicStory] =
    useState("");

  const [
    revealCondition,
    setRevealCondition,
  ] = useState("");

  const [consequences, setConsequences] =
    useState("");

  const [evidence, setEvidence] =
    useState("");

  const [isFeatured, setIsFeatured] =
    useState(false);

  const [
    characterKnowledge,
    setCharacterKnowledge,
  ] = useState<SecretKnowledge[]>([]);

  const [placeIds, setPlaceIds] =
    useState<string[]>([]);

  const [loreEntryIds, setLoreEntryIds] =
    useState<string[]>([]);

  const [chapterIds, setChapterIds] =
    useState<string[]>([]);

  const [inspectorOpen, setInspectorOpen] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isEditing = Boolean(secret);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder:
          "Write the truth as it actually happened—what is hidden, who concealed it, and why it matters…",
      }),
    ],
    content: EMPTY_DOCUMENT,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[46vh] outline-none",
      },
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(secret?.title ?? "");
    setCategory(
      secret?.category ?? "other",
    );
    setSeverity(
      secret?.severity ?? "dangerous",
    );
    setStatus(
      secret?.status ?? "buried",
    );
    setPublicStory(
      secret?.publicStory ?? "",
    );
    setRevealCondition(
      secret?.revealCondition ?? "",
    );
    setConsequences(
      secret?.consequences ?? "",
    );
    setEvidence(
      secret?.evidence ?? "",
    );
    setIsFeatured(
      secret?.isFeatured ?? false,
    );
    setCharacterKnowledge(
      secret?.characterKnowledge ?? [],
    );
    setPlaceIds(
      secret?.placeIds ?? [],
    );
    setLoreEntryIds(
      secret?.loreEntryIds ?? [],
    );
    setChapterIds(
      secret?.chapterIds ?? [],
    );
    setError("");

    editor?.commands.setContent(
      secret?.truthJson ??
        EMPTY_DOCUMENT,
    );
  }, [editor, open, secret]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [onClose, open, saving]);

  const knowledgeCounts =
    useMemo(() => {
      const counts = {
        knows: 0,
        suspects: 0,
        unaware: 0,
      };

      for (const character of characters) {
        const state =
          characterKnowledge.find(
            (record) =>
              record.characterId ===
              character.id,
          )?.state ?? "unaware";

        counts[state] += 1;
      }

      return counts;
    }, [
      characterKnowledge,
      characters,
    ]);

  if (!open) {
    return null;
  }

  function getCharacterKnowledge(
    characterId: string,
  ): SecretKnowledge {
    return (
      characterKnowledge.find(
        (record) =>
          record.characterId ===
          characterId,
      ) ?? {
        characterId,
        state: "unaware",
        notes: "",
        learnedInChapterId: null,
      }
    );
  }

  function updateCharacterKnowledge(
    characterId: string,
    changes: Partial<SecretKnowledge>,
  ) {
    setCharacterKnowledge(
      (current) => {
        const existing =
          current.find(
            (record) =>
              record.characterId ===
              characterId,
          ) ?? {
            characterId,
            state:
              "unaware" as KnowledgeState,
            notes: "",
            learnedInChapterId: null,
          };

        const nextRecord = {
          ...existing,
          ...changes,
          characterId,
        };

        if (
          nextRecord.state === "unaware"
        ) {
          nextRecord.learnedInChapterId =
            null;
        }

        const withoutCharacter =
          current.filter(
            (record) =>
              record.characterId !==
              characterId,
          );

        return [
          ...withoutCharacter,
          nextRecord,
        ];
      },
    );
  }

  function toggleSelection(
    id: string,
    values: string[],
    setter: (values: string[]) => void,
  ) {
    setter(
      values.includes(id)
        ? values.filter(
            (value) => value !== id,
          )
        : [...values, id],
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Give this secret a title.",
      );
      return;
    }

    if (!editor) {
      setError(
        "The truth editor is still loading.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const completeKnowledge =
        characters.map((character) => {
          const knowledge =
            getCharacterKnowledge(
              character.id,
            );

          return {
            ...knowledge,
            characterId: character.id,
          };
        });

      const input: SaveSecretInput = {
        worldId,
        title,
        category,
        severity,
        status,
        publicStory,
        truthJson: editor.getJSON(),
        truthPlainText:
          editor.getText({
            blockSeparator: "\n\n",
          }),
        revealCondition,
        consequences,
        evidence,
        imagePath:
          secret?.imagePath ?? null,
        isFeatured,
        sortOrder:
          secret?.sortOrder ?? 0,
        characterKnowledge:
          completeKnowledge,
        placeIds,
        loreEntryIds,
        chapterIds,
      };

      const savedSecret = secret
        ? await updateSecret(
            secret.id,
            input,
          )
        : await createSecret(input);

      onSaved(savedSecret);
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The secret could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(123,33,46,0.18),transparent_31%),radial-gradient(circle_at_90%_5%,rgba(83,42,72,0.15),transparent_34%)]" />

        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(183,126,91,0.45)_0_1px,transparent_1.3px)] [background-size:181px_163px]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative min-h-screen"
      >
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-border bg-background/94 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close secret editor"
              className="p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              <X className="size-5" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-red-300">
                {isEditing
                  ? "Revising classified record"
                  : "Sealing a new secret"}
              </p>

              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {title.trim() ||
                  "Untitled secret"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setInspectorOpen(
                  (current) => !current,
                )
              }
              className="hidden items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-red-400/40 hover:text-foreground lg:inline-flex"
            >
              {inspectorOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}

              Details
            </button>

            <button
              type="submit"
              disabled={saving || !editor}
              className="inline-flex items-center gap-2 bg-red-300 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-red-200 disabled:opacity-50"
            >
              {saving && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {saving
                ? "Sealing…"
                : isEditing
                  ? "Save changes"
                  : "Seal secret"}
            </button>
          </div>
        </header>

        {error && (
          <div className="sticky top-16 z-20 border-b border-red-400/30 bg-red-500/10 px-6 py-3 text-center text-sm text-red-200">
            {error}
          </div>
        )}

        <div
          className={`mx-auto grid max-w-[1500px] ${
            inspectorOpen
              ? "lg:grid-cols-[minmax(0,1fr)_390px]"
              : "grid-cols-1"
          }`}
        >
          <main className="min-w-0 px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
            <div className="mx-auto max-w-[840px]">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-red-300">
                  Classified record
                </p>

                <span className="h-3 w-px bg-red-300/40" />

                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                  {getSecretCategoryLabel(
                    category,
                  )}
                </p>
              </div>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value,
                  )
                }
                placeholder="Name what must remain hidden"
                autoFocus
                className="mt-5 w-full bg-transparent font-serif text-5xl leading-tight tracking-[-0.035em] text-foreground outline-none placeholder:text-muted-foreground/30 sm:text-6xl"
              />

              <section className="mt-10 border-l-2 border-muted-foreground/25 pl-6">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  The accepted story
                </p>

                <textarea
                  value={publicStory}
                  onChange={(event) =>
                    setPublicStory(
                      event.target.value,
                    )
                  }
                  placeholder="What does everyone believe instead?"
                  rows={4}
                  className="mt-3 w-full resize-none bg-transparent font-serif text-lg italic leading-8 text-muted-foreground outline-none placeholder:text-muted-foreground/35"
                />
              </section>

              <div className="mt-12 flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-full border border-red-300/35 bg-red-400/10 text-red-300">
                  <EyeOff className="size-4" />
                </div>

                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-red-300">
                    The concealed truth
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    This is the complete account
                    known only to the author.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-y border-border">
                <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-background/94 py-2 backdrop-blur">
                  <ToolbarButton
                    label="Bold"
                    active={editor?.isActive(
                      "bold",
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleBold()
                        .run()
                    }
                  >
                    <Bold className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Italic"
                    active={editor?.isActive(
                      "italic",
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleItalic()
                        .run()
                    }
                  >
                    <Italic className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Heading 2"
                    active={editor?.isActive(
                      "heading",
                      {
                        level: 2,
                      },
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({
                          level: 2,
                        })
                        .run()
                    }
                  >
                    <Heading2 className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Heading 3"
                    active={editor?.isActive(
                      "heading",
                      {
                        level: 3,
                      },
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({
                          level: 3,
                        })
                        .run()
                    }
                  >
                    <Heading3 className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Quote"
                    active={editor?.isActive(
                      "blockquote",
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleBlockquote()
                        .run()
                    }
                  >
                    <Quote className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Bullet list"
                    active={editor?.isActive(
                      "bulletList",
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleBulletList()
                        .run()
                    }
                  >
                    <List className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Numbered list"
                    active={editor?.isActive(
                      "orderedList",
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleOrderedList()
                        .run()
                    }
                  >
                    <ListOrdered className="size-4" />
                  </ToolbarButton>

                  <span className="mx-1 h-5 w-px bg-border" />

                  <ToolbarButton
                    label="Undo"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .undo()
                        .run()
                    }
                  >
                    <Undo2 className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Redo"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .redo()
                        .run()
                    }
                  >
                    <Redo2 className="size-4" />
                  </ToolbarButton>
                </div>

                <div className="py-9 text-[1.02rem] leading-[1.95] text-foreground/90 [&_.ProseMirror_h2]:mb-5 [&_.ProseMirror_h2]:mt-12 [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-normal [&_.ProseMirror_h3]:mb-4 [&_.ProseMirror_h3]:mt-9 [&_.ProseMirror_h3]:font-serif [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_p]:my-5 [&_.ProseMirror_blockquote]:my-8 [&_.ProseMirror_blockquote]:border-l [&_.ProseMirror_blockquote]:border-red-300/60 [&_.ProseMirror_blockquote]:pl-6 [&_.ProseMirror_blockquote]:font-serif [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-red-200/80 [&_.ProseMirror_ul]:my-6 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:marker:text-red-300 [&_.ProseMirror_ol]:my-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:marker:text-red-300 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground/40 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]">
                  <EditorContent
                    editor={editor}
                  />
                </div>
              </div>

              <section className="mt-12 grid gap-8 md:grid-cols-2">
                <LongTextField
                  label="Reveal condition"
                  value={revealCondition}
                  onChange={
                    setRevealCondition
                  }
                  placeholder="What event, discovery, or choice could expose this secret?"
                  icon={
                    <Eye className="size-4" />
                  }
                />

                <LongTextField
                  label="Consequences"
                  value={consequences}
                  onChange={setConsequences}
                  placeholder="What changes if the truth becomes known?"
                  icon={
                    <ShieldAlert className="size-4" />
                  }
                />
              </section>

              <section className="mt-8">
                <LongTextField
                  label="Evidence and clues"
                  value={evidence}
                  onChange={setEvidence}
                  placeholder="Documents, behavior, testimony, magical traces, contradictions..."
                  icon={
                    <FileWarning className="size-4" />
                  }
                  rows={5}
                />
              </section>

              <section className="mt-14 border-t border-border pt-10">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.23em] text-red-300">
                      Knowledge map
                    </p>

                    <h2 className="mt-3 font-serif text-3xl text-foreground">
                      Who carries the truth?
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Track what each character
                      knows, suspects, or has never
                      discovered.
                    </p>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <KnowledgeCount
                      label="Knows"
                      count={
                        knowledgeCounts.knows
                      }
                      tone="text-red-200"
                    />

                    <KnowledgeCount
                      label="Suspects"
                      count={
                        knowledgeCounts.suspects
                      }
                      tone="text-amber-300"
                    />

                    <KnowledgeCount
                      label="Unaware"
                      count={
                        knowledgeCounts.unaware
                      }
                      tone="text-muted-foreground"
                    />
                  </div>
                </div>

                {characters.length === 0 ? (
                  <div className="mt-7 border border-dashed border-border px-6 py-12 text-center">
                    <p className="font-serif text-lg text-foreground">
                      No characters have been
                      recorded.
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Add characters before assigning
                      knowledge of this secret.
                    </p>
                  </div>
                ) : (
                  <div className="mt-7 divide-y divide-border border-y border-border">
                    {characters.map(
                      (character) => {
                        const knowledge =
                          getCharacterKnowledge(
                            character.id,
                          );

                        return (
                          <CharacterKnowledgeRow
                            key={character.id}
                            character={character}
                            knowledge={knowledge}
                            chapters={chapters}
                            onChange={(changes) =>
                              updateCharacterKnowledge(
                                character.id,
                                changes,
                              )
                            }
                          />
                        );
                      },
                    )}
                  </div>
                )}
              </section>
            </div>
          </main>

          {inspectorOpen && (
            <aside className="border-t border-border bg-card/25 px-6 py-8 lg:min-h-[calc(100vh-4rem)] lg:border-l lg:border-t-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-red-300">
                Classified details
              </p>

              <div className="mt-7 space-y-7">
                <InspectorField label="Category">
                  <SelectShell>
                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target
                            .value as SecretCategory,
                        )
                      }
                      className={`${controlClass} appearance-none pr-9`}
                    >
                      {SECRET_CATEGORIES.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {getSecretCategoryLabel(
                              option,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </SelectShell>
                </InspectorField>

                <InspectorField label="Severity">
                  <SelectShell>
                    <select
                      value={severity}
                      onChange={(event) =>
                        setSeverity(
                          event.target
                            .value as SecretSeverity,
                        )
                      }
                      className={`${controlClass} appearance-none pr-9`}
                    >
                      {SECRET_SEVERITIES.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {getSecretSeverityLabel(
                              option,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </SelectShell>
                </InspectorField>

                <InspectorField label="Exposure status">
                  <SelectShell>
                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target
                            .value as SecretStatus,
                        )
                      }
                      className={`${controlClass} appearance-none pr-9`}
                    >
                      {SECRET_STATUSES.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {getSecretStatusLabel(
                              option,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </SelectShell>
                </InspectorField>

                <button
                  type="button"
                  onClick={() =>
                    setIsFeatured(
                      (current) => !current,
                    )
                  }
                  className={`flex w-full items-center gap-3 border p-3 text-left transition ${
                    isFeatured
                      ? "border-red-300/50 bg-red-400/10"
                      : "border-border hover:border-red-300/30"
                  }`}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-full ${
                      isFeatured
                        ? "bg-red-300 text-slate-950"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Star
                      className="size-3.5"
                      fill={
                        isFeatured
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </span>

                  <span>
                    <span className="block text-xs text-foreground">
                      Featured secret
                    </span>

                    <span className="mt-1 block text-[0.65rem] leading-4 text-muted-foreground">
                      Display this as the primary
                      classified record.
                    </span>
                  </span>
                </button>

                <SelectionSection
                  title="Connected places"
                  options={places.map(
                    (place) => ({
                      id: place.id,
                      label: place.name,
                      detail: humanize(
                        place.placeType,
                      ),
                    }),
                  )}
                  selectedIds={placeIds}
                  onToggle={(id) =>
                    toggleSelection(
                      id,
                      placeIds,
                      setPlaceIds,
                    )
                  }
                />

                <SelectionSection
                  title="Connected lore"
                  options={loreEntries.map(
                    (entry) => ({
                      id: entry.id,
                      label: entry.title,
                      detail:
                        entry.category,
                    }),
                  )}
                  selectedIds={loreEntryIds}
                  onToggle={(id) =>
                    toggleSelection(
                      id,
                      loreEntryIds,
                      setLoreEntryIds,
                    )
                  }
                />

                <SelectionSection
                  title="Connected chapters"
                  options={chapters.map(
                    (chapter) => ({
                      id: chapter.id,
                      label: chapter.title,
                      detail:
                        chapter.position !==
                        undefined
                          ? `Chapter ${chapter.position}`
                          : undefined,
                    }),
                  )}
                  selectedIds={chapterIds}
                  onToggle={(id) =>
                    toggleSelection(
                      id,
                      chapterIds,
                      setChapterIds,
                    )
                  }
                />
              </div>
            </aside>
          )}
        </div>
      </form>
    </div>
  );
}

function CharacterKnowledgeRow({
  character,
  knowledge,
  chapters,
  onChange,
}: {
  character: SecretCharacterOption;
  knowledge: SecretKnowledge;
  chapters: SecretChapterOption[];
  onChange: (
    changes: Partial<SecretKnowledge>,
  ) => void;
}) {
  const stateTone =
    knowledge.state === "knows"
      ? "border-red-300/45 bg-red-400/10"
      : knowledge.state === "suspects"
        ? "border-amber-300/40 bg-amber-400/[0.06]"
        : "border-transparent";

  return (
    <div
      className={`grid gap-4 px-3 py-5 transition md:grid-cols-[180px_150px_minmax(0,1fr)] ${stateTone}`}
    >
      <div>
        <p className="font-serif text-base text-foreground">
          {character.name}
        </p>

        {character.role && (
          <p className="mt-1 text-[0.68rem] text-muted-foreground">
            {character.role}
          </p>
        )}
      </div>

      <SelectShell>
        <select
          value={knowledge.state}
          onChange={(event) =>
            onChange({
              state:
                event.target
                  .value as KnowledgeState,
            })
          }
          className={`${controlClass} appearance-none pr-9`}
        >
          {KNOWLEDGE_STATES.map(
            (state) => (
              <option
                key={state}
                value={state}
              >
                {getKnowledgeStateLabel(
                  state,
                )}
              </option>
            ),
          )}
        </select>
      </SelectShell>

      <div className="space-y-3">
        <input
          value={knowledge.notes}
          onChange={(event) =>
            onChange({
              notes: event.target.value,
            })
          }
          placeholder={
            knowledge.state === "unaware"
              ? "Why are they kept unaware?"
              : "What exactly do they know?"
          }
          className={controlClass}
        />

        {knowledge.state !== "unaware" && (
          <SelectShell>
            <select
              value={
                knowledge.learnedInChapterId ??
                ""
              }
              onChange={(event) =>
                onChange({
                  learnedInChapterId:
                    event.target.value ||
                    null,
                })
              }
              className={`${controlClass} appearance-none pr-9`}
            >
              <option value="">
                When did they learn it?
              </option>

              {chapters.map((chapter) => (
                <option
                  key={chapter.id}
                  value={chapter.id}
                >
                  {chapter.position !==
                  undefined
                    ? `${chapter.position}. `
                    : ""}
                  {chapter.title}
                </option>
              ))}
            </select>
          </SelectShell>
        )}
      </div>
    </div>
  );
}

function LongTextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[0.63rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="text-red-300">
          {icon}
        </span>

        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        className="mt-3 w-full resize-y border border-border bg-card/20 px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/40 focus:border-red-300/45"
      />
    </label>
  );
}

function KnowledgeCount({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <div className="text-center">
      <p
        className={`font-serif text-xl ${tone}`}
      >
        {count}
      </p>

      <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex size-8 items-center justify-center transition ${
        active
          ? "bg-red-300 text-slate-950"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function InspectorField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}

function SelectShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative">
      {children}

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

interface SelectionOption {
  id: string;
  label: string;
  detail?: string;
}

function SelectionSection({
  title,
  options,
  selectedIds,
  onToggle,
}: {
  title: string;
  options: SelectionOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h3>

        {selectedIds.length > 0 && (
          <span className="text-[0.65rem] text-red-300">
            {selectedIds.length}
          </span>
        )}
      </div>

      {options.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Nothing has been recorded yet.
        </p>
      ) : (
        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto pr-1">
          {options.map((option) => {
            const selected =
              selectedIds.includes(option.id);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  onToggle(option.id)
                }
                className={`flex w-full items-center justify-between px-2.5 py-2 text-left transition ${
                  selected
                    ? "bg-red-400/10"
                    : "hover:bg-muted/35"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs text-foreground">
                    {option.label}
                  </span>

                  {option.detail && (
                    <span className="mt-0.5 block truncate text-[0.65rem] text-muted-foreground">
                      {option.detail}
                    </span>
                  )}
                </span>

                <span
                  className={`ml-3 flex size-4 shrink-0 items-center justify-center border text-[0.6rem] ${
                    selected
                      ? "border-red-300 bg-red-300 text-slate-950"
                      : "border-border"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function humanize(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}