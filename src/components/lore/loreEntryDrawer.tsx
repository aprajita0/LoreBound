import {
  useEffect,
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
  ChevronRight,
  Ellipsis,
  MapPin,
  Pencil,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  getLoreCategoryLabel,
  getLoreStatusLabel,
  type LoreEntry,
} from "@/services/lore";
import type { Place } from "@/services/places";

interface CharacterOption {
  id: string;
  name: string;
  role?: string;
}

interface LoreEntryDrawerProps {
  entry: LoreEntry | null;
  entries: LoreEntry[];
  characters: CharacterOption[];
  places: Place[];
  deleting?: boolean;
  onClose: () => void;
  onEdit: (entry: LoreEntry) => void;
  onDelete: (entry: LoreEntry) => void;
  onSelectEntry: (entry: LoreEntry) => void;
}

const EMPTY_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function LoreEntryDrawer({
  entry,
  entries,
  characters,
  places,
  deleting = false,
  onClose,
  onEdit,
  onDelete,
  onSelectEntry,
}: LoreEntryDrawerProps) {
  const [menuOpen, setMenuOpen] = useState(false);

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
      entry?.contentJson ?? EMPTY_DOCUMENT,
    );
  }, [editor, entry]);

  useEffect(() => {
    if (!entry) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [entry, onClose]);

  useEffect(() => {
    setMenuOpen(false);
  }, [entry]);

  if (!entry) {
    return null;
  }

  const parentEntry =
    entries.find(
      (candidate) =>
        candidate.id === entry.parentEntryId,
    ) ?? null;

  const childEntries = entries.filter(
    (candidate) =>
      candidate.parentEntryId === entry.id,
  );

  const relatedCharacters = characters.filter(
    (character) =>
      entry.characterIds.includes(character.id),
  );

  const relatedPlaces = places.filter((place) =>
    entry.placeIds.includes(place.id),
  );

  const relatedEntries = entries.filter(
    (candidate) =>
      entry.relatedEntryIds.includes(candidate.id),
  );

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_5%,rgba(17,91,91,0.11),transparent_29%),radial-gradient(circle_at_86%_2%,rgba(77,55,111,0.13),transparent_34%)]" />

        <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(202,166,91,0.45)_0_1px,transparent_1.3px)] [background-size:191px_157px]" />
      </div>

      <article className="relative mx-auto min-h-screen max-w-[1260px] px-6 pb-24 pt-8 lg:px-12">
        <nav className="mx-auto flex max-w-[860px] items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-gold"
          >
            <ArrowLeft className="size-3.5" />
            Back to archive
          </button>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs text-muted-foreground transition hover:border-gold/45 hover:text-gold"
            >
              <Pencil className="size-3.5" />
              Edit
            </button>

            <button
              type="button"
              aria-label="More record actions"
              aria-expanded={menuOpen}
              onClick={() =>
                setMenuOpen((current) => !current)
              }
              className="border border-transparent p-2 text-muted-foreground transition hover:text-foreground"
            >
              <Ellipsis className="size-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-20 w-44 border border-border bg-card p-1.5 shadow-2xl">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => onDelete(entry)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />

                  {deleting
                    ? "Deleting…"
                    : "Delete record"}
                </button>
              </div>
            )}
          </div>
        </nav>

        <header className="mx-auto mt-14 max-w-[860px]">
          <p className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">
            <BookOpen className="size-3.5" />

            {getLoreCategoryLabel(entry.category)}

            <span className="h-3 w-px bg-gold/45" />

            {getLoreStatusLabel(entry.status)}

            {entry.isFeatured && (
              <Star className="ml-1 size-3.5 fill-gold" />
            )}
          </p>

          <h1 className="mt-5 font-serif text-5xl leading-[1.03] tracking-[-0.035em] text-foreground sm:text-6xl">
            {entry.title}
          </h1>

          {entry.summary && (
            <p className="mt-5 max-w-3xl font-serif text-lg italic leading-8 text-gold/72">
              {entry.summary}
            </p>
          )}

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[0.68rem] text-muted-foreground">
            <span>
              Revised {formatDate(entry.updatedAt)}
            </span>

            <span>·</span>

            <span>
              {readingTime(entry.plainText)} minute read
            </span>
          </div>
        </header>

        <figure className="mx-auto mt-12 max-w-[1120px] border border-border bg-card/30">
          {entry.imagePath ? (
            <img
              src={entry.imagePath}
              alt={entry.title}
              className="max-h-[620px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(201,164,92,0.19),transparent_25%),radial-gradient(circle_at_75%_65%,rgba(35,96,110,0.23),transparent_38%),linear-gradient(145deg,#121c2b,#070b13)]">
              <BookOpen className="size-20 text-gold/30" />
            </div>
          )}

          <figcaption className="border-t border-border px-1.5 py-1 font-serif text-[0.65rem] italic text-muted-foreground/55">
            From the illuminated plates of the
            Lorebound archive.
          </figcaption>
        </figure>

        <div className="mx-auto mt-14 grid max-w-[1120px] gap-14 lg:grid-cols-[minmax(0,1fr)_280px]">
          <main>
            {entry.plainText.trim() ? (
              <div className="lore-article-prose max-w-[760px] text-[1.02rem] leading-[1.95] text-foreground/88 [&_.ProseMirror>p:first-child]:first-letter:float-left [&_.ProseMirror>p:first-child]:first-letter:mr-3 [&_.ProseMirror>p:first-child]:first-letter:mt-1 [&_.ProseMirror>p:first-child]:first-letter:font-serif [&_.ProseMirror>p:first-child]:first-letter:text-6xl [&_.ProseMirror>p:first-child]:first-letter:leading-[0.82] [&_.ProseMirror>p:first-child]:first-letter:text-gold [&_.ProseMirror_h2]:mb-5 [&_.ProseMirror_h2]:mt-14 [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-normal [&_.ProseMirror_h2]:text-foreground [&_.ProseMirror_h3]:mb-4 [&_.ProseMirror_h3]:mt-10 [&_.ProseMirror_h3]:font-serif [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_p]:my-6 [&_.ProseMirror_blockquote]:my-10 [&_.ProseMirror_blockquote]:border-l [&_.ProseMirror_blockquote]:border-gold/60 [&_.ProseMirror_blockquote]:pl-7 [&_.ProseMirror_blockquote]:font-serif [&_.ProseMirror_blockquote]:text-lg [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-gold/75 [&_.ProseMirror_ul]:my-7 [&_.ProseMirror_ul]:space-y-3 [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:marker:text-gold [&_.ProseMirror_ol]:my-7 [&_.ProseMirror_ol]:space-y-3 [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:marker:text-gold">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div className="border border-dashed border-border px-8 py-16 text-center">
                <BookOpen className="mx-auto size-7 text-gold/55" />

                <p className="mt-4 font-serif italic text-muted-foreground">
                  This record has a title, but no
                  account yet.
                </p>

                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="mt-5 text-xs uppercase tracking-[0.18em] text-gold hover:underline"
                >
                  Begin the article
                </button>
              </div>
            )}

            <footer className="mt-16 border-t border-gold/35 pt-6">
              <p className="font-serif text-sm italic text-muted-foreground">
                End of record — {entry.title}.
              </p>
            </footer>
          </main>

          <aside className="space-y-8 lg:pt-1">
            {entry.tags.length > 0 && (
              <AsideSection title="Tags">
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </AsideSection>
            )}

            <AsideSection title="Record dates">
              <dl className="space-y-3 text-xs">
                <DateRow
                  label="Created"
                  value={formatDate(entry.createdAt)}
                />

                <DateRow
                  label="Last revised"
                  value={formatDate(entry.updatedAt)}
                />
              </dl>
            </AsideSection>

            {parentEntry && (
              <AsideSection title="Parent record">
                <RecordLink
                  entry={parentEntry}
                  onClick={() =>
                    onSelectEntry(parentEntry)
                  }
                />
              </AsideSection>
            )}

            {childEntries.length > 0 && (
              <AsideSection title="Contained records">
                <div className="space-y-1">
                  {childEntries.map((child) => (
                    <RecordLink
                      key={child.id}
                      entry={child}
                      onClick={() =>
                        onSelectEntry(child)
                      }
                    />
                  ))}
                </div>
              </AsideSection>
            )}

            {relatedCharacters.length > 0 && (
              <AsideSection title="Connected characters">
                <div className="space-y-4">
                  {relatedCharacters.map(
                    (character) => (
                      <Connection
                        key={character.id}
                        icon={
                          <UserRound className="size-3.5" />
                        }
                        title={character.name}
                        detail={
                          character.role ||
                          "Character record"
                        }
                      />
                    ),
                  )}
                </div>
              </AsideSection>
            )}

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

            {relatedEntries.length > 0 && (
              <AsideSection title="Connected lore">
                <div className="space-y-1">
                  {relatedEntries.map((related) => (
                    <RecordLink
                      key={related.id}
                      entry={related}
                      onClick={() =>
                        onSelectEntry(related)
                      }
                    />
                  ))}
                </div>
              </AsideSection>
            )}
          </aside>
        </div>
      </article>
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
      <h2 className="mb-5 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </h2>

      {children}
    </section>
  );
}

function DateRow({
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
      <span className="mt-0.5 text-gold">
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

function RecordLink({
  entry,
  onClick,
}: {
  entry: LoreEntry;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between border-b border-border/70 py-2.5 text-left"
    >
      <span>
        <span className="block font-serif text-sm text-foreground transition group-hover:text-gold">
          {entry.title}
        </span>

        <span className="mt-0.5 block text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
          {getLoreCategoryLabel(entry.category)}
        </span>
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-gold" />
    </button>
  );
}

function readingTime(text: string) {
  const count = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  return Math.max(1, Math.ceil(count / 220));
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