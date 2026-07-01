import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const UserCtx = createContext(null);

// Shape stored in context:
//   { id, email, name, classLevel, avatar }   — merged auth + profile row
// Or null when signed out. `loading` is true until Supabase has hydrated the
// session on first mount; guards should render a spinner while that's true.

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, class_level, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();

    setUser({
      id: session.user.id,
      email: session.user.email,
      name: profile?.full_name || session.user.email?.split("@")[0] || "Student",
      classLevel: profile?.class_level || null,
      avatar: profile?.avatar_url || null,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      await applySession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      await applySession(session);
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, [applySession]);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async ({ email, password, fullName, classLevel }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          class_level: classLevel,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (patch) => {
    if (!user) throw new Error("Not signed in");
    const row = {
      full_name: patch.name ?? user.name,
      class_level: patch.classLevel ?? user.classLevel,
      avatar_url: patch.avatar ?? user.avatar,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").update(row).eq("id", user.id);
    if (error) throw error;
    setUser({ ...user, ...patch });
  };

  return (
    <UserCtx.Provider
      value={{ user, loading, signIn, signUp, signOut, updateProfile }}
    >
      {children}
    </UserCtx.Provider>
  );
}

export function useUser() {
  const v = useContext(UserCtx);
  if (!v) throw new Error("useUser must be used inside <UserProvider>");
  return v;
}
