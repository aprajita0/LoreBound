import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  BookOpenText,
  Check,
  FileText,
  FileUp,
  LoaderCircle,
  NotebookText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAcceptedSourceFileTypes,
  uploadSourceDocument,
  validateSourceFile,
  type ImportMode,
  type SourceDocument,
  type SourceType,
} from "@/services/source-documents";

interface SourceDocumentUploadModalProps {
  open: boolean;
  worldId: string;
  onClose: () => void;
  onUploaded?: (document: SourceDocument) => void;
}

interface SourceTypeOption {
  value: SourceType;
  label: string;
  description: string;
  icon: typeof BookOpenText;
}

interface ImportModeOption {
  value: ImportMode;
  label: string;
  description: string;
  icon: typeof Sparkles;
}

const SOURCE_TYPES: SourceTypeOption[] = [
  {
    value: "manuscript",
    label: "Manuscript",
    description:
      "A novel, draft, chapter collection, or other narrative work.",
    icon: BookOpenText,
  },
  {
    value: "world_bible",
    label: "World bible",
    description:
      "Existing notes about your world's characters, places, history, and lore.",
    icon: ScrollText,
  },
  {
    value: "reference_notes",
    label: "Reference notes",
    description:
      "Research, planning notes, outlines, or supplementary material.",
    icon: NotebookText,
  },
  {
    value: "other",
    label: "Other document",
    description:
      "Any other source that may contain information about this world.",
    icon: FileText,
  },
];

const IMPORT_MODES: ImportModeOption[] = [
  {
    value: "analyze_only",
    label: "Analyze only",
    description:
      "Find characters, relationships, lore, places, and secrets without adding the text to your manuscript.",
    icon: Sparkles,
  },
  {
    value: "import_only",
    label: "Import only",
    description:
      "Bring the document into Lorebound without running AI analysis.",
    icon: FileUp,
  },
  {
    value: "import_and_analyze",
    label: "Import and analyze",
    description:
      "Import the writing and prepare suggestions for you to review.",
    icon: UploadCloud,
  },
];

function getFilenameWithoutExtension(filename: string): string {
  const finalDot = filename.lastIndexOf(".");

  if (finalDot <= 0) {
    return filename;
  }

  return filename.slice(0, finalDot);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

export function SourceDocumentUploadModal({
  open,
  worldId,
  onClose,
  onUploaded,
}: SourceDocumentUploadModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] =
    useState<SourceType>("manuscript");
  const [importMode, setImportMode] =
    useState<ImportMode>("import_and_analyze");

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  function resetForm() {
    setFile(null);
    setTitle("");
    setSourceType("manuscript");
    setImportMode("import_and_analyze");
    setDragging(false);
    setErrorMessage(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function closeModal() {
    if (uploading) {
      return;
    }

    resetForm();
    onClose();
  }

  function selectFile(nextFile: File) {
    try {
      validateSourceFile(nextFile);

      setFile(nextFile);
      setErrorMessage(null);

      if (!title.trim()) {
        setTitle(getFilenameWithoutExtension(nextFile.name));
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "This document could not be selected.";

      setFile(null);
      setErrorMessage(message);
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextFile = event.target.files?.[0];

    if (nextFile) {
      selectFile(nextFile);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!uploading) {
      setDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (uploading) {
      return;
    }

    const nextFile = event.dataTransfer.files?.[0];

    if (nextFile) {
      selectFile(nextFile);
    }
  }

  function removeFile() {
    if (uploading) {
      return;
    }

    setFile(null);
    setErrorMessage(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!file) {
      setErrorMessage("Choose a document before continuing.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Give this document a title.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const document = await uploadSourceDocument({
        worldId,
        file,
        title: title.trim(),
        sourceType,
        importMode,
      });

      toast.success("Document uploaded securely.");
      onUploaded?.(document);
      resetForm();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The document could not be uploaded.";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !uploading) {
        closeModal();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, uploading]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-upload-title"
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="border-b border-border px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Source library
              </p>

              <h2
                id="source-upload-title"
                className="font-serif text-2xl text-foreground sm:text-3xl"
              >
                Add a document
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Upload existing writing without replacing any of
                Lorebound&apos;s manual tools. Nothing extracted from
                this document will become canon without your approval.
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={uploading}
              aria-label="Close upload dialog"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-8 overflow-y-auto px-6 py-6 sm:px-8">
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              Document
            </label>

            {!file ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={[
                  "group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition",
                  dragging
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card/40 hover:border-primary/60 hover:bg-card",
                ].join(" ")}
              >
                <div className="mb-4 rounded-full border border-border bg-background p-3 text-muted-foreground transition group-hover:border-primary/40 group-hover:text-primary">
                  <UploadCloud className="size-6" />
                </div>

                <p className="text-sm font-medium text-foreground">
                  Drop your document here
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse your computer
                </p>

                <p className="mt-4 text-xs text-muted-foreground">
                  DOCX, TXT, or Markdown · Maximum 25 MB
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="rounded-lg border border-primary/20 bg-background p-3 text-primary">
                  <FileText className="size-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Check className="size-4" />
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  disabled={uploading}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                  aria-label="Remove selected document"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept={getAcceptedSourceFileTypes()}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label
              htmlFor="source-document-title"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Document title
            </label>

            <input
              id="source-document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={uploading}
              placeholder="The Isles of Terra — First Draft"
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            />
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-foreground">
              What kind of document is this?
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              {SOURCE_TYPES.map((option) => {
                const selected = sourceType === option.value;
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSourceType(option.value)}
                    disabled={uploading}
                    className={[
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card/40 hover:border-primary/40 hover:bg-card",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mt-0.5 rounded-lg border p-2",
                        selected
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground",
                      ].join(" ")}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {option.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-foreground">
              What should Lorebound do with it?
            </legend>

            <div className="space-y-3">
              {IMPORT_MODES.map((option) => {
                const selected = importMode === option.value;
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setImportMode(option.value)}
                    disabled={uploading}
                    className={[
                      "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card/40 hover:border-primary/40 hover:bg-card",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "rounded-lg border p-2",
                        selected
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground",
                      ].join(" ")}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {option.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>

                    <div
                      className={[
                        "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      ].join(" ")}
                    >
                      {selected && <Check className="size-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

            <div>
              <p className="text-sm font-medium text-foreground">
                Stored privately
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                This file is stored in the private world-sources
                bucket. Other Lorebound users cannot access it.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border bg-card/30 px-6 py-4 sm:px-8">
          <p className="hidden text-xs text-muted-foreground sm:block">
            AI processing is added after upload verification.
          </p>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={uploading}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={uploading || !file}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud className="size-4" />
                  Upload document
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}