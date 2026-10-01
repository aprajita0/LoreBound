import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
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
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Quote,
  Redo2,
  Star,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import {
  createLoreEntry,
  getLoreCategoryLabel,
  getLoreStatusLabel,
  updateLoreEntry,
  uploadLoreImage,
  type LoreCategory,
  type LoreEntry,
  type LoreStatus,
  type SaveLoreEntryInput,
} from "@/services/lore";
import type { Place } from "@/services/places";

export interface LoreCharacterOption {
  id: string;
  name: string;
  role?: string;
}

interface LoreEntryModalProps {
  open: boolean;
  worldId: string;
  entry?: LoreEntry | null;
  entries: LoreEntry[];
  characters: LoreCharacterOption[];
  places: Place[];
  onClose: () => void;
  onSaved: (entry: LoreEntry) => void;
}

const LORE_CATEGORIES: LoreCategory[] = [
  "magic",
  "culture",
  "religion",
  "faction",
  "species",
  "bloodline",
  "artifact",
  "language",
  "tradition",
  "law",
  "history",
  "creature",
  "technology",
  "cosmology",
  "other",
];

const LORE_STATUSES: LoreStatus[] = [
  "draft",
  "canonical",
  "retired",
];

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const controlClass =
  "w-full border border-border bg-background/65 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/55 focus:border-gold/60";

