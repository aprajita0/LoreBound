import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Move,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/app/primitives";
import { cn } from "@/lib/utils";
import {
  createCharacter,
  deleteCharacter,
  listCharacters,
  prepareCharacterPortrait,
  updateCharacter,
  uploadCharacterPortrait,
  type Character,
  type CharacterImportance,
  type CharacterStatus,
  type PortraitCrop,
  type SaveCharacterInput,
} from "@/services/characters";

export const Route = createFileRoute(
  "/worlds/$worldId/characters/",
)({
  head: () => ({
    meta: [
      {
        title: "Characters — Lorebound",
      },
      {
        name: "description",
        content:
          "Create and manage the cast of your Lorebound world.",
      },
    ],
  }),
  component: CharactersPage,
});

type ImportanceFilter =
  | CharacterImportance
  | "all";

type StatusFilter =
  | CharacterStatus
  | "all";

function splitList(
  value: string,
): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatUpdatedAt(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return `Updated ${new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  ).format(date)}`;
}

function CharacterPortrait({
  character,
  className,
}: {
  character: Character;
  className?: string;
}) {
  if (character.portraitUrl) {
    return (
      <img
        src={character.portraitUrl}
        alt={`Portrait of ${character.name}`}
        decoding="async"
        draggable={false}
        width={112}
        height={140}
        className={cn(
          "block h-full w-full object-cover object-center",
          className,
        )}
      />
    );
  }

  const initials = character.name
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        "bg-[radial-gradient(circle_at_30%_20%,rgba(204,166,91,0.22),transparent_30%),linear-gradient(145deg,#253249,#111827_60%,#080d17)]",
        "font-display text-2xl text-gold",
        className,
      )}
      aria-label={`Portrait placeholder for ${character.name}`}
    >
      {initials || (
        <UserRound
          className="size-7"
          aria-hidden
        />
      )}
    </div>
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}

