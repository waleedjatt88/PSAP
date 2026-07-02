import { Link } from "react-router-dom";
import { BookmarkIcon } from "../components/icons";

const items = [
  { title: "Equivalent Fractions", subject: "Mathematics", added: "Yesterday", emoji: "📐" },
  { title: "Photosynthesis", subject: "Basic Science", added: "2 days ago", emoji: "🌱" },
  { title: "Parts of Speech", subject: "English Language", added: "Last week", emoji: "📚" },
  { title: "Map Reading", subject: "Social Studies", added: "Last week", emoji: "🌍" },
];

export default function Bookmarks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white font-display">Bookmarks</h1>
        <p className="text-gray-400 text-sm">Lessons you saved to revisit later.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {items.map((b) => (
          <Link
            to="/lesson"
            key={b.title}
            className="bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 hover:border-purple-500/30 transition-colors flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-2xl">
              {b.emoji}
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">{b.title}</div>
              <div className="text-xs text-gray-400">{b.subject} · saved {b.added}</div>
            </div>
            <BookmarkIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
