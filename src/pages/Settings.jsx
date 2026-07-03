import { useState } from "react";
import { useUser } from "../store/user";

export default function Settings() {
  const { user, updateProfile } = useUser();
  const [name, setName] = useState(user?.name || "");
  const [classLevel, setClassLevel] = useState(user?.classLevel || "JSS 1");
  const [voiceOn, setVoiceOn] = useState(true);
  const [notifOn, setNotifOn] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name, classLevel });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white font-display">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your profile and preferences.</p>
      </div>

      <form onSubmit={save} className="bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="font-bold text-white">Profile</div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-white/10 bg-white/5 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              value={user?.email || ""}
              disabled
              className="w-full border border-white/10 bg-white/5 rounded-lg px-3 py-2 text-sm text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Class Level
            </label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 bg-white/5 text-white"
            >
              {["Nursery 1", "Nursery 2", "Nursery 3",
                "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
                "JSS 1", "JSS 2", "JSS 3",
                "SS 1", "SS 2", "SS 3"].map((c) => (
                <option key={c} className="bg-[#0c0a21] text-white">{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-tr from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2 text-sm shadow-lg"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      </form>

      <div className="bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="font-bold text-white">Preferences</div>
        <Toggle
          label="Voice lessons"
          desc="Read lessons aloud with the AI voice tutor"
          checked={voiceOn}
          onChange={setVoiceOn}
        />
        <Toggle
          label="Push notifications"
          desc="Daily reminders and learning streak alerts"
          checked={notifOn}
          onChange={setNotifOn}
        />
      </div>

      <div className="bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 space-y-3">
        <div className="font-bold text-white">Subscription</div>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium text-gray-200">Free Plan</div>
            <div className="text-xs text-gray-400">Limited lessons & 3 AI questions per day</div>
          </div>
          <button className="relative overflow-hidden text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            <span className="relative">Upgrade to Pro</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <div>
        <div className="text-sm font-medium text-gray-200">{label}</div>
        <div className="text-xs text-gray-400">{desc}</div>
      </div>
      <span
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
          checked ? "bg-purple-600" : "bg-white/15"
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}
