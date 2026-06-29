import { createContext, useContext, useState } from "react";

const UserCtx = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("pp_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (data) => {
    const next = {
      name: data.name || "Poojitha",
      email: data.email || "demo@passpoint.ai",
      classLevel: data.classLevel || "JSS 1",
      avatar: data.avatar || null,
    };
    localStorage.setItem("pp_user", JSON.stringify(next));
    setUser(next);
  };

  const logout = () => {
    localStorage.removeItem("pp_user");
    setUser(null);
  };

  return (
    <UserCtx.Provider value={{ user, login, logout }}>
      {children}
    </UserCtx.Provider>
  );
}

export function useUser() {
  const v = useContext(UserCtx);
  if (!v) throw new Error("useUser must be used inside <UserProvider>");
  return v;
}
