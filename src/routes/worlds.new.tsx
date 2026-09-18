import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/app/logo";
import { createWorld } from "@/services/worlds";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/worlds/new")({
  head: () => ({
    meta: [
      { title: "Create a new world — Lorebound" },
      {
        name: "description",
        content: "Name a world, set its voice, and add a first chapter.",
      },
      {
        property: "og:title",
        content: "Create a new world — Lorebound",
      },
      {
        property: "og:description",
        content: "Name a world, set its voice, and add a first chapter.",
      },
    ],
  }),
  component: NewWorldPage,
});

const GENRES = [
  "Epic Fantasy",
  "Literary Science Fiction",
  "Gothic Mystery",
  "Historical Fiction",
  "Contemporary Romance",
  "Horror",
];

const POVS = [
  "First person",
  "Third person limited",
  "Third person omniscient",
  "Second person",
];

const TENSES = ["Past", "Present"];

const steps = [
  { key: "name", title: "Name and genre", optional: false },
  { key: "description", title: "Description", optional: true },
  { key: "voice", title: "Point of view and tense", optional: true },
  { key: "rules", title: "World rules", optional: true },
  { key: "chapter", title: "First chapter", optional: true },
] as const;

function NewWorldPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: "",
    genre: "Epic Fantasy",
    description: "",
    pointOfView: "Third person limited",
    tense: "Past",
    rules: "",
    chapterTitle: "",
    chapterText: "",
  });

  const set =
    (key: keyof typeof form) =>
    (value: string): void => {
      setForm((currentForm) => ({
        ...currentForm,
        [key]: value,
      }));
    };

  const current = steps[step]!;
  const canAdvance = step !== 0 || form.title.trim().length > 1;
  const last = step === steps.length - 1;

  async function finish() {
    if (busy) {
      return;
    }

    const title = form.title.trim();

    if (title.length < 2) {
      toast.error("Please enter a world title.");
      setStep(0);
      return;
    }

    const rules = form.rules
      .split("\n")
      .map((rule) => rule.trim())
      .filter(Boolean);

    setBusy(true);

    try {
      await createWorld({
        title,
        genre: form.genre,
        description: form.description.trim(),
        pointOfView: form.pointOfView,
        tense: form.tense,
        rules,
        chapterTitle: form.chapterTitle.trim() || "Chapter One",
        chapterText: form.chapterText,
      });

      await queryClient.invalidateQueries({
        queryKey: ["worlds"],
      });

      toast.success(`${title} has been created.`);

      await navigate({
        to: "/worlds",
      });
    } catch (error) {
      console.error("Unable to create world:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Lorebound could not create your world.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="relative border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Logo to="/worlds" />

          <Button asChild variant="ghost" size="sm">
            <Link to="/worlds">Cancel</Link>
          </Button>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-5 py-12">
        <ol
          className="flex flex-wrap gap-x-5 gap-y-2"
          aria-label="Progress"
        >
          {steps.map((item, index) => (
            <li key={item.key} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[0.6rem]",
                  index < step
                    ? "border-gold/50 bg-gold/15 text-gold"
                    : index === step
                      ? "border-gold bg-gold text-background"
                      : "border-border text-muted-foreground",
                )}
              >
                {index < step ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>

              <span
                className={
                  index === step
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                {item.title}
              </span>
            </li>
          ))}
        </ol>

        <div key={current.key} className="animate-rise mt-10">
          <h1 className="font-display text-[2rem] leading-tight text-foreground">
            {current.key === "name" && "What is this world called?"}
            {current.key === "description" && "Describe it in a breath."}
            {current.key === "voice" && "How is it told?"}
            {current.key === "rules" && "What rules govern it?"}
            {current.key === "chapter" && "Add your first chapter."}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {current.optional
              ? "Optional — you can skip and set this later."
              : "Required."}
          </p>

          <div className="mt-8 space-y-5">
            {current.key === "name" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="title">World title</Label>

                  <Input
                    id="title"
                    autoFocus
                    value={form.title}
                    onChange={(event) => set("title")(event.target.value)}
                    placeholder="The Isles of Terra"
                    disabled={busy}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="genre">Genre</Label>

                  <Select
                    value={form.genre}
                    onValueChange={set("genre")}
                    disabled={busy}
                  >
                    <SelectTrigger id="genre">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {current.key === "description" && (
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>

                <Textarea
                  id="description"
                  rows={4}
                  autoFocus
                  value={form.description}
                  onChange={(event) => set("description")(event.target.value)}
                  placeholder="A hidden heir follows a foreign delegate through borrowed identities…"
                  disabled={busy}
                />
              </div>
            )}

            {current.key === "voice" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pov">Point of view</Label>

                  <Select
                    value={form.pointOfView}
                    onValueChange={set("pointOfView")}
                    disabled={busy}
                  >
                    <SelectTrigger id="pov">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {POVS.map((pointOfView) => (
                        <SelectItem key={pointOfView} value={pointOfView}>
                          {pointOfView}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tense">Tense</Label>

                  <Select
                    value={form.tense}
                    onValueChange={set("tense")}
                    disabled={busy}
                  >
                    <SelectTrigger id="tense">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {TENSES.map((tense) => (
                        <SelectItem key={tense} value={tense}>
                          {tense}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {current.key === "rules" && (
              <div className="space-y-1.5">
                <Label htmlFor="rules">World rules</Label>

                <Textarea
                  id="rules"
                  rows={5}
                  autoFocus
                  value={form.rules}
                  onChange={(event) => set("rules")(event.target.value)}
                  placeholder={
                    "One rule per line — e.g.\nEarth magic cannot be used offensively without cost.\nA broken vow marks the stone it was sworn on."
                  }
                  disabled={busy}
                />

                <p className="text-xs text-muted-foreground">
                  Lorebound will eventually check new chapters against these
                  rules and raise a finding when a scene contradicts one.
                </p>
              </div>
            )}

            {current.key === "chapter" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="chtitle">Chapter title</Label>

                  <Input
                    id="chtitle"
                    autoFocus
                    value={form.chapterTitle}
                    onChange={(event) =>
                      set("chapterTitle")(event.target.value)
                    }
                    placeholder="Chapter One"
                    disabled={busy}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="chtext">Opening text</Label>

                  <Textarea
                    id="chtext"
                    rows={7}
                    value={form.chapterText}
                    onChange={(event) =>
                      set("chapterText")(event.target.value)
                    }
                    placeholder="Paste or write the opening of your manuscript…"
                    className="font-display text-base leading-relaxed"
                    disabled={busy}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
              disabled={step === 0 || busy}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {current.optional && !last ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep((currentStep) => currentStep + 1)}
                  disabled={busy}
                >
                  Skip
                </Button>
              ) : null}

              {last ? (
                <Button onClick={finish} disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating world...
                    </>
                  ) : (
                    "Create World"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setStep((currentStep) => currentStep + 1)}
                  disabled={!canAdvance || busy}
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}