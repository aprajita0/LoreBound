import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AccessMode } from "@/types/lorebound";

interface WorldModeValue {
  mode: AccessMode;
  readOnly: boolean;
  /** Base path for in-world links, e.g. "/worlds/terra" or "/demo/terra". */
  base: string;
  /**
   * Guards a mutating action. Returns true when the action may proceed;
   * in demo mode it opens the account prompt and returns false.
   */
  guard: (action?: () => void) => boolean;
}

const WorldModeContext = createContext<WorldModeValue>({
  mode: "authenticated",
  readOnly: false,
  base: "/worlds/terra",
  guard: () => true,
});

export function WorldModeProvider({
  mode,
  base,
  children,
}: {
  mode: AccessMode;
  base: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const readOnly = mode === "demo";

  const guard = useCallback(
    (action?: () => void) => {
      if (readOnly) {
        setOpen(true);
        return false;
      }
      action?.();
      return true;
    },
    [readOnly],
  );

  const value = useMemo(() => ({ mode, readOnly, base, guard }), [mode, readOnly, base, guard]);

  return (
    <WorldModeContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-gold/25 bg-surface">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <Lock className="size-4 text-gold" aria-hidden />
            </div>
            <DialogTitle className="font-display text-2xl">Build a world of your own</DialogTitle>
            <DialogDescription className="text-[0.95rem] leading-relaxed">
              You&rsquo;re exploring The Isles of Terra in demo mode. Create an account to upload a
              manuscript and begin mapping your own story.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button asChild>
              <Link to="/signup">Create Account</Link>
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Continue Exploring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorldModeContext.Provider>
  );
}

export const useWorldMode = () => useContext(WorldModeContext);

/** Builds an in-world href honouring demo vs authenticated base paths. */
export function useWorldPath() {
  const { base } = useWorldMode();
  return useCallback((sub: string) => (sub ? `${base}/${sub}` : base), [base]);
}
