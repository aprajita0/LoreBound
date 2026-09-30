import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Check,
  Loader2,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Character } from "@/services/characters";
import type { Place } from "@/services/places";
import {
  getTimelineEventTypeLabel,
  getTimelineStatusLabel,
  type SaveTimelineEventInput,
  type TimelineEvent,
  type TimelineEventStatus,
  type TimelineEventType,
} from "@/services/timeline";

export interface TimelineChapterOption {
  id: string;
  title: string;
  position: number;
}

interface TimelineEventModalProps {
  open: boolean;
  worldId: string;
  editing: TimelineEvent | null;
  characters: Character[];
  places: Place[];
  chapters: TimelineChapterOption[];
  nextSortOrder: number;
  saving?: boolean;
  onClose: () => void;
  onSave: (
    input: SaveTimelineEventInput,
  ) => void;
}

const EVENT_TYPES: TimelineEventType[] = [
  "personal",
  "relationship",
  "journey",
  "discovery",
  "political",
  "battle",
  "birth",
  "death",
  "prophecy",
  "historical",
  "other",
];

const STATUSES: TimelineEventStatus[] = [
  "canonical",
  "draft",
  "secret",
  "disputed",
];

const fieldClass =
  "mt-2 w-full rounded-md border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold/60 focus:ring-2 focus:ring-gold/15";

