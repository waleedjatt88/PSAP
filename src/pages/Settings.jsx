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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">Settings</h1>
        <p className="text-ink-500 text-sm">Manage your profile and preferences.</p>
      </div>

      <form onSubmit={save} className="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <div className="font-bold">Profile</div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Full Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full border border-ink-300 bg-ink-100/40 rounded-lg px-3 py-2 text-sm text-ink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Class Level
          </label>
          <select
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
          >
            {["Nursery 1", "Nursery 2", "Nursery 3",
              "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
              "JSS 1", "JSS 2", "JSS 3",
              "SS 1", "SS 2", "SS 3"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-60 text-white font-semibold rounded-lg px-5 py-2 text-sm"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      </form>

      <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <div className="font-bold">Preferences</div>
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

      <div className="bg-white rounded-2xl shadow-card p-6 space-y-3">
        <div className="font-bold">Subscription</div>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">Free Plan</div>
            <div className="text-xs text-ink-500">Limited lessons & 3 AI questions per day</div>
          </div>
          <button className="bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-semibold px-4 py-2 rounded-full">
            Upgrade to Pro
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
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-ink-500">{desc}</div>
      </div>
      <span
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
          checked ? "bg-brand-blue" : "bg-ink-300"
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
