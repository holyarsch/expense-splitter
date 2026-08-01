import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { UserSummary } from "@/types";

interface AuthState {
  user: UserSummary | null;
  isGuest: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const GUEST_FLAG = "guest:active";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem(GUEST_FLAG) === "1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guest mode never touches the network — skip the /me check entirely.
    if (isGuest) {
      setLoading(false);
      return;
    }
    api
      .get<UserSummary>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [isGuest]);

  async function login(identifier: string, password: string) {
    const u = await api.post<UserSummary>("/auth/login", { identifier, password });
    setUser(u);
    setIsGuest(false);
    localStorage.removeItem(GUEST_FLAG);
  }

  async function signup(username: string, email: string, password: string) {
    const u = await api.post<UserSummary>("/auth/signup", { username, email, password });
    setUser(u);
    setIsGuest(false);
    localStorage.removeItem(GUEST_FLAG);
  }

  async function logout() {
    if (!isGuest) {
      try {
        await api.post("/auth/logout");
      } catch {
        /* ignore */
      }
    }
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem(GUEST_FLAG);
  }

  function continueAsGuest() {
    localStorage.setItem(GUEST_FLAG, "1");
    setIsGuest(true);
    setUser(null);
  }

  function exitGuest() {
    localStorage.removeItem(GUEST_FLAG);
    setIsGuest(false);
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, login, signup, logout, continueAsGuest, exitGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
