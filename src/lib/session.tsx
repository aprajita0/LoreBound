import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/lorebound";
import type { User } from "@/types/lorebound";

interface SessionValue {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string) => Promise<User>;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  ready: false,
  signIn: async () => {
    throw new Error("no provider");
  },
  signUp: async () => {
    throw new Error("no provider");
  },
  signOut: () => {},
});

const STORAGE_KEY = "lorebound.session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as User);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      ready,
      signIn: async (email, password) => {
        const u = await authService.login(email, password);
        persist(u);
        return u;
      },
      signUp: async (name, email) => {
        const u = await authService.signup(name, email);
        persist(u);
        return u;
      },
      signOut: () => persist(null),
    }),
    [user, ready, persist],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