export function LoreEntryModal({
  open,
  worldId,
  entry,
  entries,
  characters,
  places,
  onClose,
  onSaved,
}: LoreEntryModalProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<LoreCategory>("other");
  const [status, setStatus] =
    useState<LoreStatus>("draft");
  const [parentEntryId, setParentEntryId] =
    useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] =
    useState(false);
  const [characterIds, setCharacterIds] =
    useState<string[]>([]);
  const [placeIds, setPlaceIds] =
    useState<string[]>([]);
  const [relatedEntryIds, setRelatedEntryIds] =
    useState<string[]>([]);
  const [imageFile, setImageFile] =
    useState<File | null>(null);
  const [imagePreview, setImagePreview] =
    useState("");
  const [
    removeExistingImage,
    setRemoveExistingImage,
  ] = useState(false);
  const [draggingImage, setDraggingImage] =
    useState(false);
  const [inspectorOpen, setInspectorOpen] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(entry);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder:
          "Begin the account. Record what is known, what is disputed, and what the world has tried to forget…",
      }),
    ],
    content: EMPTY_DOCUMENT,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "min-h-[52vh] outline-none",
      },
    },
  });

  const parentOptions = useMemo(
    () =>
      entries.filter(
        (candidate) =>
          candidate.id !== entry?.id,
      ),
    [entries, entry?.id],
  );

  const relatedEntryOptions = parentOptions;

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(entry?.title ?? "");
    setCategory(entry?.category ?? "other");
    setStatus(entry?.status ?? "draft");
    setParentEntryId(entry?.parentEntryId ?? "");
    setSummary(entry?.summary ?? "");
    setTags(entry?.tags.join(", ") ?? "");
    setIsFeatured(entry?.isFeatured ?? false);
    setCharacterIds(entry?.characterIds ?? []);
    setPlaceIds(entry?.placeIds ?? []);
    setRelatedEntryIds(
      entry?.relatedEntryIds ?? [],
    );
    setImageFile(null);
    setImagePreview(entry?.imagePath ?? "");
    setRemoveExistingImage(false);
    setDraggingImage(false);
    setError("");

    editor?.commands.setContent(
      entry?.contentJson ?? EMPTY_DOCUMENT,
    );
  }, [editor, entry, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  useEffect(
    () => () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    },
    [imagePreview],
  );

  if (!open) {
    return null;
  }

  function toggleSelection(
    id: string,
    values: string[],
    setter: (next: string[]) => void,
  ) {
    setter(
      values.includes(id)
        ? values.filter((value) => value !== id)
        : [...values, id],
    );
  }

  function chooseImage(file: File) {
    const acceptedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!acceptedTypes.includes(file.type)) {
      setError(
        "Choose a JPEG, PNG, or WebP image.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "The image must be smaller than 5 MB.",
      );
      return;
    }

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
    setError("");
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (file) {
      chooseImage(file);
    }

    event.target.value = "";
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDraggingImage(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      chooseImage(file);
    }
  }

  function removeImage() {
    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview("");
    setRemoveExistingImage(true);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Give this archive record a title.",
      );
      return;
    }

    if (!editor) {
      setError(
        "The article editor is still loading.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      let finalImagePath: string | null =
        removeExistingImage
          ? null
          : (entry?.imagePath ?? null);

      if (imageFile) {
        finalImagePath = await uploadLoreImage(
          worldId,
          imageFile,
        );
      }

      const input: SaveLoreEntryInput = {
        worldId,
        parentEntryId: parentEntryId || null,
        title,
        category,
        status,
        summary,
        contentJson: editor.getJSON(),
        plainText: editor.getText({
          blockSeparator: "\n\n",
        }),
        imagePath: finalImagePath,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isFeatured,
        sortOrder: entry?.sortOrder ?? 0,
        characterIds,
        placeIds,
        relatedEntryIds,
      };

      const saved = entry
        ? await updateLoreEntry(entry.id, input)
        : await createLoreEntry(input);

      onSaved(saved);
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The archive record could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_5%,rgba(22,92,89,0.11),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(78,55,111,0.12),transparent_32%)]" />

      <form
        onSubmit={handleSubmit}
        className="relative min-h-screen"
      >
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-border bg-background/94 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close editor"
              className="p-2 text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-5" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-gold">
                {isEditing
                  ? "Revising archive record"
                  : "Binding a new record"}
              </p>

              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {title.trim() || "Untitled record"}
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
              className="hidden items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground lg:inline-flex"
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
              className="inline-flex items-center gap-2 bg-gold px-4 py-2 text-xs font-semibold text-background transition hover:brightness-110 disabled:opacity-50"
            >
              {saving && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {saving
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create record"}
            </button>
          </div>
        </header>

        {error && (
          <div className="sticky top-16 z-20 border-b border-red-500/25 bg-red-500/10 px-6 py-3 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        <div
          className={`mx-auto grid max-w-[1440px] ${
            inspectorOpen
              ? "lg:grid-cols-[minmax(0,1fr)_340px]"
              : "grid-cols-1"
          }`}
        >
          <main className="min-w-0 px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
            <div className="mx-auto max-w-[820px]">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-gold">
                {getLoreCategoryLabel(category)}
              </p>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Name this record"
                autoFocus
                className="mt-5 w-full bg-transparent font-serif text-5xl leading-tight tracking-[-0.035em] text-foreground outline-none placeholder:text-muted-foreground/35 sm:text-6xl"
              />

              <textarea
                value={summary}
                onChange={(event) =>
                  setSummary(event.target.value)
                }
                placeholder="Add a concise, atmospheric summary…"
                maxLength={300}
                rows={2}
                className="mt-5 w-full resize-none bg-transparent font-serif text-lg italic leading-8 text-gold/75 outline-none placeholder:text-muted-foreground/40"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="group relative mt-9 overflow-hidden border border-border">
                  <img
                    src={imagePreview}
                    alt="Cover preview"
                    className="max-h-[470px] w-full object-cover"
                  />

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-16 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="border border-white/25 bg-black/45 px-3 py-2 text-xs text-white backdrop-blur"
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={removeImage}
                      className="border border-red-400/30 bg-black/45 px-3 py-2 text-xs text-red-200 backdrop-blur"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDraggingImage(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDraggingImage(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDraggingImage(false);
                  }}
                  onDrop={handleDrop}
                  className={`mt-9 cursor-pointer border border-dashed px-6 py-12 text-center transition ${
                    draggingImage
                      ? "border-gold bg-gold/10"
                      : "border-border hover:border-gold/45"
                  }`}
                >
                  <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-border text-gold">
                    {draggingImage ? (
                      <Upload className="size-5" />
                    ) : (
                      <ImageIcon className="size-5" />
                    )}
                  </div>

                  <p className="mt-4 text-sm text-foreground">
                    {draggingImage
                      ? "Release to add the plate"
                      : "Add an illuminated cover plate"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    JPEG, PNG, or WebP · maximum 5 MB
                  </p>
                </div>
              )}

              <div className="mt-10 border-t border-border">
                <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 border-b border-border bg-background/92 py-2 backdrop-blur">
                  <ToolbarButton
                    label="Bold"
                    active={editor?.isActive("bold")}
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
                    active={editor?.isActive("italic")}
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
                      { level: 2 },
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({ level: 2 })
                        .run()
                    }
                  >
                    <Heading2 className="size-4" />
                  </ToolbarButton>

                  <ToolbarButton
                    label="Heading 3"
                    active={editor?.isActive(
                      "heading",
                      { level: 3 },
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({ level: 3 })
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

                <div className="py-9 text-[1.02rem] leading-[1.95] text-foreground/90 [&_.ProseMirror_h2]:mb-5 [&_.ProseMirror_h2]:mt-12 [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-normal [&_.ProseMirror_h3]:mb-4 [&_.ProseMirror_h3]:mt-9 [&_.ProseMirror_h3]:font-serif [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_p]:my-5 [&_.ProseMirror_blockquote]:my-8 [&_.ProseMirror_blockquote]:border-l [&_.ProseMirror_blockquote]:border-gold/60 [&_.ProseMirror_blockquote]:pl-6 [&_.ProseMirror_blockquote]:font-serif [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-gold/75 [&_.ProseMirror_ul]:my-6 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:marker:text-gold [&_.ProseMirror_ol]:my-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:marker:text-gold [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground/45 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </main>

          {inspectorOpen && (
            <aside className="border-t border-border bg-card/25 px-6 py-8 lg:min-h-[calc(100vh-4rem)] lg:border-l lg:border-t-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-gold">
                Record details
              </p>

              <div className="mt-7 space-y-7">
                <InspectorField label="Category">
                  <SelectShell>
                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target
                            .value as LoreCategory,
                        )
                      }
                      className={`${controlClass} appearance-none pr-9`}
                    >
                      {LORE_CATEGORIES.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {getLoreCategoryLabel(
                              option,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </SelectShell>
                </InspectorField>

                <InspectorField label="Canon status">
                  <SelectShell>
                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target
                            .value as LoreStatus,
                        )
                      }
                      className={`${controlClass} appearance-none pr-9`}
                    >
                      {LORE_STATUSES.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {getLoreStatusLabel(
                              option,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </SelectShell>
                </InspectorField>

                <InspectorField label="Parent record">
                  <SelectShell>
                    <select
                      value={parentEntryId}
                      onChange={(event) =>
                        setParentEntryId(
                          event.target.value,
                        )
                      }
                      className={`${controlClass} appearance-none pr-9`}
                    >
                      <option value="">
                        Independent record
                      </option>

                      {parentOptions.map((option) => (
                        <option
                          key={option.id}
                          value={option.id}
                        >
                          {option.title}
                        </option>
                      ))}
                    </select>
                  </SelectShell>
                </InspectorField>

                <InspectorField label="Tags">
                  <input
                    value={tags}
                    onChange={(event) =>
                      setTags(event.target.value)
                    }
                    placeholder="griffins, terra, familiars"
                    className={controlClass}
                  />

                  <p className="mt-2 text-[0.68rem] leading-5 text-muted-foreground">
                    Separate tags with commas.
                  </p>
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
                      ? "border-gold/50 bg-gold/10"
                      : "border-border hover:border-gold/35"
                  }`}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-full ${
                      isFeatured
                        ? "bg-gold text-background"
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
                      Cover record
                    </span>

                    <span className="mt-1 block text-[0.65rem] text-muted-foreground">
                      Feature this entry in the
                      archive.
                    </span>
                  </span>
                </button>

                <SelectionSection
                  title="Connected characters"
                  options={characters.map(
                    (character) => ({
                      id: character.id,
                      label: character.name,
                      detail: character.role,
                    }),
                  )}
                  selectedIds={characterIds}
                  onToggle={(id) =>
                    toggleSelection(
                      id,
                      characterIds,
                      setCharacterIds,
                    )
                  }
                />

                <SelectionSection
                  title="Connected places"
                  options={places.map((place) => ({
                    id: place.id,
                    label: place.name,
                    detail: humanize(
                      place.placeType,
                    ),
                  }))}
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
                  options={relatedEntryOptions.map(
                    (related) => ({
                      id: related.id,
                      label: related.title,
                      detail:
                        getLoreCategoryLabel(
                          related.category,
                        ),
                    }),
                  )}
                  selectedIds={relatedEntryIds}
                  onToggle={(id) =>
                    toggleSelection(
                      id,
                      relatedEntryIds,
                      setRelatedEntryIds,
                    )
                  }
                />
              </div>

              <div className="mt-10 border-t border-border pt-5">
                <div className="flex items-center gap-2 text-[0.68rem] text-muted-foreground">
                  <Eye className="size-3.5" />

                  The article will use this layout
                  when opened.
                </div>
              </div>
            </aside>
          )}
        </div>
      </form>
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
          ? "bg-gold text-background"
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
          <span className="text-[0.65rem] text-gold">
            {selectedIds.length}
          </span>
        )}
      </div>

      {options.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Nothing has been recorded yet.
        </p>
      ) : (
        <div className="mt-3 max-h-44 space-y-1 overflow-y-auto pr-1">
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
                    ? "bg-gold/10"
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
                      ? "border-gold bg-gold text-background"
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