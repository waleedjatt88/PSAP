import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { EyeIcon } from "../components/icons";
import { useUser } from "../store/user";
import loginIllustration from "../assets/Login.png";

const CLASS_LEVELS = [
  "Nursery 1", "Nursery 2", "Nursery 3",
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3",
  "SS 1", "SS 2", "SS 3",
];

export default function Login() {
  const { signIn, signUp } = useUser();
  const nav = useNavigate();

  const [mode, setMode] = useState("signin");   // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [classLevel, setClassLevel] = useState("JSS 1");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        await signIn({ email, password });
        nav("/dashboard");
      } else {
        const { session } = await signUp({ email, password, fullName, classLevel });
        if (session) {
          // Email confirmation is off → straight in
          nav("/dashboard");
        } else {
          // Email confirmation is on → tell the user to check their inbox
          setInfo("Account created. Check your email to confirm your address before signing in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left visual */}
      <div className="hidden lg:flex flex-col p-12 bg-gradient-to-br from-blue-50 via-white to-orange-50 relative overflow-hidden">
        <Logo size={44} />
        <div className="mt-16 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight text-ink-900">
            Learn Smarter,
            <br />
            Achieve Greater
          </h1>
          <p className="text-ink-500 mt-3">
            Your tutor AI is here to guide you through every concept
          </p>
        </div>

        <div className="relative mt-12 flex-1 flex items-center justify-center">
          <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-72 rounded-full bg-blue-100/60 blur-2xl" />
          <img
            src={loginIllustration}
            alt="PassPoint AI tutor illustration"
            className="relative max-w-md w-full drop-shadow-xl"
          />
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <h2 className="text-3xl font-extrabold text-ink-900">
            {isSignup ? "Create your account" : "Welcome Back"}
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            {isSignup ? "Join Pass Point Learning Institute" : "Please login to your account"}
          </p>

          {isSignup && (
            <>
              <label className="block text-sm font-medium text-ink-700 mt-6 mb-1.5">
                Full name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adebayo John"
                className="w-full border border-ink-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
                required
              />

              <label className="block text-sm font-medium text-ink-700 mt-4 mb-1.5">
                Class level
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full border border-ink-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 bg-white"
              >
                {CLASS_LEVELS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </>
          )}

          <label className="block text-sm font-medium text-ink-700 mt-6 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-ink-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
            required
          />

          <label className="block text-sm font-medium text-ink-700 mt-4 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Enter your password"}
              minLength={6}
              className="w-full border border-ink-300 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700"
              aria-label="Toggle password visibility"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="mt-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-6 bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 shadow-card transition-colors"
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign In"}
          </button>

          <div className="text-center text-xs text-ink-500 mt-6">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? "signin" : "signup");
                setError(null);
                setInfo(null);
              }}
              className="text-brand-orange font-semibold hover:underline"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
