import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ImageIcon, Loader2, MapPin, X } from "lucide-react";
import {
  createPlace,
  getPlaceStatusLabel,
  getPlaceTypeLabel,
  updatePlace,
  type Place,
  type PlaceStatus,
  type PlaceType,
  type SavePlaceInput,
} from "@/services/places";

interface PlaceModalProps {
  open: boolean;
  worldId: string;
  places: Place[];
  place?: Place | null;
  onClose: () => void;
  onSaved: (place: Place) => void;
}

const PLACE_TYPES: PlaceType[] = [
  "world",
  "continent",
  "kingdom",
  "region",
  "city",
  "village",
  "building",
  "landmark",
  "wilderness",
  "other",
];

const PLACE_STATUSES: PlaceStatus[] = [
  "active",
  "hidden",
  "abandoned",
  "destroyed",
  "unknown",
];

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-gold/70 focus:ring-2 focus:ring-gold/10";

export function PlaceModal({
  open,
  worldId,
  places,
  place,
  onClose,
  onSaved,
}: PlaceModalProps) {
  const [name, setName] = useState("");
  const [placeType, setPlaceType] = useState<PlaceType>("city");
  const [status, setStatus] = useState<PlaceStatus>("active");
  const [parentPlaceId, setParentPlaceId] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [aliases, setAliases] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [mapX, setMapX] = useState("");
  const [mapY, setMapY] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(place);

  useEffect(() => {
    if (!open) return;

    setName(place?.name ?? "");
    setPlaceType(place?.placeType ?? "city");
    setStatus(place?.status ?? "active");
    setParentPlaceId(place?.parentPlaceId ?? "");
    setSummary(place?.summary ?? "");
    setDescription(place?.description ?? "");
    setAliases(place?.aliases.join(", ") ?? "");
    setImagePath(place?.imagePath ?? "");
    setMapX(place?.mapX?.toString() ?? "");
    setMapY(place?.mapY?.toString() ?? "");
    setError("");
  }, [open, place]);

  const parentOptions = useMemo(
    () => places.filter((candidate) => candidate.id !== place?.id),
    [places, place?.id],
  );

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Give this place a name.");
      return;
    }

    setSaving(true);
    setError("");

    const input: SavePlaceInput = {
      worldId,
      name,
      placeType,
      status,
      parentPlaceId: parentPlaceId || null,
      summary,
      description,
      aliases: aliases
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean),
      imagePath: imagePath.trim() || null,
      mapX: mapX.trim() ? Number(mapX) : null,
      mapY: mapY.trim() ? Number(mapY) : null,
    };

    try {
      const savedPlace = place
        ? await updatePlace(place.id, input)
        : await createPlace(input);

      onSaved(savedPlace);
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The place could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close place editor"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-background/95 px-7 py-6 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">
              Atlas entry
            </p>

            <h2 className="mt-2 font-serif text-3xl text-foreground">
              {isEditing ? "Edit this place" : "Add a new place"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Record the locations that shape your world.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-7 p-7">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Place name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="The Low Lantern"
                className={inputClassName}
                autoFocus
              />
            </Field>

            <Field label="Parent location">
              <select
                value={parentPlaceId}
                onChange={(event) =>
                  setParentPlaceId(event.target.value)
                }
                className={inputClassName}
              >
                <option value="">No parent location</option>

                {parentOptions.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Place type">
              <select
                value={placeType}
                onChange={(event) =>
                  setPlaceType(event.target.value as PlaceType)
                }
                className={inputClassName}
              >
                {PLACE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getPlaceTypeLabel(type)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Current status">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PlaceStatus)
                }
                className={inputClassName}
              >
                {PLACE_STATUSES.map((placeStatus) => (
                  <option key={placeStatus} value={placeStatus}>
                    {getPlaceStatusLabel(placeStatus)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Short summary">
            <input
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="A candlelit tavern where secrets travel faster than ale."
              className={inputClassName}
              maxLength={220}
            />

            <p className="mt-1 text-right text-xs text-muted-foreground">
              {summary.length}/220
            </p>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe its atmosphere, history, people, dangers, and importance..."
              className={`${inputClassName} min-h-36 resize-y`}
            />
          </Field>

          <Field label="Aliases">
            <input
              value={aliases}
              onChange={(event) => setAliases(event.target.value)}
              placeholder="Old Quarter, Lantern District"
              className={inputClassName}
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Separate multiple aliases with commas.
            </p>
          </Field>

          <Field label="Image URL">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  value={imagePath}
                  onChange={(event) =>
                    setImagePath(event.target.value)
                  }
                  placeholder="https://..."
                  className={`${inputClassName} pl-10`}
                />
              </div>

              {imagePath && (
                <img
                  key={imagePath}
                  src={imagePath}
                  alt="Place preview"
                  className="size-11 rounded-lg border border-border object-cover"
                />
              )}
            </div>
          </Field>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-4 text-gold" />

              <p className="text-sm font-medium text-foreground">
                Map coordinates
              </p>

              <span className="text-xs text-muted-foreground">
                Optional
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Horizontal position">
                <input
                  type="number"
                  value={mapX}
                  onChange={(event) => setMapX(event.target.value)}
                  placeholder="X coordinate"
                  className={inputClassName}
                />
              </Field>

              <Field label="Vertical position">
                <input
                  type="number"
                  value={mapY}
                  onChange={(event) => setMapY(event.target.value)}
                  placeholder="Y coordinate"
                  className={inputClassName}
                />
              </Field>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}

              {saving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Add place"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </span>

      {children}
    </label>
  );
}