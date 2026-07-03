import { SearchIcon } from "./icons";
import { useUser } from "../store/user";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onMenu }) {
  const { user, signOut } = useUser();
  const nav = useNavigate();

  const initials = (user?.name || "S")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-[#0c0a21]/80 backdrop-blur-lg border-b border-white/10 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 sticky top-0 z-20">
      {/* Sidebar toggle — visible at every breakpoint */}
      <button
        onClick={onMenu}
        className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-300 shrink-0"
        aria-label="Toggle menu"
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
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          placeholder="Search lessons, topics…"
          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-full text-sm pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden sm:block text-right">
          <div className="text-sm font-semibold text-white leading-tight">
            {user?.name || "Student"}
          </div>
          <div className="text-xs text-gray-400">{user?.classLevel || "JSS 1"}</div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            nav("/login");
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center shadow-lg hover:brightness-110"
          title="Click to sign out"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
