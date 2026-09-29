import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  Check,
  Loader2,
  UserRound,
  X,
} from "lucide-react";
import {
  KIND_META,
  KIND_ORDER,
  type Character,
  type Relationship,
  type RelationshipKind,
  type UiRelationshipStatus,
} from "@/lib/lore-data";
import { cn } from "@/lib/utils";

interface RelationshipModalProps {
  open: boolean;
  editing: Relationship | null;
  characters: Character[];
  saving?: boolean;
  onClose: () => void;
  onSave: (relationships: Relationship[]) => void;
}

const STATUSES: UiRelationshipStatus[] = [
  "Established",
  "Strained",
  "Hidden",
  "Evolving",
];

const fieldClass =
  "mt-2 w-full rounded-md border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold/60 focus:ring-2 focus:ring-gold/15";

export function RelationshipModal({
  open,
  editing,
  characters,
  saving = false,
  onClose,
  onSave,
}: RelationshipModalProps) {
  const [source, setSource] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [kind, setKind] =
    useState<RelationshipKind>("friendship");
  const [label, setLabel] = useState("");
  const [status, setStatus] =
    useState<UiRelationshipStatus>("Established");
  const [since, setSince] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    if (!open) return;

    const firstCharacterId = characters[0]?.id ?? "";

    setSource(editing?.source ?? firstCharacterId);
    setTargets(editing ? [editing.target] : []);
    setKind(editing?.kind ?? "friendship");
    setLabel(editing?.label ?? "");
    setStatus(editing?.status ?? "Established");
    setSince(
      editing?.since === "Unrecorded"
        ? ""
        : editing?.since ?? "",
    );
    setSummary(editing?.summary ?? "");
  }, [open, editing, characters]);

  if (!open) return null;

  const availableCharacters = characters.filter(
    (character) => character.id !== source,
  );

  const validTargets = targets.filter(
    (targetId) => targetId !== source,
  );

  function changeSource(nextSource: string) {
    setSource(nextSource);

    setTargets((current) =>
      current.filter(
        (targetId) => targetId !== nextSource,
      ),
    );
  }

  function toggleTarget(characterId: string) {
    if (editing) {
      setTargets([characterId]);
      return;
    }

    setTargets((current) =>
      current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId],
    );
  }

  function selectAll() {
    if (editing) return;

    setTargets(
      availableCharacters.map(
        (character) => character.id,
      ),
    );
  }

  function clearTargets() {
    if (editing) return;
    setTargets([]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !source ||
      validTargets.length === 0 ||
      saving
    ) {
      return;
    }

    const relationships: Relationship[] =
      validTargets.map((targetId) => ({
        id:
          editing && targetId === editing.target
            ? editing.id
            : crypto.randomUUID(),
        source,
        target: targetId,
        kind,
        label:
          label.trim() || KIND_META[kind].label,
        status,
        since: since.trim() || "Unrecorded",
        summary: summary.trim(),
        beats: editing?.beats ?? [],
      }));

    onSave(relationships);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button
        type="button"
        className="absolute inset-0 size-full cursor-default bg-background/75 backdrop-blur-sm"
        onClick={() => {
          if (!saving) onClose();
        }}
        aria-label="Close relationship editor"
      />

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface-raised shadow-[var(--shadow-archive)]"
      >
        <header className="flex items-start justify-between border-b border-border/70 px-6 py-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
              {editing ? "Revise" : "New bond"}
            </p>

            <h2 className="mt-1.5 font-display text-3xl text-foreground">
              {editing
                ? "Edit relationship"
                : "Add relationships"}
            </h2>

            {!editing ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Connect one character to several people
                at once.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr]">
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              First character

              <select
                value={source}
                onChange={(event) =>
                  changeSource(event.target.value)
                }
                className={fieldClass}
                required
              >
                {characters.map((character) => (
                  <option
                    key={character.id}
                    value={character.id}
                  >
                    {character.name}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Connect to
                </p>

                {!editing ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[0.68rem] text-muted-foreground">
                      {validTargets.length} selected
                    </span>

                    <button
                      type="button"
                      onClick={
                        validTargets.length ===
                        availableCharacters.length
                          ? clearTargets
                          : selectAll
                      }
                      className="text-[0.68rem] text-gold hover:underline"
                    >
                      {validTargets.length ===
                      availableCharacters.length
                        ? "Clear all"
                        : "Select all"}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-lg border border-input bg-background/40 p-2">
                {availableCharacters.map(
                  (character) => {
                    const checked =
                      targets.includes(character.id);

                    return (
                      <label
                        key={character.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                          checked
                            ? "border-gold/50 bg-gold/10"
                            : "border-transparent hover:bg-accent/50",
                        )}
                      >
                        <input
                          type={
                            editing
                              ? "radio"
                              : "checkbox"
                          }
                          name={
                            editing
                              ? "relationship-target"
                              : undefined
                          }
                          checked={checked}
                          onChange={() =>
                            toggleTarget(
                              character.id,
                            )
                          }
                          className="size-4 shrink-0 accent-[var(--color-gold)]"
                        />

                        <CharacterPortrait
                          character={character}
                        />

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

                {availableCharacters.length === 0 ? (
                  <p className="px-3 py-5 text-center text-xs leading-5 text-muted-foreground">
                    Add another character before
                    creating a relationship.
                  </p>
                ) : null}
              </div>

              <p className="mt-2 text-[0.68rem] leading-5 text-muted-foreground">
                {editing
                  ? "Choose one character while editing this relationship."
                  : "Every selected character will receive a separate relationship record."}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Category
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {KIND_ORDER.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    kind === value
                      ? "text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                  style={
                    kind === value
                      ? {
                          borderColor:
                            KIND_META[value].color,
                          backgroundColor: `color-mix(in oklab, ${KIND_META[value].color} 14%, transparent)`,
                        }
                      : undefined
                  }
                >
                  {KIND_META[value].label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Relationship label

            <input
              value={label}
              onChange={(event) =>
                setLabel(event.target.value)
              }
              placeholder="Soulbonded, sworn rivals, adopted siblings…"
              className={fieldClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Status

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as UiRelationshipStatus,
                  )
                }
                className={fieldClass}
              >
                {STATUSES.map((value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Since

              <input
                value={since}
                onChange={(event) =>
                  setSince(event.target.value)
                }
                placeholder="Year One, Frostwake…"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Notes

            <textarea
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              rows={5}
              placeholder="What binds them, and what threatens to break it?"
              className={cn(
                fieldClass,
                "resize-y normal-case leading-6 tracking-normal",
              )}
            />
          </label>

          {!editing && validTargets.length > 1 ? (
            <div className="rounded-lg border border-gold/25 bg-gold/5 px-4 py-3">
              <p className="text-xs leading-5 text-muted-foreground">
                This will create{" "}
                <strong className="font-medium text-foreground">
                  {validTargets.length} separate
                  relationships
                </strong>{" "}
                using the same category, label, status,
                and notes.
              </p>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-border/70 px-6 py-4">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {validTargets.length === 0
              ? "Choose at least one character."
              : editing
                ? "One relationship will be updated."
                : `${validTargets.length} relationship${
                    validTargets.length === 1
                      ? ""
                      : "s"
                  } will be created.`}
          </p>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !source ||
                validTargets.length === 0
              }
              className="flex items-center gap-2 rounded-md border border-gold/50 bg-gold/15 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
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
                  : validTargets.length > 1
                    ? `Add ${validTargets.length} relationships`
                    : "Add relationship"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function CharacterPortrait({
  character,
}: {
  character: Character;
}) {
  if (character.portrait) {
    return (
      <img
        src={character.portrait}
        alt=""
        className="size-9 shrink-0 rounded-full border border-border object-cover object-top"
      />
    );
  }

  const initials = character.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface-raised font-display text-sm text-gold">
      {initials || (
        <UserRound
          className="size-4"
          aria-hidden
        />
      )}
    </span>
  );
}