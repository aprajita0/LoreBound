import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { worldService } from "@/services/lorebound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/worlds/new")({
  head: () => ({
    meta: [
      { title: "Create a new world — Lorebound" },
      { name: "description", content: "Name a world, set its voice, and add a first chapter." },
      { property: "og:title", content: "Create a new world — Lorebound" },
      { property: "og:description", content: "Name a world, set its voice, and add a first chapter." },
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
const POVS = ["First person", "Third person limited", "Third person omniscient", "Second person"];
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

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const current = steps[step]!;
  const canAdvance = step !== 0 || form.title.trim().length > 1;
  const last = step === steps.length - 1;

  async function finish() {
    setBusy(true);
    try {
      await worldService.create({
        title: form.title.trim(),
        genre: form.genre,
        description: form.description,
        pointOfView: form.pointOfView,
        tense: form.tense,
      });
      toast.success(`${form.title.trim()} is ready. Add chapters when you're set.`);
      navigate({ to: "/worlds" });
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
        <ol className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[0.6rem]",
                  i < step
                    ? "border-gold/50 bg-gold/15 text-gold"
                    : i === step
                      ? "border-gold bg-gold text-background"
                      : "border-border text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              <span className={i === step ? "text-foreground" : "text-muted-foreground"}>
                {s.title}
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
            {current.optional ? "Optional — you can skip and set this later." : "Required."}
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
                    onChange={(e) => set("title")(e.target.value)}
                    placeholder="The Isles of Terra"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={form.genre} onValueChange={set("genre")}>
                    <SelectTrigger id="genre">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
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
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="A hidden heir follows a foreign delegate through borrowed identities…"
                />
              </div>
            )}

            {current.key === "voice" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pov">Point of view</Label>
                  <Select value={form.pointOfView} onValueChange={set("pointOfView")}>
                    <SelectTrigger id="pov">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POVS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tense">Tense</Label>
                  <Select value={form.tense} onValueChange={set("tense")}>
                    <SelectTrigger id="tense">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TENSES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
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
                  onChange={(e) => set("rules")(e.target.value)}
                  placeholder={"One rule per line — e.g.\nEarth magic cannot be used offensively without cost.\nA broken vow marks the stone it was sworn on."}
                />
                <p className="text-xs text-muted-foreground">
                  Lorebound checks new chapters against these rules and raises a finding when a
                  scene contradicts one.
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
                    onChange={(e) => set("chapterTitle")(e.target.value)}
                    placeholder="Chapter One"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chtext">Opening text</Label>
                  <Textarea
                    id="chtext"
                    rows={7}
                    value={form.chapterText}
                    onChange={(e) => set("chapterText")(e.target.value)}
                    placeholder="Paste or write the opening of your manuscript…"
                    className="font-display text-base leading-relaxed"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              {current.optional && !last ? (
                <Button variant="ghost" onClick={() => setStep((s) => s + 1)}>
                  Skip
                </Button>
              ) : null}
              {last ? (
                <Button onClick={finish} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create World
                </Button>
              ) : (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                  Continue <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