export function TimelineEventModal({
  open,
  worldId,
  editing,
  characters,
  places,
  chapters,
  nextSortOrder,
  saving = false,
  onClose,
  onSave,
}: TimelineEventModalProps) {
  const [title, setTitle] = useState("");
  const [fictionalDate, setFictionalDate] =
    useState("");
  const [era, setEra] = useState("");
  const [eventType, setEventType] =
    useState<TimelineEventType>("personal");
  const [status, setStatus] =
    useState<TimelineEventStatus>("canonical");
  const [summary, setSummary] = useState("");
  const [description, setDescription] =
    useState("");
  const [importance, setImportance] =
    useState(3);
  const [sortOrder, setSortOrder] =
    useState(nextSortOrder);
  const [placeId, setPlaceId] = useState("");
  const [chapterId, setChapterId] =
    useState("");
  const [characterIds, setCharacterIds] =
    useState<string[]>([]);
  const [characterSearch, setCharacterSearch] =
    useState("");

  useEffect(() => {
    if (!open) return;

    setTitle(editing?.title ?? "");
    setFictionalDate(
      editing?.fictionalDate ?? "",
    );
    setEra(editing?.era ?? "");
    setEventType(
      editing?.eventType ?? "personal",
    );
    setStatus(
      editing?.status ?? "canonical",
    );
    setSummary(editing?.summary ?? "");
    setDescription(
      editing?.description ?? "",
    );
    setImportance(editing?.importance ?? 3);
    setSortOrder(
      editing?.sortOrder ?? nextSortOrder,
    );
    setPlaceId(editing?.placeId ?? "");
    setChapterId(editing?.chapterId ?? "");
    setCharacterIds(
      editing?.characters.map(
        (character) => character.characterId,
      ) ?? [],
    );
    setCharacterSearch("");
  }, [open, editing, nextSortOrder]);

  const filteredCharacters = useMemo(() => {
    const query = characterSearch
      .trim()
      .toLowerCase();

    if (!query) return characters;

    return characters.filter((character) =>
      [
        character.name,
        character.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [characterSearch, characters]);

  if (!open) return null;

  function toggleCharacter(characterId: string) {
    setCharacterIds((current) =>
      current.includes(characterId)
        ? current.filter(
            (id) => id !== characterId,
          )
        : [...current, characterId],
    );
  }

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim() || saving) return;

    onSave({
      worldId,

      title: title.trim(),
      fictionalDate: fictionalDate.trim(),
      era: era.trim(),

      eventType,
      status,

      summary: summary.trim(),
      description: description.trim(),

      importance,
      sortOrder,

      placeId: placeId || null,
      chapterId: chapterId || null,

      characters: characterIds.map(
        (characterId) => ({
          characterId,
          roleInEvent: "",
        }),
      ),
    });
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 size-full cursor-default bg-background/75 backdrop-blur-sm"
        onClick={() => {
          if (!saving) onClose();
        }}
        aria-label="Close timeline event editor"
      />

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface-raised shadow-[var(--shadow-archive)]"
      >
        <header className="flex items-start justify-between border-b border-border/70 px-6 py-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
              {editing
                ? "Revise history"
                : "New moment"}
            </p>

            <h2 className="mt-1.5 font-display text-3xl text-foreground">
              {editing
                ? "Edit timeline event"
                : "Add timeline event"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-5">
          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Event title

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="The Fall of the Northern Gate"
              className={fieldClass}
              autoFocus
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Fictional date

              <input
                value={fictionalDate}
                onChange={(event) =>
                  setFictionalDate(
                    event.target.value,
                  )
                }
                placeholder="18 Frostwake, Year 412"
                className={fieldClass}
              />
            </label>

            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Era

              <input
                value={era}
                onChange={(event) =>
                  setEra(event.target.value)
                }
                placeholder="Age of Ash"
                className={fieldClass}
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Event type
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setEventType(type)
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    eventType === type
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {getTimelineEventTypeLabel(
                    type,
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Status

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as TimelineEventStatus,
                  )
                }
                className={fieldClass}
              >
                {STATUSES.map((value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {getTimelineStatusLabel(
                      value,
                    )}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Chronological position

              <input
                type="number"
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    Number(event.target.value),
                  )
                }
                className={fieldClass}
              />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Importance
              </p>

              <span className="text-xs text-gold">
                {importance}/5
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={importance}
              onChange={(event) =>
                setImportance(
                  Number(event.target.value),
                )
              }
              className="mt-3 w-full accent-[var(--color-gold)]"
            />

            <div className="mt-1 flex justify-between text-[0.65rem] text-muted-foreground">
              <span>Small moment</span>
              <span>World changing</span>
            </div>
          </div>

          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Short summary

            <input
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder="A brief description shown on the timeline."
              className={fieldClass}
            />
          </label>

          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Full description

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={5}
              placeholder="What happened, why it mattered, and what changed afterward?"
              className={cn(
                fieldClass,
                "resize-y normal-case leading-6 tracking-normal",
              )}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Place

              <select
                value={placeId}
                onChange={(event) =>
                  setPlaceId(event.target.value)
                }
                className={fieldClass}
              >
                <option value="">
                  No linked place
                </option>

                {places.map((place) => (
                  <option
                    key={place.id}
                    value={place.id}
                  >
                    {place.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Manuscript chapter

              <select
                value={chapterId}
                onChange={(event) =>
                  setChapterId(
                    event.target.value,
                  )
                }
                className={fieldClass}
              >
                <option value="">
                  No linked chapter
                </option>

                {chapters.map((chapter) => (
                  <option
                    key={chapter.id}
                    value={chapter.id}
                  >
                    Chapter {chapter.position}:{" "}
                    {chapter.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Characters involved
              </p>

              <span className="text-[0.68rem] text-muted-foreground">
                {characterIds.length} selected
              </span>
            </div>

            <label className="relative mt-2 block">
              <span className="sr-only">
                Search characters
              </span>

              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={characterSearch}
                onChange={(event) =>
                  setCharacterSearch(
                    event.target.value,
                  )
                }
                placeholder="Search characters..."
                className="h-10 w-full rounded-md border border-input bg-background/60 pl-9 pr-3 text-sm outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
              />
            </label>

            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-input bg-background/40 p-2">
              {filteredCharacters.map(
                (character) => {
                  const selected =
                    characterIds.includes(
                      character.id,
                    );

                  return (
                    <label
                      key={character.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                        selected
                          ? "border-gold/50 bg-gold/10"
                          : "border-transparent hover:bg-accent/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleCharacter(
                            character.id,
                          )
                        }
                        className="size-4 accent-[var(--color-gold)]"
                      />

                      {character.portraitUrl ? (
                        <img
                          src={
                            character.portraitUrl
                          }
                          alt=""
                          className="size-9 rounded-full border border-border object-cover object-top"
                        />
                      ) : (
                        <span className="grid size-9 place-items-center rounded-full border border-border bg-surface-raised text-muted-foreground">
                          <UserRound className="size-4" />
                        </span>
                      )}

                      <span className="min-w-0">
                        <span className="block truncate text-sm text-foreground">
                          {character.name}
                        </span>

                        <span className="block truncate text-[0.68rem] text-muted-foreground">
                          {character.role ||
                            "Role not set"}
                        </span>
                      </span>
                    </label>
                  );
                },
              )}

              {filteredCharacters.length ===
              0 ? (
                <p className="px-3 py-5 text-center text-xs text-muted-foreground">
                  No characters match your
                  search.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border/70 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving || !title.trim()
            }
            className="flex items-center gap-2 rounded-md border border-gold/50 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}

            {saving
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Add event"}
          </button>
        </footer>
      </form>
    </div>
  );
}