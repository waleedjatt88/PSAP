import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getToken, setToken } from "../lib/api";
import { signup, login, fetchMe, updateProfileRequest } from "../lib/authApi";

const UserCtx = createContext(null);

// Shape stored in context:
//   { id, email, name, classLevel, avatar, isVerified }
// Or null when signed out. `loading` is true until the stored JWT (if any)
// has been checked against /api/auth/me on first mount; guards should
// render a spinner while that's true.

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Called after signup verification issues a token, so the new session is
  // applied without a second round trip through /api/auth/login.
  const applySession = useCallback(({ token, user: sessionUser }) => {
    setToken(token);
    setUser(sessionUser);
  }, []);

  const signIn = async ({ email, password }) => {
    const data = await login({ email, password });
    applySession(data);
    return data;
  };

  const signUp = async ({ email, password, fullName, classLevel }) => {
    return signup({ email, password, fullName, classLevel });
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (patch) => {
    if (!user) throw new Error("Not signed in");
    const { user: updated } = await updateProfileRequest(patch);
    setUser(updated);
  };

  return (
    <UserCtx.Provider
      value={{ user, loading, signIn, signUp, signOut, updateProfile, applySession }}
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
