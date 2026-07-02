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
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-[#070518] overflow-hidden">
      {/* Premium ambient glows — same treatment as the rest of the app */}
      <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Left visual */}
      <div className="hidden lg:flex flex-col p-12 relative overflow-hidden z-10">
        <div className="inline-block bg-white rounded-xl px-2 py-1 shadow-lg w-fit animate-fade-in">
          <Logo size={44} />
        </div>

        <div className="mt-8 max-w-md animate-[step-in_0.6s_ease-out_0.1s_both]">
          <h1 className="text-4xl font-extrabold leading-tight text-white font-display">
            Learn Smarter,
            <br />
            Achieve Greater
          </h1>
          <p className="text-gray-400 mt-3">
            Your tutor AI is here to guide you through every concept
          </p>
        </div>

        <div className="relative mt-6 flex-1 flex items-center justify-center">
          <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-72 rounded-full bg-purple-600/20 blur-3xl animate-[avatar-pulse_4s_ease-in-out_infinite]" />
          <img
            src={loginIllustration}
            alt="PassPoint AI tutor illustration"
            className="relative max-w-md w-full drop-shadow-2xl animate-[float_5s_ease-in-out_infinite]"
          />
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8 relative z-10">
        <form
          onSubmit={submit}
          className="w-full max-w-sm bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]"
        >
          <div className="lg:hidden mb-8 bg-white rounded-xl px-2 py-1 shadow-lg w-fit">
            <Logo />
          </div>
<<<<<<< HEAD
          <h2 className="text-3xl font-extrabold text-white font-display">Welcome Back</h2>
          <p className="text-sm text-gray-400 mt-1">Please login to your account</p>

          <label className="block text-sm font-medium text-gray-300 mt-8 mb-1.5">
=======
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
>>>>>>> cc94425ce9eeadef505b1847e8c5e4db6454c115
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
<<<<<<< HEAD
            placeholder="admin@mail.com"
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
=======
            placeholder="you@example.com"
            className="w-full border border-ink-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
>>>>>>> cc94425ce9eeadef505b1847e8c5e4db6454c115
            required
          />

          <label className="block text-sm font-medium text-gray-300 mt-4 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
              placeholder="Enter your password"
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
=======
              placeholder={isSignup ? "At least 6 characters" : "Enter your password"}
              minLength={6}
              className="w-full border border-ink-300 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
>>>>>>> cc94425ce9eeadef505b1847e8c5e4db6454c115
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

<<<<<<< HEAD
          <div className="text-right mt-2">
            <a className="text-xs font-medium text-purple-300 hover:text-white hover:underline" href="#">
              Forgot Password
            </a>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:brightness-110 text-white font-semibold rounded-lg py-2.5 shadow-lg transition-all"
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={googleLogin}
            className="w-full mt-3 border border-white/10 hover:bg-white/5 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="text-center text-xs text-gray-400 mt-6">
            Didn't have an Account?{" "}
            <a className="text-purple-300 font-semibold hover:text-white hover:underline" href="#">
              Sign-up
            </a>
=======
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
>>>>>>> cc94425ce9eeadef505b1847e8c5e4db6454c115
          </div>
        </form>
      </div>
    </div>
  );
}
