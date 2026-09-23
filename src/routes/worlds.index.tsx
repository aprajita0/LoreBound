import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { formatDistanceToNow } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Camera,
  Clock3,
  FileText,
  ImagePlus,
  LibraryBig,
  Loader2,
  Pencil,
  Plus,
  Quote,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LibraryHeader } from "@/components/app/library-header";
import { WorldsSanctuaryBackground } from "@/components/app/worlds-sanctuary-background";
import { ErrorState, SectionLabel } from "@/components/app/primitives";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  listWorlds,
  updateWorldDetails,
  uploadWorldCover,
  type WorldSummary,
} from "@/services/worlds";

export const Route = createFileRoute("/worlds/")({
  head: () => ({
    meta: [
      { title: "My Worlds — Lorebound" },
      {
        name: "description",
        content: "Your personal library of story worlds in Lorebound.",
      },
    ],
  }),
  component: WorldsLibrary,
});

function formatRelativeDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "recently";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

function formatWordCount(wordCount: number): string {
  if (wordCount < 1_000) return wordCount.toLocaleString();
  const rounded = wordCount / 1_000;
  return `${rounded.toFixed(rounded >= 10 ? 0 : 1)}k`;
}

function getUserName(user: ReturnType<typeof useSession>["user"]): string {
  if (!user) return "Writer";
  return user.name?.trim() || user.email?.split("@")[0] || "Writer";
}

function WorldArtwork({
  world,
  className,
}: {
  world: WorldSummary;
  className?: string;
}) {
  if (world.coverUrl) {
    return (
      <img
        src={world.coverUrl}
        alt={`Cover artwork for ${world.title}`}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex size-full items-center justify-center overflow-hidden",
        "bg-[radial-gradient(circle_at_25%_18%,rgba(213,177,103,0.18),transparent_26%),radial-gradient(circle_at_78%_26%,rgba(102,107,168,0.2),transparent_30%),linear-gradient(155deg,#1a2a42_0%,#10182b_48%,#080d18_100%)]",
        className,
      )}
      aria-label={`Decorative cover for ${world.title}`}
    >
      <div className="absolute inset-0 opacity-60" aria-hidden>
        <span className="absolute left-[18%] top-[19%] size-1 rounded-full bg-gold shadow-[0_0_14px_rgba(220,181,99,0.8)]" />
        <span className="absolute right-[24%] top-[29%] size-0.5 rounded-full bg-white/80" />
        <span className="absolute left-[34%] top-[41%] size-0.5 rounded-full bg-white/60" />
        <span className="absolute right-[35%] top-[14%] size-0.5 rounded-full bg-white/70" />
      </div>

      <div className="relative flex size-28 items-center justify-center rounded-full border border-gold/20 bg-black/10 shadow-[0_0_70px_rgba(202,164,91,0.09)]">
        <span className="absolute inset-3 rounded-full border border-gold/15" />
        <LibraryBig className="relative size-10 text-gold/75" aria-hidden />
      </div>
    </div>
  );
}

