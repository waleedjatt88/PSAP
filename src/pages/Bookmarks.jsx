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
        <h1 className="text-2xl font-extrabold text-ink-900">Bookmarks</h1>
        <p className="text-ink-500 text-sm">Lessons you saved to revisit later.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {items.map((b) => (
          <Link
            to="/lesson"
            key={b.title}
            className="bg-white rounded-2xl shadow-card p-5 hover:shadow-soft transition-shadow flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
              {b.emoji}
            </div>
            <div className="flex-1">
              <div className="font-bold text-ink-900">{b.title}</div>
              <div className="text-xs text-ink-500">{b.subject} · saved {b.added}</div>
            </div>
            <BookmarkIcon className="w-5 h-5 text-brand-orange fill-brand-orange" />
          </Link>
        ))}
      </div>
    </div>
  );
}
