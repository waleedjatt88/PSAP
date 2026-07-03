import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import {
  HomeIcon,
  BookIcon,
  ChartIcon,
  BookmarkIcon,
  TrophyIcon,
  SettingsIcon,
  CheckIcon,
} from "./icons";
import promoImg from "../assets/girl.png";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/subjects", label: "Subjects", icon: BookIcon },
  { to: "/homework", label: "Mark Homework", icon: CheckIcon },
  { to: "/progress", label: "Progress", icon: ChartIcon },
  { to: "/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  { to: "/accomplishments", label: "Accomplishments", icon: TrophyIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

// Sidebar — slide-in drawer on mobile, collapsible icon-rail on desktop.
// `open = false` slides the drawer off-screen on mobile, but on desktop it
// just collapses to icons only (labels appear as a hover tooltip instead).
export default function Sidebar({ open = false, onClose }) {
  // Clicking a nav link should only auto-close the drawer on mobile —
  // on desktop the sidebar stays open (or collapsed) while navigating.
  function handleNavClick() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) onClose?.();
  }

  return (
    <aside
      className={[
        "bg-[#0c0a21]/70 backdrop-blur-xl border-r border-white/10 flex flex-col",
        // Fixed on all breakpoints so it never scrolls with the page
        "fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "w-[17rem]",
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        // Desktop: never slide off-screen, collapse the width instead
        "lg:translate-x-0",
        open ? "lg:w-64" : "lg:w-20",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center px-4 lg:px-6 pt-4 lg:pt-6 pb-4 overflow-hidden",
          open ? "justify-start" : "justify-center",
        ].join(" ")}
      >
        <div className="bg-white rounded-xl px-2 py-1 shadow-lg shrink-0">
          <Logo withText={open} size={30} />
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              [
                "group relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors duration-200",
                open ? "" : "lg:justify-center lg:px-0",
                isActive
                  ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-white shadow-lg shadow-purple-950/40 font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent",
              ].join(" ")
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span
              className={[
                "overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ml-3 max-w-[10rem] opacity-100",
                open ? "" : "lg:ml-0 lg:max-w-0 lg:opacity-0",
              ].join(" ")}
            >
              {label}
            </span>

            {/* Hover tooltip — only reachable when collapsed on desktop */}
            <span
              className={[
                "pointer-events-none hidden lg:block absolute left-full ml-3 whitespace-nowrap",
                "bg-[#15122c] border border-white/10 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl z-50",
                "opacity-0 -translate-x-1 transition-all duration-150",
                open ? "" : "group-hover:opacity-100 group-hover:translate-x-0",
              ].join(" ")}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div
        className={[
          "mx-3 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] max-h-64 opacity-100 mb-6 mt-3",
          open ? "" : "lg:max-h-0 lg:opacity-0 lg:mb-0 lg:mt-0",
        ].join(" ")}
      >
        <div className="rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/20 text-white p-5 relative overflow-hidden shadow-lg shadow-purple-950/30">
          <div className="text-lg font-bold leading-tight relative z-10 font-display">
            Upgrade
            <br />
            To Pro
          </div>
          <p className="text-xs mt-1 text-white/70 max-w-[7.5rem] relative z-10">
            Get unlimited AI lessons & exam prep
          </p>
          <button className="mt-3 relative z-10 overflow-hidden rounded-full text-white text-xs font-semibold px-3 py-1.5">
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            <span className="relative">Upgrade Today!</span>
          </button>
          <img
            src={promoImg}
            alt=""
            className="absolute -right-2 -bottom-2 h-24 object-contain opacity-90 pointer-events-none"
          />
        </div>
      </div>
    </aside>
  );
}