function CoverUploadButton({
  world,
  compact = false,
}: {
  world: WorldSummary;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    setUploading(true);

    try {
      const cover = await uploadWorldCover(world.id, file);

      queryClient.setQueryData<WorldSummary[]>(["worlds"], (current) =>
        current?.map((item) =>
          item.id === world.id
            ? {
                ...item,
                coverPath: cover.coverPath,
                coverUrl: cover.coverUrl,
              }
            : item,
        ),
      );

      toast.success("World cover updated.");
      void queryClient.invalidateQueries({ queryKey: ["worlds"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The cover could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <Button
        type="button"
        size={compact ? "icon" : "sm"}
        variant="secondary"
        className={cn(
          "border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md hover:bg-black/70 hover:text-white",
          compact && "size-9 rounded-full",
        )}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        aria-label={world.coverPath ? "Replace cover image" : "Add cover image"}
        title={world.coverPath ? "Replace cover" : "Add a cover"}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : world.coverPath ? (
          <Camera className="size-4" aria-hidden />
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
        {!compact ? (world.coverPath ? "Replace cover" : "Add cover") : null}
      </Button>
    </>
  );
}

function EditWorldDialog({
  world,
  compact = false,
}: {
  world: WorldSummary;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(world.title);
  const [genre, setGenre] = useState(world.genre);
  const [synopsis, setSynopsis] = useState(world.description);
  const [saving, setSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setTitle(world.title);
      setGenre(world.genre);
      setSynopsis(world.description);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    const nextTitle = title.trim();
    const nextGenre = genre.trim();
    const nextSynopsis = synopsis.trim();

    try {
      await updateWorldDetails({
        worldId: world.id,
        title: nextTitle,
        genre: nextGenre,
        synopsis: nextSynopsis,
      });

      queryClient.setQueryData<WorldSummary[]>(["worlds"], (current) =>
        current?.map((item) =>
          item.id === world.id
            ? {
                ...item,
                title: nextTitle,
                genre: nextGenre,
                description: nextSynopsis,
              }
            : item,
        ),
      );

      toast.success("World details saved.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["worlds"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The world details could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldClassName =
    "mt-2 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/65 focus:border-gold/70 focus:ring-2 focus:ring-gold/15";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <Button
          type="button"
          variant={compact ? "secondary" : "outline"}
          size={compact ? "icon" : "sm"}
          className={cn(
            compact &&
              "size-9 rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md hover:bg-black/70 hover:text-white",
          )}
          aria-label="Edit world details"
        >
          <Pencil className="size-4" aria-hidden />
          {!compact ? "Edit world" : null}
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface-raised p-6 shadow-[0_30px_100px_rgba(0,0,0,0.38)] focus:outline-none sm:p-8">
          <div className="pr-10">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-gold">
              World details
            </p>
            <DialogPrimitive.Title className="mt-2 font-display text-3xl text-foreground">
              Edit {world.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              Shape how this world appears in your private library. Your
              manuscript will not be changed.
            </DialogPrimitive.Description>
          </div>

          <DialogPrimitive.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              aria-label="Close edit world dialog"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </DialogPrimitive.Close>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-foreground">
              World name
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={fieldClassName}
                maxLength={100}
                required
                autoFocus
              />
            </label>

            <label className="block text-sm font-medium text-foreground">
              Genre
              <input
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className={fieldClassName}
                maxLength={80}
                placeholder="Epic fantasy, gothic mystery…"
                required
              />
            </label>

            <label className="block text-sm font-medium text-foreground">
              Synopsis
              <textarea
                value={synopsis}
                onChange={(event) => setSynopsis(event.target.value)}
                className={cn(fieldClassName, "min-h-36 resize-y leading-6")}
                maxLength={1200}
                placeholder="What is this world and the story unfolding inside it?"
              />
              <span className="mt-1.5 block text-right text-xs font-normal text-muted-foreground">
                {synopsis.length}/1200
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="ghost" disabled={saving}>
                  Cancel
                </Button>
              </DialogPrimitive.Close>
              <Button
                type="submit"
                className="gap-2"
                disabled={saving || !title.trim() || !genre.trim()}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-4" aria-hidden />
                )}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function FeaturedWorld({ world }: { world: WorldSummary }) {
  const latest = world.latestChapter;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="grid overflow-hidden rounded-2xl border border-border/70 bg-surface-raised shadow-[0_28px_80px_rgba(3,7,18,0.13)] lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.45fr)]"
    >
      <div className="group relative min-h-[22rem] overflow-hidden lg:min-h-[34rem]">
        <WorldArtwork
          world={world}
          className="transition duration-700 ease-out group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <div className="absolute bottom-5 left-5">
          <CoverUploadButton world={world} />
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="flex flex-wrap items-center gap-3 text-[0.67rem] font-medium uppercase tracking-[0.2em]">
          <span className="text-gold">{world.genre}</span>
          <span className="size-1 rounded-full bg-border" aria-hidden />
          <span className="text-muted-foreground">
            Last opened {formatRelativeDate(world.lastOpenedAt)}
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-5">
          <h2 className="max-w-2xl font-display text-4xl leading-[1.02] text-foreground sm:text-5xl">
            {world.title}
          </h2>
          <EditWorldDialog world={world} />
        </div>
        <p className="mt-5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Synopsis
        </p>
        <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
          {world.description || "A new world waiting for its story to unfold."}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-border/60 py-6 sm:grid-cols-4">
          {[
            ["Chapters", world.chapterCount.toLocaleString()],
            ["Words", world.wordCount.toLocaleString()],
            ["Status", world.status],
            ["Last opened", formatRelativeDate(world.lastOpenedAt)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1.5 font-display text-lg capitalize text-foreground">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex-1 rounded-xl border border-border/60 bg-background/55 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Quote className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
                Continue writing
              </p>
              <h3 className="mt-1 font-display text-2xl text-foreground">
                {latest?.title ?? "Begin your first chapter"}
              </h3>
              {latest?.subtitle ? (
                <p className="mt-1 text-sm italic text-muted-foreground">
                  {latest.subtitle}
                </p>
              ) : null}
              <p className="mt-3 line-clamp-3 max-w-2xl font-display text-[1.08rem] leading-7 text-foreground/80">
                {latest?.excerpt ||
                  "The page is quiet for now. Open the manuscript and write the first line that changes everything."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {latest
                  ? `${latest.wordCount.toLocaleString()} words · Edited ${formatRelativeDate(latest.updatedAt)}`
                  : "No prose yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link
              to="/worlds/$worldId/manuscript"
              params={{ worldId: world.id }}
            >
              Continue writing
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            Opens your saved manuscript
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function WorldCard({ world, index }: { world: WorldSummary; index: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.07, 0.28),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group min-w-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border/70 bg-surface shadow-[0_18px_45px_rgba(3,7,18,0.1)] transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_24px_55px_rgba(3,7,18,0.16)]">
        <Link
          to="/worlds/$worldId/manuscript"
          params={{ worldId: world.id }}
          className="block size-full"
          aria-label={`Open ${world.title}`}
        >
          <WorldArtwork
            world={world}
            className="transition duration-700 ease-out group-hover:scale-[1.035]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
          <span className="absolute inset-x-5 bottom-5 text-white">
            <span className="block text-[0.62rem] font-medium uppercase tracking-[0.2em] text-amber-200/80">
              {world.genre}
            </span>
            <span className="mt-1 block font-display text-2xl leading-tight">
              {world.title}
            </span>
          </span>
        </Link>
        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <CoverUploadButton world={world} compact />
          <EditWorldDialog world={world} compact />
        </div>
      </div>

      <div className="px-1 pt-4">
        <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Synopsis
        </p>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {world.description || "A new story world waiting to be written."}
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5" aria-hidden />
            {world.chapterCount} chapters
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5" aria-hidden />
            {formatWordCount(world.wordCount)} words
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" aria-hidden />
            {formatRelativeDate(world.lastOpenedAt)}
          </span>
        </p>
      </div>
    </motion.article>
  );
}

function WorldsLibrary() {
  const [tab, setTab] = useState("mine");
  const { user } = useSession();
  const reduceMotion = useReducedMotion();
  const worldsQuery = useQuery({ queryKey: ["worlds"], queryFn: listWorlds });
  const worlds = worldsQuery.data ?? [];
  const featured = worlds[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-transparent">
      <div className="hidden dark:block">
        <WorldsSanctuaryBackground />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklch,var(--color-mist)_13%,transparent),transparent_58%),radial-gradient(ellipse_at_top_right,color-mix(in_oklch,var(--color-plum)_10%,transparent),transparent_58%)] dark:opacity-55"
        aria-hidden
      />

      <div className="relative z-20 border-b border-border/50 bg-background/88 backdrop-blur-xl">
        <LibraryHeader tab={tab} onTabChange={setTab} />
      </div>

      <main className="relative z-10 mx-auto max-w-[1380px] px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
              Your private story archive
            </p>
            <h1 className="mt-3 font-display text-4xl leading-none text-foreground sm:text-5xl">
              Welcome back, {getUserName(user)}.
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Pick up the thread exactly where you left it.
            </p>
          </div>

          <Button asChild variant="outline" className="w-fit gap-2">
            <Link to="/worlds/new">
              <Plus className="size-4" aria-hidden />
              Create new world
            </Link>
          </Button>
        </motion.header>

        {worldsQuery.isError ? (
          <div className="mt-10">
            <ErrorState
              message={
                worldsQuery.error instanceof Error
                  ? worldsQuery.error.message
                  : "Your library couldn't be loaded."
              }
              retry={() => void worldsQuery.refetch()}
            />
          </div>
        ) : null}

        {worldsQuery.isLoading ? (
          <div className="mt-10 space-y-16">
            <Skeleton className="h-[36rem] rounded-2xl" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[4/5] rounded-xl" />
              ))}
            </div>
          </div>
        ) : null}

        {!worldsQuery.isLoading &&
        !worldsQuery.isError &&
        worlds.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-border bg-surface-raised px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/10 text-gold">
              <LibraryBig className="size-6" aria-hidden />
            </div>
            <h2 className="mt-5 font-display text-3xl text-foreground">
              Your first world begins here.
            </h2>
            <p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">
              Give it a name, a voice, and an opening chapter. Lorebound will
              keep the manuscript and its memory together as it grows.
            </p>
            <Button asChild className="mt-7 gap-2">
              <Link to="/worlds/new">
                <Plus className="size-4" aria-hidden />
                Create your first world
              </Link>
            </Button>
          </section>
        ) : null}

        {!worldsQuery.isLoading && featured ? (
          <>
            <section className="mt-10">
              <FeaturedWorld world={featured} />
            </section>

            <section className="mt-20">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <SectionLabel>
                    {tab === "discover" ? "Worlds to discover" : "Your worlds"}
                  </SectionLabel>
                  <h2 className="mt-2 font-display text-3xl text-foreground">
                    Stories with somewhere to return to
                  </h2>
                </div>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {worlds.length} {worlds.length === 1 ? "world" : "worlds"}
                </p>
              </div>

              <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {worlds.map((world, index) => (
                  <WorldCard key={world.id} world={world} index={index} />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
