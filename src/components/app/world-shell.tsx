import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  Download,
  Eye,
  Feather,
  KeyRound,
  Landmark,
  Link2,
  LogOut,
  Lock,
  Menu,
  Moon,
  NotebookPen,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  Sun,
  Timer,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { Logo } from "./logo";
import { GlobalSearch } from "./global-search";
import { WorldModeProvider, useWorldMode } from "./world-mode";
import type { AccessMode } from "@/types/lorebound";

const navItems = [
  { sub: "", label: "World Overview", icon: Feather },
  { sub: "manuscript", label: "Manuscript", icon: BookOpen },
  { sub: "characters", label: "Characters", icon: Users },
  { sub: "relationships", label: "Relationships", icon: Link2 },
  { sub: "timeline", label: "Timeline", icon: Timer },
  { sub: "places", label: "Places", icon: Landmark },
  { sub: "lore", label: "Lore", icon: ScrollText },
  { sub: "secrets", label: "Secrets", icon: KeyRound },
  { sub: "knowledge", label: "Knowledge", icon: Eye },
  { sub: "continuity", label: "Continuity", icon: ShieldAlert },
  { sub: "notes", label: "Notes", icon: NotebookPen },
];

const notifications = [
  { id: 1, text: "Chapter 24 analysis produced 3 new findings.", when: "2 hours ago" },
  { id: 2, text: "Mira recorded as an identity of Omir Igwe.", when: "Today" },
  { id: 3, text: "Lynx's true species updated to Griffin.", when: "Yesterday" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Switch theme">
          {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Dark theme" : "Light theme"}</TooltipContent>
    </Tooltip>
  );
}

function Notifications() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-gold" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border/60 px-4 py-2.5 font-display text-base">Notifications</p>
        <ul className="divide-y divide-border/50">
          {notifications.map((n) => (
            <li key={n.id} className="px-4 py-3">
              <p className="text-sm text-foreground">{n.text}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.when}</p>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function UserMenu() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <span className="flex size-7 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-[0.65rem] font-medium text-gold">
            {user?.initials ?? "LB"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <span className="block text-sm">{user?.name ?? "Guest reader"}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {user?.email ?? "Exploring in demo mode"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/worlds">My Worlds</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/worlds/terra/settings">World Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" /> Log out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link to="/login">Log in</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DemoBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-default gap-1.5 border-gold/40 bg-gold/10 py-1 text-gold"
        >
          <Lock className="size-3" aria-hidden />
          Demo World
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        You can explore every part of this world. Editing and permanent changes require an account.
      </TooltipContent>
    </Tooltip>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { base, readOnly, guard } = useWorldMode();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex h-full flex-col" aria-label="World sections">
      <ul className="flex-1 space-y-0.5 p-2">
        {navItems.map((item) => {
          const href = item.sub ? `${base}/${item.sub}` : base;
          const active = item.sub
            ? pathname.startsWith(href)
            : pathname === base || pathname === `${base}/`;
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                to={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-foreground shadow-[inset_2px_0_0_0_var(--color-gold)]"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="space-y-0.5 border-t border-border/60 p-2">
        {[
          { label: "Import", icon: Upload },
          { label: "Export", icon: Download },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => guard()}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {readOnly ? <Lock className="ml-auto size-3 opacity-60" aria-hidden /> : null}
          </button>
        ))}
        {readOnly ? (
          <button
            onClick={() => guard()}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <Settings className="size-4" aria-hidden />
            World Settings
            <Lock className="ml-auto size-3 opacity-60" aria-hidden />
          </button>
        ) : (
          <Link
            to={`${base}/settings` as never}
            onClick={onNavigate}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <Settings className="size-4" aria-hidden />
            World Settings
          </Link>
        )}
      </div>
    </nav>
  );
}

function Shell({ worldTitle, children }: { worldTitle: string; children: ReactNode }) {
  const { readOnly } = useWorldMode();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/70 bg-background/90 px-3 backdrop-blur-sm sm:px-4">
        <Sheet open={mobileNav} onOpenChange={setMobileNav}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open world navigation">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="px-4 pt-4 font-display text-lg">{worldTitle}</SheetTitle>
            <NavList onNavigate={() => setMobileNav(false)} />
          </SheetContent>
        </Sheet>

        <Logo to="/worlds" className="shrink-0" />
        <span className="hidden text-border sm:inline" aria-hidden>
          /
        </span>
        <span className="hidden min-w-0 truncate font-display text-[1.05rem] text-foreground sm:block">
          {worldTitle}
        </span>
        {readOnly ? (
          <span className="ml-1 hidden sm:block">
            <DemoBadge />
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="hidden gap-2 text-muted-foreground sm:flex"
          >
            <Search className="size-3.5" aria-hidden />
            Search This World
            <kbd className="ml-2 rounded border border-border px-1 font-mono text-[0.6rem]">⌘K</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Search this world"
          >
            <Search className="size-4" />
          </Button>
          <Notifications />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-border/70 bg-sidebar transition-[width] duration-300 lg:block",
            collapsed ? "w-[3.75rem]" : "w-60",
          )}

        >
          <div className={cn("h-full", collapsed && "[&_span]:hidden [&_kbd]:hidden")}>
            <NavList />
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="absolute -right-3 top-5 flex size-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <ChevronLeft className={cn("size-3 transition-transform", collapsed && "rotate-180")} />
          </button>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

export function WorldShell({
  mode,
  base,
  worldTitle,
  children,
}: {
  mode: AccessMode;
  base: string;
  worldTitle: string;
  children: ReactNode;
}) {
  return (
    <WorldModeProvider mode={mode} base={base}>
      <Shell worldTitle={worldTitle}>{children}</Shell>
    </WorldModeProvider>
  );
}
