import quizImg from "../assets/Quiz.png";

const badges = [
  { name: "First Lesson", desc: "Completed your very first lesson", emoji: "🎓", unlocked: true },
  { name: "Quick Learner", desc: "Finished 5 lessons in one day", emoji: "⚡", unlocked: true },
  { name: "Streak Master", desc: "Maintained a 7-day learning streak", emoji: "🔥", unlocked: false },
  { name: "Math Whiz", desc: "Score 90%+ on 3 Math quizzes", emoji: "📐", unlocked: true },
  { name: "Science Star", desc: "Master 5 Science topics", emoji: "🌟", unlocked: false },
  { name: "Top of the Class", desc: "Reach the top 10 on the leaderboard", emoji: "🏆", unlocked: false },
];

export default function Accomplishments() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl p-5 shadow-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">Accomplishments</h1>
          <p className="text-ink-500 text-sm">Earn badges as you complete lessons, quizzes, and streaks.</p>
        </div>
        <img src={quizImg} alt="" className="hidden md:block h-28 object-contain" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((b) => (
          <div
            key={b.name}
            className={`rounded-2xl shadow-card p-5 text-center bg-white ${
              !b.unlocked ? "opacity-50" : ""
            }`}
          >
            <div className="text-5xl mb-3">{b.emoji}</div>
            <div className="font-bold text-ink-900">{b.name}</div>
            <div className="text-xs text-ink-500 mt-1">{b.desc}</div>
            <div
              className={`mt-3 inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                b.unlocked
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-ink-100 text-ink-500"
              }`}
            >
              {b.unlocked ? "Unlocked" : "Locked"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
