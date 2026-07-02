import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { EyeIcon, CheckIcon } from "../components/icons";
import { resetPassword } from "../lib/authApi";

export default function ResetPassword() {
  const nav = useNavigate();
  const location = useLocation();
  const ticket = location.state?.ticket;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ticket) nav("/forgot-password", { replace: true });
  }, [ticket, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await resetPassword({ ticket, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not reset password");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You can now sign in with your new password.">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
            <CheckIcon className="w-7 h-7 text-emerald-400" />
          </div>
          <button
            onClick={() => nav("/login", { replace: true })}
            className="w-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:brightness-110 text-white font-semibold rounded-lg py-2.5 shadow-lg transition-all"
          >
            Go to sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Make it something you haven't used before."
      footer={
        <Link to="/login" className="text-purple-300 font-semibold hover:text-white hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit}>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">New password</label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            aria-label="Toggle password visibility"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-300 mt-4 mb-1.5">
          Confirm new password
        </label>
        <input
          type={showPw ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your new password"
          minLength={6}
          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
          required
        />

        {error && (
          <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full mt-6 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 shadow-lg transition-all"
        >
          {busy ? "Saving…" : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}
