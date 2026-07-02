import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { EyeIcon, GoogleIcon } from "../components/icons";
import { useUser } from "../store/user";
import loginIllustration from "../assets/Login.png";

export default function Login() {
  const { login } = useUser();
  const nav = useNavigate();
  const [email, setEmail] = useState("poojitha@passpoint.ai");
  const [password, setPassword] = useState("demo1234");
  const [showPw, setShowPw] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    login({
      name: email.split("@")[0].replace(/[^a-z]/gi, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Poojitha",
      email,
      classLevel: "JSS 1",
    });
    nav("/dashboard");
  };

  const googleLogin = () => {
    login({ name: "Poojitha", email: "poojitha.demo@gmail.com", classLevel: "JSS 1" });
    nav("/dashboard");
  };

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
          <h2 className="text-3xl font-extrabold text-white font-display">Welcome Back</h2>
          <p className="text-sm text-gray-400 mt-1">Please login to your account</p>

          <label className="block text-sm font-medium text-gray-300 mt-8 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mail.com"
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
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
              placeholder="Enter your password"
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
          </div>
        </form>
      </div>
    </div>
  );
}
