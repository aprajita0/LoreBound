import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/session";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) {
      void navigate({
        to: "/login",
        replace: true,
      });
    }
  }, [navigate, ready, user]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-gold" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}