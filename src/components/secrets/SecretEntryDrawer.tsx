import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EditorContent,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  FileWarning,
  MapPin,
  Pencil,
  ShieldAlert,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  countSecretKnowledge,
  getKnowledgeStateLabel,
  getSecretCategoryLabel,
  getSecretSeverityLabel,
  getSecretStatusLabel,
  type KnowledgeState,
  type Secret,
} from "@/services/secrets";
import type { Place } from "@/services/places";
import type {
  SecretChapterOption,
  SecretCharacterOption,
  SecretLoreOption,
} from "@/components/secrets/SecretEntryModal";

interface SecretEntryDrawerProps {
  secret: Secret | null;
  characters: SecretCharacterOption[];
  chapters: SecretChapterOption[];
  places: Place[];
  loreEntries: SecretLoreOption[];
  deleting?: boolean;
  onClose: () => void;
  onEdit: (secret: Secret) => void;
  onDelete: (secret: Secret) => void;
}

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function SecretEntryDrawer({
  secret,
  characters,
  chapters,
  places,
  loreEntries,
  deleting = false,
  onClose,
  onEdit,
  onDelete,
}: SecretEntryDrawerProps) {
  const [confirmingDelete, setConfirmingDelete] =
    useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Typography],
    content: EMPTY_DOCUMENT,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(
      secret?.truthJson ?? EMPTY_DOCUMENT,
    );
  }, [editor, secret]);

  useEffect(() => {
    setConfirmingDelete(false);

    if (!secret) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
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
  }, [onClose, secret]);

  const knowledgeGroups = useMemo(() => {
    if (!secret) {
      return {
        knows: [],
        suspects: [],
        unaware: [],
      };
    }

    const groups: Record<
      KnowledgeState,
      Array<{
        character: SecretCharacterOption;
        notes: string;
        chapter:
          | SecretChapterOption
          | null;
      }>
    > = {
      knows: [],
      suspects: [],
      unaware: [],
    };

    for (const record of secret.characterKnowledge) {
      const character = characters.find(
        (candidate) =>
          candidate.id === record.characterId,
      );

      if (!character) {
        continue;
      }

      const chapter =
        chapters.find(
          (candidate) =>
            candidate.id ===
            record.learnedInChapterId,
        ) ?? null;

      groups[record.state].push({
        character,
        notes: record.notes,
        chapter,
      });
    }

    return groups;
  }, [chapters, characters, secret]);

  if (!secret) {
    return null;
  }

  const knowledgeCounts =
    countSecretKnowledge(secret);

  const relatedPlaces = places.filter((place) =>
    secret.placeIds.includes(place.id),
  );

  const relatedLore = loreEntries.filter(
    (entry) =>
      secret.loreEntryIds.includes(entry.id),
  );

  const relatedChapters = chapters.filter(
    (chapter) =>
      secret.chapterIds.includes(chapter.id),
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(122,31,47,0.2),transparent_30%),radial-gradient(circle_at_92%_4%,rgba(77,44,79,0.15),transparent_34%)]" />

        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgba(194,125,105,0.5)_0_1px,transparent_1.4px)] [background-size:193px_167px]" />
      </div>

      <article className="relative mx-auto min-h-screen max-w-[1260px] px-6 pb-24 pt-8 lg:px-12">
        <nav className="mx-auto flex max-w-[1040px] items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-red-300"
          >
            <ArrowLeft className="size-3.5" />
            Return to sealed records
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(secret)}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs text-muted-foreground transition hover:border-red-300/45 hover:text-red-200"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>

            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() =>
                  setConfirmingDelete(true)
                }
                className="p-2 text-muted-foreground transition hover:text-red-300"
                aria-label="Delete secret"
              >
                <Trash2 className="size-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-200">
                  Delete permanently?
                </span>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    onDelete(secret)
                  }
                  className="border border-red-400/40 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deleting
                    ? "Deleting…"
                    : "Delete"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmingDelete(false)
                  }
                  className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </nav>

        <header className="mx-auto mt-16 max-w-[900px] text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-red-300/35 bg-red-400/10 text-red-300">
            <EyeOff className="size-5" />
          </div>

          <p className="mt-6 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-red-300">
            Classified record
          </p>

          <h1 className="mt-5 font-serif text-5xl leading-[1.04] tracking-[-0.035em] text-foreground sm:text-6xl">
            {secret.title}
          </h1>

          <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.65rem] uppercase tracking-[0.16em]">
            <span className="text-red-200">
              {getSecretSeverityLabel(
                secret.severity,
              )}
            </span>

            <span className="text-muted-foreground">
              {getSecretCategoryLabel(
                secret.category,
              )}
            </span>

            <span className="text-muted-foreground">
              {getSecretStatusLabel(
                secret.status,
              )}
            </span>

            {secret.isFeatured && (
              <span className="inline-flex items-center gap-1.5 text-gold">
                <Star className="size-3 fill-gold" />
                Featured
              </span>
            )}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Last revised{" "}
            {formatDate(secret.updatedAt)}
          </p>
        </header>

        <section className="mx-auto mt-14 grid max-w-[1040px] gap-5 sm:grid-cols-3">
          <KnowledgeStat
            label="Know the truth"
            count={knowledgeCounts.knows}
            icon={<Eye className="size-4" />}
            tone="text-red-200"
          />

          <KnowledgeStat
            label="Only suspect"
            count={knowledgeCounts.suspects}
            icon={
              <ShieldAlert className="size-4" />
            }
            tone="text-amber-300"
          />

          <KnowledgeStat
            label="Remain unaware"
            count={knowledgeCounts.unaware}
            icon={
              <EyeOff className="size-4" />
            }
            tone="text-muted-foreground"
          />
        </section>

        <div className="mx-auto mt-16 grid max-w-[1120px] gap-14 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0">
            {secret.publicStory && (
              <section className="border-l-2 border-muted-foreground/30 pl-6">
                <p className="text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  What the world believes
                </p>

                <p className="mt-4 font-serif text-xl italic leading-9 text-muted-foreground">
                  “{secret.publicStory}”
                </p>
              </section>
            )}

            <section className="mt-14">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full border border-red-300/35 bg-red-400/10 text-red-300">
                  <EyeOff className="size-4" />
                </span>

                <div>
                  <p className="text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-red-300">
                    The concealed truth
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    The complete classified account
                  </p>
                </div>
              </div>

              {secret.truthPlainText.trim() ? (
                <div className="mt-8 max-w-[760px] text-[1.02rem] leading-[1.95] text-foreground/90 [&_.ProseMirror>p:first-child]:first-letter:float-left [&_.ProseMirror>p:first-child]:first-letter:mr-3 [&_.ProseMirror>p:first-child]:first-letter:mt-1 [&_.ProseMirror>p:first-child]:first-letter:font-serif [&_.ProseMirror>p:first-child]:first-letter:text-6xl [&_.ProseMirror>p:first-child]:first-letter:leading-[0.82] [&_.ProseMirror>p:first-child]:first-letter:text-red-300 [&_.ProseMirror_h2]:mb-5 [&_.ProseMirror_h2]:mt-14 [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-normal [&_.ProseMirror_h3]:mb-4 [&_.ProseMirror_h3]:mt-10 [&_.ProseMirror_h3]:font-serif [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_p]:my-6 [&_.ProseMirror_blockquote]:my-10 [&_.ProseMirror_blockquote]:border-l [&_.ProseMirror_blockquote]:border-red-300/60 [&_.ProseMirror_blockquote]:pl-7 [&_.ProseMirror_blockquote]:font-serif [&_.ProseMirror_blockquote]:text-lg [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-red-200/80 [&_.ProseMirror_ul]:my-7 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:my-7 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6">
                  <EditorContent editor={editor} />
                </div>
              ) : (
                <div className="mt-8 border border-dashed border-border px-8 py-14 text-center">
                  <EyeOff className="mx-auto size-7 text-red-300/60" />

                  <p className="mt-4 font-serif italic text-muted-foreground">
                    The truth has not yet been written.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      onEdit(secret)
                    }
                    className="mt-5 text-xs uppercase tracking-[0.18em] text-red-300 hover:underline"
                  >
                    Write the truth
                  </button>
                </div>
              )}
            </section>

            {(secret.revealCondition ||
              secret.consequences) && (
              <section className="mt-16 grid gap-6 md:grid-cols-2">
                {secret.revealCondition && (
                  <RecordPanel
                    title="Reveal condition"
                    icon={
                      <Eye className="size-4" />
                    }
                  >
                    {secret.revealCondition}
                  </RecordPanel>
                )}

                {secret.consequences && (
                  <RecordPanel
                    title="Consequences"
                    icon={
                      <ShieldAlert className="size-4" />
                    }
                  >
                    {secret.consequences}
                  </RecordPanel>
                )}
              </section>
            )}

            {secret.evidence && (
              <section className="mt-8">
                <RecordPanel
                  title="Evidence and clues"
                  icon={
                    <FileWarning className="size-4" />
                  }
                >
                  {secret.evidence}
                </RecordPanel>
              </section>
            )}

            <section className="mt-16 border-t border-border pt-10">
              <p className="text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-red-300">
                Knowledge distribution
              </p>

              <h2 className="mt-3 font-serif text-3xl text-foreground">
                Who carries the secret
              </h2>

              <div className="mt-8 space-y-10">
                <KnowledgeGroup
                  title="Know the truth"
                  state="knows"
                  records={knowledgeGroups.knows}
                />

                <KnowledgeGroup
                  title="Suspect something"
                  state="suspects"
                  records={
                    knowledgeGroups.suspects
                  }
                />

                <KnowledgeGroup
                  title="Remain unaware"
                  state="unaware"
                  records={
                    knowledgeGroups.unaware
                  }
                />
              </div>
            </section>
          </main>

          <aside className="space-y-8">
            <AsideSection title="Classification">
              <dl className="space-y-3 text-xs">
                <DetailRow
                  label="Category"
                  value={getSecretCategoryLabel(
                    secret.category,
                  )}
                />

                <DetailRow
                  label="Severity"
                  value={getSecretSeverityLabel(
                    secret.severity,
                  )}
                />

                <DetailRow
                  label="Status"
                  value={getSecretStatusLabel(
                    secret.status,
                  )}
                />

                <DetailRow
                  label="Created"
                  value={formatDate(
                    secret.createdAt,
                  )}
                />
              </dl>
            </AsideSection>

            {relatedPlaces.length > 0 && (
              <AsideSection title="Connected places">
                <div className="space-y-4">
                  {relatedPlaces.map((place) => (
                    <Connection
                      key={place.id}
                      icon={
                        <MapPin className="size-3.5" />
                      }
                      title={place.name}
                      detail={humanize(
                        place.placeType,
                      )}
                    />
                  ))}
                </div>
              </AsideSection>
            )}

            {relatedLore.length > 0 && (
              <AsideSection title="Connected lore">
                <div className="space-y-4">
                  {relatedLore.map((entry) => (
                    <Connection
                      key={entry.id}
                      icon={
                        <BookOpen className="size-3.5" />
                      }
                      title={entry.title}
                      detail={
                        entry.category
                          ? humanize(
                              entry.category,
                            )
                          : "Lore record"
                      }
                    />
                  ))}
                </div>
              </AsideSection>
            )}

            {relatedChapters.length > 0 && (
              <AsideSection title="Connected chapters">
                <div className="space-y-4">
                  {relatedChapters.map(
                    (chapter) => (
                      <Connection
                        key={chapter.id}
                        icon={
                          <FileWarning className="size-3.5" />
                        }
                        title={chapter.title}
                        detail={
                          chapter.position !==
                          undefined
                            ? `Chapter ${chapter.position}`
                            : "Manuscript chapter"
                        }
                      />
                    ),
                  )}
                </div>
              </AsideSection>
            )}
          </aside>
        </div>

        <footer className="mx-auto mt-20 max-w-[1120px] border-t border-red-300/30 pt-6">
          <p className="font-serif text-sm italic text-muted-foreground">
            End of sealed record —{" "}
            {secret.title}.
          </p>
        </footer>
      </article>
    </div>
  );
}