function PortraitCropDialog({
  source,
  onCancel,
  onChooseAnother,
  onApply,
}: {
  source: {
    file: File;
    url: string;
  } | null;
  onCancel: () => void;
  onChooseAnother: () => void;
  onApply: (
    crop: PortraitCrop,
  ) => Promise<void>;
}) {
  const frameRef =
    useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [
    naturalSize,
    setNaturalSize,
  ] = useState({
    width: 0,
    height: 0,
  });

  const [
    frameSize,
    setFrameSize,
  ] = useState({
    width: 320,
    height: 400,
  });

  const [zoom, setZoom] =
    useState(1);

  const [offsetX, setOffsetX] =
    useState(0);

  const [offsetY, setOffsetY] =
    useState(0);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  useEffect(() => {
    if (!source) {
      return;
    }

    setNaturalSize({
      width: 0,
      height: 0,
    });

    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }, [source]);

  useEffect(() => {
    if (
      !source ||
      !frameRef.current
    ) {
      return;
    }

    const frame =
      frameRef.current;

    const updateSize = () => {
      setFrameSize({
        width: frame.clientWidth,
        height: frame.clientHeight,
      });
    };

    updateSize();

    const observer =
      new ResizeObserver(
        updateSize,
      );

    observer.observe(frame);

    return () => {
      observer.disconnect();
    };
  }, [source]);

  useEffect(() => {
    if (!source) {
      return;
    }

    const closeOnEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        !processing
      ) {
        onCancel();
      }
    };

    window.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, [
    onCancel,
    processing,
    source,
  ]);

  const metrics = useMemo(() => {
    if (
      !naturalSize.width ||
      !naturalSize.height
    ) {
      return null;
    }

    const baseScale = Math.max(
      frameSize.width /
        naturalSize.width,
      frameSize.height /
        naturalSize.height,
    );

    const width =
      naturalSize.width *
      baseScale *
      zoom;

    const height =
      naturalSize.height *
      baseScale *
      zoom;

    return {
      width,
      height,
      maximumOffsetX: Math.max(
        0,
        (width - frameSize.width) /
          2,
      ),
      maximumOffsetY: Math.max(
        0,
        (height - frameSize.height) /
          2,
      ),
    };
  }, [
    frameSize,
    naturalSize,
    zoom,
  ]);

  const quality = useMemo(() => {
    if (
      !naturalSize.width ||
      !naturalSize.height
    ) {
      return null;
    }

    const portraitRatio = 4 / 5;
    const sourceRatio =
      naturalSize.width /
      naturalSize.height;

    const baseCropWidth =
      sourceRatio > portraitRatio
        ? naturalSize.height *
          portraitRatio
        : naturalSize.width;

    const baseCropHeight =
      baseCropWidth /
      portraitRatio;

    const usedWidth = Math.round(
      baseCropWidth / zoom,
    );

    const usedHeight = Math.round(
      baseCropHeight / zoom,
    );

    const originalTooSmall =
      naturalSize.width < 400 ||
      naturalSize.height < 400;

    if (originalTooSmall) {
      return {
        level:
          "too-small" as const,
        label:
          "Too small — this will stay blurry",
        detail:
          `The original is ${naturalSize.width}×${naturalSize.height}px. ` +
          "Choose an image at least 400×400px; 800×1000px or larger is best.",
        usedWidth,
        usedHeight,
      };
    }

    if (
      usedWidth < 500 ||
      usedHeight < 625
    ) {
      return {
        level: "soft" as const,
        label:
          "This crop may look blurry",
        detail:
          `At this zoom, the crop uses about ${usedWidth}×${usedHeight}px ` +
          "of the original. Zoom out or choose a larger image.",
        usedWidth,
        usedHeight,
      };
    }

    if (
      usedWidth < 800 ||
      usedHeight < 1000
    ) {
      return {
        level: "fair" as const,
        label:
          "Good for cards; softer in large views",
        detail:
          `This crop uses about ${usedWidth}×${usedHeight}px. ` +
          "Lorebound will preserve that detail instead of artificially enlarging it.",
        usedWidth,
        usedHeight,
      };
    }

    return {
      level: "sharp" as const,
      label: "Sharp portrait",
      detail:
        "This crop has enough detail for the character cards and profile view. " +
        `Original: ${naturalSize.width}×${naturalSize.height}px.`,
      usedWidth,
      usedHeight,
    };
  }, [
    naturalSize,
    zoom,
  ]);

  function beginDrag(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      !metrics ||
      processing
    ) {
      return;
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );

    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX,
      offsetY,
    };
  }

  function moveImage(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    const drag =
      dragRef.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId ||
      !metrics
    ) {
      return;
    }

    setOffsetX(
      metrics.maximumOffsetX
        ? clamp(
            drag.offsetX +
              (event.clientX -
                drag.clientX) /
                metrics.maximumOffsetX,
            -1,
            1,
          )
        : 0,
    );

    setOffsetY(
      metrics.maximumOffsetY
        ? clamp(
            drag.offsetY +
              (event.clientY -
                drag.clientY) /
                metrics.maximumOffsetY,
            -1,
            1,
          )
        : 0,
    );
  }

  function endDrag(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      dragRef.current
        ?.pointerId !==
      event.pointerId
    ) {
      return;
    }

    dragRef.current = null;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  async function applyCrop() {
    if (
      processing ||
      !naturalSize.width
    ) {
      return;
    }

    setProcessing(true);

    try {
      await onApply({
        zoom,
        offsetX,
        offsetY,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not crop this portrait.",
      );
    } finally {
      setProcessing(false);
    }
  }

  if (!source) {
    return null;
  }

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(
        nextOpen,
      ) => {
        if (
          !nextOpen &&
          !processing
        ) {
          onCancel();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md" />

        <DialogPrimitive.Content
          className="
            fixed left-1/2 top-1/2 z-[80]
            max-h-[96vh]
            w-[calc(100%-2rem)]
            max-w-lg
            -translate-x-1/2
            -translate-y-1/2
            overflow-y-auto
            rounded-2xl
            border border-border
            bg-surface-raised
            p-5
            shadow-[0_32px_120px_rgba(0,0,0,0.65)]
            focus:outline-none
            sm:p-7
          "
          onEscapeKeyDown={(
            event,
          ) => {
            if (processing) {
              event.preventDefault();
            }
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">
                Portrait editor
              </p>

              <DialogPrimitive.Title className="mt-2 font-display text-3xl text-foreground">
                Frame the character
              </DialogPrimitive.Title>

              <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                Zoom in, then drag
                the image to
                reposition it inside
                the portrait frame.
              </DialogPrimitive.Description>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={processing}
              aria-label="Cancel portrait crop"
            >
              <X
                className="size-4"
                aria-hidden
              />
            </Button>
          </div>

          <div
            ref={frameRef}
            className="
              relative mx-auto mt-6
              aspect-[4/5]
              w-[min(20rem,calc(100vw-4rem))]
              touch-none
              cursor-grab
              overflow-hidden
              rounded-xl
              bg-black
              active:cursor-grabbing
            "
            onPointerDown={
              beginDrag
            }
            onPointerMove={
              moveImage
            }
            onPointerUp={
              endDrag
            }
            onPointerCancel={
              endDrag
            }
          >
            <img
              src={source.url}
              alt="Portrait crop preview"
              draggable={false}
              onLoad={(event) => {
                setNaturalSize({
                  width:
                    event
                      .currentTarget
                      .naturalWidth,
                  height:
                    event
                      .currentTarget
                      .naturalHeight,
                });
              }}
              className="
                pointer-events-none
                absolute
                left-1/2
                top-1/2
                max-w-none
                select-none
              "
              style={
                metrics
                  ? {
                      width:
                        metrics.width,
                      height:
                        metrics.height,
                      transform:
                        `translate(` +
                        `calc(-50% + ${
                          offsetX *
                          metrics.maximumOffsetX
                        }px), ` +
                        `calc(-50% + ${
                          offsetY *
                          metrics.maximumOffsetY
                        }px)` +
                        `)`,
                    }
                  : {
                      width: "100%",
                      height: "100%",
                      objectFit:
                        "cover",
                    }
              }
            />

            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/30">
              <span className="absolute inset-y-0 left-1/3 w-px bg-white/20" />
              <span className="absolute inset-y-0 left-2/3 w-px bg-white/20" />
              <span className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
              <span className="absolute inset-x-0 top-2/3 h-px bg-white/20" />
            </div>

            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.35)]" />

            <span
              className="
                pointer-events-none
                absolute bottom-3 left-1/2
                inline-flex
                -translate-x-1/2
                items-center gap-1.5
                rounded-full
                bg-black/65
                px-3 py-1.5
                text-[0.68rem]
                font-medium
                text-white
                backdrop-blur-sm
              "
            >
              <Move
                className="size-3.5"
                aria-hidden
              />
              Drag image
            </span>
          </div>

          {quality ? (
            <div
              className={cn(
                "mx-auto mt-4 flex max-w-sm gap-3 rounded-xl border p-3.5",
                quality.level ===
                  "sharp" &&
                  "border-forest/35 bg-forest/10 text-forest",
                quality.level ===
                  "fair" &&
                  "border-gold/35 bg-gold/10 text-gold",
                (quality.level ===
                  "soft" ||
                  quality.level ===
                    "too-small") &&
                  "border-destructive/40 bg-destructive/10 text-destructive",
              )}
            >
              {quality.level ===
              "sharp" ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
              ) : quality.level ===
                "fair" ? (
                <Info
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
              ) : (
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
              )}

              <div>
                <p className="text-xs font-semibold">
                  {quality.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {quality.detail}
                </p>
              </div>
            </div>
          ) : null}

          <label className="mx-auto mt-5 block max-w-xs text-sm font-medium text-foreground">
            <span className="flex items-center justify-between">
              <span>Zoom</span>

              <span className="text-xs font-normal text-muted-foreground">
                {zoom.toFixed(1)}×
              </span>
            </span>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => {
                setZoom(
                  Number(
                    event.target
                      .value,
                  ),
                );
              }}
              className="mt-3 w-full accent-[var(--color-gold)]"
            />
          </label>

          <button
            type="button"
            onClick={
              onChooseAnother
            }
            disabled={processing}
            className="mx-auto mt-3 block text-xs text-gold underline-offset-4 hover:underline disabled:opacity-50"
          >
            Choose a different
            image
          </button>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
            <p className="text-xs text-muted-foreground">
              Saved losslessly at
              the crop&apos;s natural
              resolution
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={processing}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => {
                  void applyCrop();
                }}
                disabled={
                  processing ||
                  !naturalSize.width ||
                  quality?.level ===
                    "too-small"
                }
                className="gap-2"
              >
                {processing ? (
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden
                  />
                ) : (
                  <Camera
                    className="size-4"
                    aria-hidden
                  />
                )}

                {processing
                  ? "Preparing…"
                  : "Use this crop"}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CharacterDialog({
  worldId,
  character,
  open,
  onOpenChange,
}: {
  worldId: string;
  character: Character | null;
  open: boolean;
  onOpenChange: (
    open: boolean,
  ) => void;
}) {
  const queryClient =
    useQueryClient();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState("");

  const [summary, setSummary] =
    useState("");

  const [
    importance,
    setImportance,
  ] =
    useState<CharacterImportance>(
      "supporting",
    );

  const [status, setStatus] =
    useState<CharacterStatus>(
      "active",
    );

  const [
    location,
    setLocation,
  ] = useState("");

  const [aliases, setAliases] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [
    portraitFile,
    setPortraitFile,
  ] = useState<File | null>(null);

  const [
    portraitPreview,
    setPortraitPreview,
  ] = useState<string | null>(
    null,
  );

  const [
    cropSource,
    setCropSource,
  ] = useState<{
    file: File;
    url: string;
  } | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(
      character?.name ?? "",
    );

    setRole(
      character?.role ?? "",
    );

    setSummary(
      character?.summary ?? "",
    );

    setImportance(
      character?.importance ??
        "supporting",
    );

    setStatus(
      character?.status ??
        "active",
    );

    setLocation(
      character?.location ?? "",
    );

    setAliases(
      character?.aliases.join(
        ", ",
      ) ?? "",
    );

    setTags(
      character?.tags.join(
        ", ",
      ) ?? "",
    );

    setPortraitFile(null);
    setPortraitPreview(null);
    setCropSource(null);
  }, [
    character,
    open,
  ]);

  useEffect(
    () => () => {
      if (portraitPreview) {
        URL.revokeObjectURL(
          portraitPreview,
        );
      }
    },
    [portraitPreview],
  );

  useEffect(
    () => () => {
      if (cropSource) {
        URL.revokeObjectURL(
          cropSource.url,
        );
      }
    },
    [cropSource],
  );

  function choosePortrait(
    file: File | undefined,
  ) {
    if (!file) {
      return;
    }

    setCropSource({
      file,
      url: URL.createObjectURL(
        file,
      ),
    });
  }

  async function applyPortraitCrop(
    crop: PortraitCrop,
  ) {
    if (!cropSource) {
      return;
    }

    const preparedFile =
      await prepareCharacterPortrait(
        cropSource.file,
        crop,
      );

    if (portraitPreview) {
      URL.revokeObjectURL(
        portraitPreview,
      );
    }

    setPortraitFile(
      preparedFile,
    );

    setPortraitPreview(
      URL.createObjectURL(
        preparedFile,
      ),
    );

    setCropSource(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);

    const input: SaveCharacterInput =
      {
        worldId,
        name,
        role,
        summary,
        importance,
        status,
        location,
        aliases:
          splitList(aliases),
        tags: splitList(tags),
      };

    try {
      let savedCharacter: Character;

      if (character) {
        await updateCharacter(
          character.id,
          input,
        );

        savedCharacter = {
          ...character,
          ...input,
          id: character.id,
          updatedAt:
            new Date().toISOString(),
        };
      } else {
        savedCharacter =
          await createCharacter(
            input,
          );
      }

      if (portraitFile) {
        const portrait =
          await uploadCharacterPortrait(
            savedCharacter,
            portraitFile,
          );

        savedCharacter = {
          ...savedCharacter,
          portraitPath:
            portrait.portraitPath,
          portraitUrl:
            portrait.portraitUrl,
        };
      }

      queryClient.setQueryData<
        Character[]
      >(
        [
          "characters",
          worldId,
        ],
        (current) => {
          if (!current) {
            return [
              savedCharacter,
            ];
          }

          const exists =
            current.some(
              (item) =>
                item.id ===
                savedCharacter.id,
            );

          return exists
            ? current.map(
                (item) =>
                  item.id ===
                  savedCharacter.id
                    ? savedCharacter
                    : item,
              )
            : [
                savedCharacter,
                ...current,
              ];
        },
      );

      toast.success(
        character
          ? "Character updated."
          : "Character created.",
      );

      onOpenChange(false);

      void queryClient.invalidateQueries(
        {
          queryKey: [
            "characters",
            worldId,
          ],
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The character could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !character ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete “${character.name}”? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteCharacter(
        character,
      );

      queryClient.setQueryData<
        Character[]
      >(
        [
          "characters",
          worldId,
        ],
        (current) =>
          current?.filter(
            (item) =>
              item.id !==
              character.id,
          ),
      );

      toast.success(
        "Character deleted.",
      );

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The character could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const fieldClassName =
    "mt-2 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-gold/70 focus:ring-2 focus:ring-gold/15";

  return (
    <>
      <DialogPrimitive.Root
        open={open}
        onOpenChange={
          onOpenChange
        }
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />

          <DialogPrimitive.Content
            className="
              fixed left-1/2 top-1/2 z-50
              max-h-[92vh]
              w-[calc(100%-2rem)]
              max-w-3xl
              -translate-x-1/2
              -translate-y-1/2
              overflow-y-auto
              rounded-2xl
              border border-border
              bg-surface-raised
              p-6
              shadow-[0_32px_110px_rgba(0,0,0,0.45)]
              focus:outline-none
              sm:p-8
            "
          >
            <div className="pr-12">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">
                {character
                  ? "Character record"
                  : "New character"}
              </p>

              <DialogPrimitive.Title className="mt-2 font-display text-3xl text-foreground">
                {character
                  ? `Edit ${character.name}`
                  : "Add someone to the cast"}
              </DialogPrimitive.Title>

              <DialogPrimitive.Description className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Keep the details
                useful while you
                write. You can deepen
                their history,
                connections, and
                secrets later.
              </DialogPrimitive.Description>
            </div>

            <DialogPrimitive.Close
              asChild
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                aria-label="Close character editor"
              >
                <X
                  className="size-4"
                  aria-hidden
                />
              </Button>
            </DialogPrimitive.Close>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-7 grid gap-7 md:grid-cols-[12rem_1fr]"
            >
              <div>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="
                    group relative
                    aspect-[4/5]
                    w-full
                    overflow-hidden
                    rounded-xl
                    border border-border
                    bg-background
                    shadow-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-gold
                  "
                >
                  {portraitPreview ||
                  character?.portraitUrl ? (
                    <img
                      src={
                        portraitPreview ??
                        character
                          ?.portraitUrl ??
                        ""
                      }
                      alt="Character portrait preview"
                      decoding="async"
                      draggable={
                        false
                      }
                      className="block size-full object-cover"
                    />
                  ) : (
                    <span
                      className="
                        flex size-full
                        flex-col
                        items-center
                        justify-center
                        bg-[radial-gradient(circle_at_30%_20%,rgba(204,166,91,0.16),transparent_30%),linear-gradient(145deg,#253249,#111827_60%,#080d17)]
                        text-gold
                      "
                    >
                      <ImagePlus
                        className="size-7"
                        aria-hidden
                      />

                      <span className="mt-3 text-xs text-white/70">
                        Add portrait
                      </span>
                    </span>
                  )}

                  <span
                    className="
                      absolute inset-x-0 bottom-0
                      flex items-center
                      justify-center
                      gap-2
                      bg-black/65
                      px-3 py-2.5
                      text-xs
                      text-white
                      opacity-100
                      backdrop-blur-sm
                      transition
                      md:opacity-0
                      md:group-hover:opacity-100
                    "
                  >
                    <Camera
                      className="size-3.5"
                      aria-hidden
                    />

                    {character?.portraitPath ||
                    portraitFile
                      ? "Replace portrait"
                      : "Choose portrait"}
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={(
                    event,
                  ) => {
                    choosePortrait(
                      event.target
                        .files?.[0],
                    );

                    event.currentTarget.value =
                      "";
                  }}
                />

                <p className="mt-2 text-center text-[0.68rem] leading-5 text-muted-foreground">
                  800×1000 recommended
                  · 400px minimum · 8
                  MB max
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-foreground sm:col-span-2">
                  Name

                  <input
                    value={name}
                    onChange={(
                      event,
                    ) => {
                      setName(
                        event.target
                          .value,
                      );
                    }}
                    className={
                      fieldClassName
                    }
                    maxLength={100}
                    placeholder="Omir Igwe"
                    required
                    autoFocus
                  />
                </label>

                <label className="block text-sm font-medium text-foreground sm:col-span-2">
                  Role or one-line
                  identity

                  <input
                    value={role}
                    onChange={(
                      event,
                    ) => {
                      setRole(
                        event.target
                          .value,
                      );
                    }}
                    className={
                      fieldClassName
                    }
                    maxLength={180}
                    placeholder="Student and hidden Igwe heir"
                  />
                </label>

                <label className="block text-sm font-medium text-foreground">
                  Importance

                  <select
                    value={
                      importance
                    }
                    onChange={(
                      event,
                    ) => {
                      setImportance(
                        event.target
                          .value as CharacterImportance,
                      );
                    }}
                    className={
                      fieldClassName
                    }
                  >
                    <option value="major">
                      Major
                    </option>

                    <option value="supporting">
                      Supporting
                    </option>

                    <option value="minor">
                      Minor
                    </option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-foreground">
                  Current status

                  <select
                    value={status}
                    onChange={(
                      event,
                    ) => {
                      setStatus(
                        event.target
                          .value as CharacterStatus,
                      );
                    }}
                    className={
                      fieldClassName
                    }
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="absent">
                      Absent
                    </option>

                    <option value="deceased">
                      Deceased
                    </option>

                    <option value="unknown">
                      Unknown
                    </option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-foreground sm:col-span-2">
                  Current location

                  <input
                    value={location}
                    onChange={(
                      event,
                    ) => {
                      setLocation(
                        event.target
                          .value,
                      );
                    }}
                    className={
                      fieldClassName
                    }
                    maxLength={150}
                    placeholder="The Academy"
                  />
                </label>

                <label className="block text-sm font-medium text-foreground sm:col-span-2">
                  Character summary

                  <textarea
                    value={summary}
                    onChange={(
                      event,
                    ) => {
                      setSummary(
                        event.target
                          .value,
                      );
                    }}
                    className={cn(
                      fieldClassName,
                      "min-h-28 resize-y leading-6",
                    )}
                    maxLength={1200}
                    placeholder="The details you need to remember while writing…"
                  />
                </label>

                <label className="block text-sm font-medium text-foreground">
                  Aliases

                  <input
                    value={aliases}
                    onChange={(
                      event,
                    ) => {
                      setAliases(
                        event.target
                          .value,
                      );
                    }}
                    className={
                      fieldClassName
                    }
                    placeholder="Mira, The White Bird"
                  />

                  <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                    Separate with commas
                  </span>
                </label>

                <label className="block text-sm font-medium text-foreground">
                  Tags

                  <input
                    value={tags}
                    onChange={(
                      event,
                    ) => {
                      setTags(
                        event.target
                          .value,
                      );
                    }}
                    className={
                      fieldClassName
                    }
                    placeholder="House Igwe, Academy"
                  />

                  <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
                    Separate with commas
                  </span>
                </label>

                <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  {character ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={
                        deleting ||
                        saving
                      }
                      onClick={() => {
                        void handleDelete();
                      }}
                    >
                      {deleting ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden
                        />
                      ) : (
                        <Trash2
                          className="size-4"
                          aria-hidden
                        />
                      )}

                      Delete character
                    </Button>
                  ) : (
                    <span />
                  )}

                  <div className="flex justify-end gap-3">
                    <DialogPrimitive.Close
                      asChild
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={
                          saving
                        }
                      >
                        Cancel
                      </Button>
                    </DialogPrimitive.Close>

                    <Button
                      type="submit"
                      className="gap-2"
                      disabled={
                        saving ||
                        !name.trim()
                      }
                    >
                      {saving ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden
                        />
                      ) : character ? (
                        <Pencil
                          className="size-4"
                          aria-hidden
                        />
                      ) : (
                        <Plus
                          className="size-4"
                          aria-hidden
                        />
                      )}

                      {saving
                        ? "Saving…"
                        : character
                          ? "Save character"
                          : "Create character"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <PortraitCropDialog
        source={cropSource}
        onCancel={() => {
          setCropSource(null);
        }}
        onChooseAnother={() => {
          setCropSource(null);

          window.setTimeout(
            () => {
              fileInputRef.current?.click();
            },
            0,
          );
        }}
        onApply={
          applyPortraitCrop
        }
      />
    </>
  );
}

function CharacterCard({
  character,
  onOpen,
}: {
  character: Character;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="
        group
        flex min-h-52 w-full
        items-start
        gap-4
        rounded-xl
        border border-border/70
        bg-surface/90
        p-4
        text-left
        shadow-sm
        transition-[border-color,background-color,box-shadow]
        duration-300
        hover:border-gold/35
        hover:bg-surface-raised
        hover:shadow-[0_18px_50px_rgba(3,7,18,0.12)]
        focus:outline-none
        focus:ring-2
        focus:ring-gold/60
        sm:p-5
      "
    >
      <div
        className="
          h-[120px]
          w-24
          shrink-0
          self-start
          overflow-hidden
          rounded-lg
          border border-border/70
          bg-background
          sm:h-[140px]
          sm:w-28
        "
      >
        <CharacterPortrait character={character} />
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl text-foreground transition-colors group-hover:text-gold">
              {character.name}
            </h2>

            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
              {character.role || "Role not set"}
            </p>
          </div>

          <Pencil
            className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-gold/25 bg-gold/8 px-2 py-1 text-[0.62rem] font-medium capitalize text-gold">
            {character.importance}
          </span>

          <span className="rounded-md border border-border bg-background/60 px-2 py-1 text-[0.62rem] font-medium capitalize text-muted-foreground">
            {character.status}
          </span>

          {character.aliases.length > 0 ? (
            <span className="rounded-md border border-plum/30 bg-plum/10 px-2 py-1 text-[0.62rem] font-medium text-plum">
              {character.aliases.length}{" "}
              {character.aliases.length === 1 ? "alias" : "aliases"}
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {character.summary ||
            "No character summary yet. Open this record to add what matters."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {character.location ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin
                className="size-3.5 shrink-0"
                aria-hidden
              />

              <span className="truncate">
                {character.location}
              </span>
            </span>
          ) : null}

          <span>
            {formatUpdatedAt(character.updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

function CharactersPage() {
  const { worldId } =
    Route.useParams();

  const [search, setSearch] =
    useState("");

  const [
    importance,
    setImportance,
  ] =
    useState<ImportanceFilter>(
      "all",
    );

  const [status, setStatus] =
    useState<StatusFilter>(
      "all",
    );

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    selectedCharacter,
    setSelectedCharacter,
  ] =
    useState<Character | null>(
      null,
    );

  const charactersQuery =
    useQuery({
      queryKey: [
        "characters",
        worldId,
      ],
      queryFn: () =>
        listCharacters(worldId),
    });

  const characters =
    charactersQuery.data ?? [];

  const filteredCharacters =
    useMemo(() => {
      const needle = search
        .trim()
        .toLowerCase();

      return characters.filter(
        (character) => {
          const matchesImportance =
            importance ===
              "all" ||
            character.importance ===
              importance;

          const matchesStatus =
            status === "all" ||
            character.status ===
              status;

          const searchable = [
            character.name,
            character.role,
            character.summary,
            character.location,
            ...character.aliases,
            ...character.tags,
          ]
            .join(" ")
            .toLowerCase();

          return (
            matchesImportance &&
            matchesStatus &&
            (!needle ||
              searchable.includes(
                needle,
              ))
          );
        },
      );
    }, [
      characters,
      importance,
      search,
      status,
    ]);

  function createNewCharacter() {
    setSelectedCharacter(null);
    setDialogOpen(true);
  }

  function editCharacter(
    character: Character,
  ) {
    setSelectedCharacter(
      character,
    );

    setDialogOpen(true);
  }

  if (
    charactersQuery.isError
  ) {
    return (
      <div className="p-8">
        <ErrorState
          message={
            charactersQuery.error instanceof
            Error
              ? charactersQuery
                  .error.message
              : "The character archive could not be loaded."
          }
          retry={() => {
            void charactersQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background/30 px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold">
              Cast
            </p>

            <h1 className="mt-2 font-display text-4xl leading-none text-foreground sm:text-5xl">
              Characters
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Keep the people in
              your story distinct,
              connected, and easy to
              find while you write.
            </p>
          </div>

          <Button
            onClick={
              createNewCharacter
            }
            className="w-fit gap-2"
          >
            <Plus
              className="size-4"
              aria-hidden
            />

            Add character
          </Button>
        </header>

        <div className="mt-8 flex flex-col gap-4 border-b border-border/60 pb-6">
          <label className="relative block max-w-md">
            <span className="sr-only">
              Search characters
            </span>

            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />

            <input
              value={search}
              onChange={(
                event,
              ) => {
                setSearch(
                  event.target.value,
                );
              }}
              placeholder="Search names, roles, aliases…"
              className="
                h-10 w-full
                rounded-lg
                border border-input
                bg-background/75
                pl-10 pr-3
                text-sm
                text-foreground
                outline-none
                transition
                placeholder:text-muted-foreground
                focus:border-gold/60
                focus:ring-2
                focus:ring-gold/15
              "
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(
              [
                "all",
                "major",
                "supporting",
                "minor",
              ] as const
            ).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setImportance(
                    value,
                  );
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs capitalize transition-colors",
                  importance ===
                    value
                    ? "border-gold/50 bg-gold/10 text-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "all"
                  ? "All roles"
                  : value}
              </button>
            ))}

            <span
              className="mx-1 h-7 w-px bg-border"
              aria-hidden
            />

            {(
              [
                "all",
                "active",
                "absent",
                "deceased",
                "unknown",
              ] as const
            ).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs capitalize transition-colors",
                  status === value
                    ? "border-gold/50 bg-gold/10 text-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "all"
                  ? "Any status"
                  : value}
              </button>
            ))}
          </div>
        </div>

        {charactersQuery.isLoading ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {Array.from({
              length: 4,
            }).map(
              (_, index) => (
                <Skeleton
                  key={index}
                  className="h-52 rounded-xl"
                />
              ),
            )}
          </div>
        ) : filteredCharacters.length >
          0 ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {filteredCharacters.map(
              (character) => (
                <CharacterCard
                  key={
                    character.id
                  }
                  character={
                    character
                  }
                  onOpen={() => {
                    editCharacter(
                      character,
                    );
                  }}
                />
              ),
            )}
          </div>
        ) : characters.length ===
          0 ? (
          <section className="mt-8 rounded-2xl border border-border/70 bg-surface/75 px-6 py-20 text-center shadow-sm backdrop-blur-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold">
              <UserRound
                className="size-5"
                aria-hidden
              />
            </div>

            <h2 className="mt-5 font-display text-3xl text-foreground">
              Your cast is waiting.
            </h2>

            <p className="mx-auto mt-2 max-w-md leading-6 text-muted-foreground">
              Add the first person
              who matters to this
              world, then give them a
              face, a role, and
              something worth
              remembering.
            </p>

            <Button
              onClick={
                createNewCharacter
              }
              className="mt-6 gap-2"
            >
              <Plus
                className="size-4"
                aria-hidden
              />

              Add your first
              character
            </Button>
          </section>
        ) : (
          <div className="mt-14 text-center">
            <p className="font-display text-2xl text-foreground">
              No characters match
              these filters.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setImportance(
                  "all",
                );
                setStatus("all");
              }}
              className="mt-3 text-sm text-gold hover:underline"
            >
              Clear search and
              filters
            </button>
          </div>
        )}
      </div>

      <CharacterDialog
        worldId={worldId}
        character={
          selectedCharacter
        }
        open={dialogOpen}
        onOpenChange={
          setDialogOpen
        }
      />
    </div>
  );
}