import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function AuthLayout({
  title,
  lede,
  children,
  footer,
}: {
  title: string;
  lede: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex flex-col justify-center px-6 py-14 sm:px-12">
        <div className="relative mx-auto w-full max-w-sm">
          <Logo className="mb-10" />
          <h1 className="font-display text-3xl text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lede}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-border/60 lg:block">
        <img
          src="/covers/terra.jpg"
          alt=""
          aria-hidden
          width={1024}
          height={1344}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
        <figure className="absolute inset-x-0 bottom-0 p-10">
          <blockquote className="max-w-md font-display text-[1.5rem] leading-snug text-foreground">
            &ldquo;A vow broken in Terra does not vanish. It settles into the ground and waits to be
            stepped on.&rdquo;
          </blockquote>
          <figcaption className="mt-3 text-sm text-muted-foreground">
            The Isles of Terra · Chapter 24 ·{" "}
            <Link to="/demo/terra" className="text-gold underline-offset-4 hover:underline">
              explore this world
            </Link>
          </figcaption>
        </figure>
      </aside>
    </div>
  );
}
