import type { ReactNode } from "react";
import { AlertTriangle, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { EvidenceReference } from "@/types/lorebound";

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4 pb-6", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-gold-soft">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">{title}</h1>
        {lede ? (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{lede}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <As
      className={cn(
        "rounded-lg border border-border/70 bg-surface/80 shadow-[0_1px_0_0_color-mix(in_oklch,var(--color-gold)_8%,transparent)]",
        className,
      )}
    >
      {children}
    </As>
  );
}

export function PanelTitle({
  children,
  hint,
  action,
}: {
  children: ReactNode;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 px-5 py-3.5">
      <div>
        <h2 className="font-display text-lg text-foreground">{children}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </p>
  );
}

export function EvidenceQuote({
  evidence,
  label,
  tone = "default",
  className,
}: {
  evidence?: EvidenceReference | undefined;
  label?: string | undefined;
  tone?: "default" | "earlier" | undefined;
  className?: string | undefined;
}) {
  if (!evidence) return null;
  return (
    <figure
      className={cn(
        "rounded-md border-l-2 bg-background/50 py-3 pl-4 pr-4",
        tone === "earlier" ? "border-l-mist/60" : "border-l-gold/60",
        className,
      )}
    >
      {label ? (
        <figcaption className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Quote className="size-3" aria-hidden />
          {label}
        </figcaption>
      ) : null}
      <blockquote className="font-display text-[1.05rem] leading-relaxed text-foreground/90">
        &ldquo;{evidence.passage}&rdquo;
      </blockquote>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        {evidence.locationInChapter} · {evidence.chapterTitle}
      </figcaption>
    </figure>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <p className="font-display text-lg text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3.5"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <div>
        <p className="text-sm font-medium text-foreground">Something didn&rsquo;t load</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>
        {retry ? (
          <button
            onClick={retry}
            className="mt-2 text-sm font-medium text-gold underline underline-offset-4"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/60 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-2.5 h-3 w-4/5" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function StatPair({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
