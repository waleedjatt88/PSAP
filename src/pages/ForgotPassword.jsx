import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { forgotPassword } from "../lib/authApi";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await forgotPassword({ email });
      nav(`/verify-otp?email=${encodeURIComponent(email)}&purpose=reset`);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a code to reset it."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="text-purple-300 font-semibold hover:text-white hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit}>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
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
          {busy ? "Sending…" : "Send reset code"}
        </button>
      </form>
    </AuthLayout>
  );
}
