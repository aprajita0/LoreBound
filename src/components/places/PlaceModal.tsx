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
  ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  createPlace,
  getPlaceStatusLabel,
  getPlaceTypeLabel,
  updatePlace,
  uploadPlaceImage,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [placeType, setPlaceType] =
    useState<PlaceType>("city");
  const [status, setStatus] =
    useState<PlaceStatus>("active");
  const [parentPlaceId, setParentPlaceId] =
    useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] =
    useState("");
  const [aliases, setAliases] = useState("");

  const [imageFile, setImageFile] =
    useState<File | null>(null);
  const [imagePreview, setImagePreview] =
    useState("");
  const [removeExistingImage, setRemoveExistingImage] =
    useState(false);
  const [dragging, setDragging] = useState(false);

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

    setImageFile(null);
    setImagePreview(place?.imagePath ?? "");
    setRemoveExistingImage(false);
    setDragging(false);
    setError("");
  }, [open, place]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const parentOptions = useMemo(
    () =>
      places.filter(
        (candidate) => candidate.id !== place?.id,
      ),
    [places, place?.id],
  );

  if (!open) return null;

  function chooseImage(file: File) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be smaller than 5 MB.");
      return;
    }

    setError("");

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
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

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

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

    if (!name.trim()) {
      setError("Give this place a name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let finalImagePath: string | null =
        removeExistingImage
          ? null
          : place?.imagePath ?? null;

      if (imageFile) {
        finalImagePath = await uploadPlaceImage(
          worldId,
          imageFile,
        );
      }

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

        imagePath: finalImagePath,

        mapX: place?.mapX ?? null,
        mapY: place?.mapY ?? null,
      };

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
              {isEditing
                ? "Edit this place"
                : "Add a new place"}
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

        <form
          onSubmit={handleSubmit}
          className="space-y-7 p-7"
        >
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Place name">
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
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
                <option value="">
                  No parent location
                </option>

                {parentOptions.map((parent) => (
                  <option
                    key={parent.id}
                    value={parent.id}
                  >
                    {parent.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Place type">
              <select
                value={placeType}
                onChange={(event) =>
                  setPlaceType(
                    event.target.value as PlaceType,
                  )
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
                  setStatus(
                    event.target.value as PlaceStatus,
                  )
                }
                className={inputClassName}
              >
                {PLACE_STATUSES.map((placeStatus) => (
                  <option
                    key={placeStatus}
                    value={placeStatus}
                  >
                    {getPlaceStatusLabel(placeStatus)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Short summary">
            <input
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
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
              onChange={(event) =>
                setAliases(event.target.value)
              }
              placeholder="Old Quarter, Lantern District"
              className={inputClassName}
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Separate multiple aliases with commas.
            </p>
          </Field>

          <Field label="Place image">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={imagePreview}
                  alt="Selected place"
                  className="h-64 w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-12">
                  <p className="text-xs text-white/80">
                    {imageFile
                      ? imageFile.name
                      : "Current place image"}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur transition hover:bg-black/60"
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={removeImage}
                      className="rounded-lg border border-red-400/30 bg-black/40 px-3 py-1.5 text-xs text-red-200 backdrop-blur transition hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
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
                  setDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragging(false);
                }}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-xl border border-dashed px-6 py-10 text-center transition ${
                  dragging
                    ? "border-gold bg-gold/10"
                    : "border-border bg-muted/20 hover:border-gold/50 hover:bg-muted/40"
                }`}
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-background">
                  {dragging ? (
                    <Upload className="size-5 text-gold" />
                  ) : (
                    <ImageIcon className="size-5 text-gold" />
                  )}
                </div>

                <p className="mt-4 text-sm font-medium text-foreground">
                  {dragging
                    ? "Drop the image here"
                    : "Upload a place image"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Drag and drop or click to browse
                </p>

                <p className="mt-3 text-[0.7rem] text-muted-foreground/70">
                  JPEG, PNG, or WebP · Maximum 5 MB ·
                  Landscape images work best
                </p>
              </div>
            )}
          </Field>

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
              {saving && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {saving
                ? imageFile
                  ? "Uploading and saving..."
                  : "Saving..."
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