import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { Logo } from "./logo";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-5 sm:px-8">
        <Logo />
        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Main">
          <Button asChild variant="ghost" size="sm">
            <Link to="/demo/terra">Explore Demo</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/about">About</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Begin a World</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Switch theme">
            {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-8">
        <Logo />
        <p className="font-display text-[0.95rem] italic">
          Every fact. Every secret. Exactly when it matters.
        </p>
        <div className="ml-auto flex gap-5">
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <Link to="/demo/terra" className="hover:text-foreground">
            Demo
          </Link>
          <Link to="/login" className="hover:text-foreground">
            Log in
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