function KnowledgeStat({
  label,
  count,
  icon,
  tone,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="border border-border bg-card/25 px-5 py-5">
      <div
        className={`flex items-center gap-2 ${tone}`}
      >
        {icon}

        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>

      <p className="mt-3 font-serif text-3xl text-foreground">
        {count}
      </p>
    </div>
  );
}

function KnowledgeGroup({
  title,
  state,
  records,
}: {
  title: string;
  state: KnowledgeState;
  records: Array<{
    character: SecretCharacterOption;
    notes: string;
    chapter: SecretChapterOption | null;
  }>;
}) {
  if (records.length === 0) {
    return null;
  }

  const tone =
    state === "knows"
      ? "text-red-200"
      : state === "suspects"
        ? "text-amber-300"
        : "text-muted-foreground";

  return (
    <section>
      <div className="flex items-center gap-3">
        <h3
          className={`text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${tone}`}
        >
          {title}
        </h3>

        <span className="text-xs text-muted-foreground">
          {records.length}
        </span>
      </div>

      <div className="mt-4 divide-y divide-border border-y border-border">
        {records.map(
          ({
            character,
            notes,
            chapter,
          }) => (
            <div
              key={character.id}
              className="grid gap-2 py-4 sm:grid-cols-[190px_minmax(0,1fr)]"
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

              <div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {notes ||
                    getKnowledgeStateLabel(
                      state,
                    )}
                </p>

                {chapter && (
                  <p className="mt-2 text-[0.68rem] text-red-300/75">
                    Learned in{" "}
                    {chapter.position !==
                    undefined
                      ? `Chapter ${chapter.position}: `
                      : ""}
                    {chapter.title}
                  </p>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function RecordPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: string;
}) {
  return (
    <div className="h-full border border-border bg-card/20 p-6">
      <p className="flex items-center gap-2 text-[0.63rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <span className="text-red-300">
          {icon}
        </span>

        {title}
      </p>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/85">
        {children}
      </p>
    </div>
  );
}

function AsideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-5">
      <h2 className="mb-5 text-[0.62rem] font-semibold uppercase tracking-[0.23em] text-muted-foreground">
        {title}
      </h2>

      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">
        {label}
      </dt>

      <dd className="text-right text-foreground">
        {value}
      </dd>
    </div>
  );
}

function Connection({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-red-300">
        {icon}
      </span>

      <div>
        <p className="font-serif text-sm text-foreground">
          {title}
        </p>

        <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
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