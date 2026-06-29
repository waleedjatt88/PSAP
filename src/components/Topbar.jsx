import { SearchIcon } from "./icons";
import { useUser } from "../store/user";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onMenu }) {
  const { user, logout } = useUser();
  const nav = useNavigate();

  const initials = (user?.name || "S")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-ink-100 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 sticky top-0 z-20">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenu}
        className="lg:hidden w-10 h-10 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-700 shrink-0"
        aria-label="Open menu"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      <div className="relative flex-1 max-w-xl min-w-0">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          placeholder="Search lessons, topics…"
          className="w-full bg-ink-100/60 rounded-full text-sm pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-semibold text-ink-900 leading-tight">
            {user?.name || "Student"}
          </div>
          <div className="text-xs text-ink-500">{user?.classLevel || "JSS 1"}</div>
        </div>
        <button
          onClick={() => {
            logout();
            nav("/login");
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange text-white text-sm font-bold flex items-center justify-center shadow-card hover:opacity-90"
          title="Click to sign out"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
