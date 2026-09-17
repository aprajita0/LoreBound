import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** Lorebound mark: a bound spine with a single star above it. */
export function LoreboundMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)} fill="none">
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M12 2.6v3.2M10.6 4.2h2.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7 9h1.6M7 12h1.6M15.4 9H17M15.4 12H17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function Logo({ to = "/", className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center gap-2 rounded-sm text-foreground transition-opacity hover:opacity-80",
        className,
      )}
    >
      <LoreboundMark className="size-5 text-gold" />
      <span className="font-display text-[1.15rem] tracking-[0.02em]">Lorebound</span>
    </Link>
  );
}
