import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Moon, Plus, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTheme } from "@/lib/theme";
import { Logo } from "./logo";
import { UserMenu } from "./world-shell";
import { projects } from "@/data/worlds";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "My Worlds", key: "mine" },
  { label: "Recent", key: "recent" },
  { label: "Discover", key: "discover" },
] as const;

export function LibraryHeader({
  tab,
  onTabChange,
}: {
  tab: string;
  onTabChange: (t: string) => void;
}) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-5 sm:px-8">
        <Logo to="/worlds" />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Library">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                tab === t.key
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="hidden gap-2 text-muted-foreground sm:flex"
          >
            <Search className="size-3.5" aria-hidden />
            Search
            <kbd className="ml-2 rounded border border-border px-1 font-mono text-[0.6rem]">⌘K</kbd>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-gold" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <p className="border-b border-border/60 px-4 py-2.5 font-display text-base">
                Notifications
              </p>
              <ul className="divide-y divide-border/50">
                <li className="px-4 py-3">
                  <p className="text-sm">Chapter 24 analysis produced 3 new findings.</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">2 hours ago</p>
                </li>
                <li className="px-4 py-3">
                  <p className="text-sm">Mira added as an identity of Omir.</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Today</p>
                </li>
              </ul>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Switch theme">
            {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
          <UserMenu />
          <Button asChild size="sm" className="ml-1 gap-1.5">
            <Link to="/worlds/new">
              <Plus className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Create New World</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search your worlds…" />
        <CommandList>
          <CommandEmpty>No worlds match that.</CommandEmpty>
          <CommandGroup heading="Worlds">
            {projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.title} ${p.genre}`}
                onSelect={() => {
                  setOpen(false);
                  if (p.slug === "terra") navigate({ to: "/worlds/terra" });
                }}
              >
                <span>
                  <span className="block text-foreground">{p.title}</span>
                  <span className="block text-xs text-muted-foreground">{p.genre}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
