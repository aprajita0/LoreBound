import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  authService,
  mapSupabaseUser,
  type SignUpResult,
} from "@/services/auth";
import type { User } from "@/types/lorebound";

interface SessionValue {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | undefined>(
  undefined,
);

export function SessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const currentUser = await authService.getCurrentUser();

      if (mounted) {
        setUser(currentUser);
        setReady(true);
      }
    }

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setUser(
        session?.user ? mapSupabaseUser(session.user) : null,
      );

      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const authenticatedUser = await authService.login(
        email,
        password,
      );

      setUser(authenticatedUser);
      return authenticatedUser;
    },
    [],
  );

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ) => {
      const result = await authService.signup(
        name,
        email,
        password,
      );

      if (!result.requiresEmailConfirmation) {
        setUser(result.user);
      }

      return result;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      ready,
      signIn,
      signUp,
      signOut,
    }),
    [user, ready, signIn, signUp, signOut],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error(
      "useSession must be used inside SessionProvider.",
    );
  }

  return context;
}