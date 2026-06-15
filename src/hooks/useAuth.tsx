import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "pass" | "lass" | "college" | "lycee" | "medical_student" | "lyceen" | "prepa_du_peuple";

const ADMIN_EMAIL = "hello.tonagentia@gmail.com";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

async function fetchRole(userId: string): Promise<AppRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as AppRole) ?? "pass";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      try {
        if (session?.user) {
          const r = await fetchRole(session.user.id);
          if (mounted) setRole(r);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });

    // 2. Listen for auth changes (don't do async work inside the callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use setTimeout to avoid calling Supabase inside the listener
        setTimeout(async () => {
          if (!mounted) return;
          try {
            const r = await fetchRole(session.user.id);
            if (mounted) setRole(r);
          } finally {
            if (mounted) setLoading(false);
          }
        }, 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, session, role, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Access helpers
export function canAccessTC(role: AppRole | null): boolean {
  return role === "pass" || role === "medical_student";
}

export function canAccessExamsKhollesAnnales(role: AppRole | null): boolean {
  return role === "pass" || role === "lass" || role === "medical_student";
}
