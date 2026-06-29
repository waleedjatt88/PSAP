import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import {
  HomeIcon,
  BookIcon,
  ChartIcon,
  BookmarkIcon,
  TrophyIcon,
  SettingsIcon,
} from "./icons";
import promoImg from "../assets/girl.png";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/subjects", label: "Subjects", icon: BookIcon },
  { to: "/progress", label: "Progress", icon: ChartIcon },
  { to: "/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  { to: "/accomplishments", label: "Accomplishments", icon: TrophyIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-ink-100 flex flex-col">
      <div className="px-6 pt-6 pb-4">
        <Logo />
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-blue text-white shadow-card"
                  : "text-ink-700 hover:bg-ink-100",
              ].join(" ")
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 mb-6 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-blue-light text-white p-5 relative overflow-hidden">
        <div className="text-lg font-bold leading-tight relative z-10">
          Upgrade
          <br />
          To Pro
        </div>
        <p className="text-xs mt-1 text-white/80 max-w-[7.5rem] relative z-10">
          Get unlimited AI lessons & exam prep
        </p>
        <button className="mt-3 bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-semibold px-3 py-1.5 rounded-full relative z-10">
          Upgrade Today!
        </button>
        <img
          src={promoImg}
          alt=""
          className="absolute -right-2 -bottom-2 h-24 object-contain opacity-90 pointer-events-none"
        />
      </div>
    </aside>
  );
}
