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
          <h2 className="text-3xl font-extrabold text-ink-900">Welcome Back</h2>
          <p className="text-sm text-ink-500 mt-1">Please login to your account</p>

          <label className="block text-sm font-medium text-ink-700 mt-8 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mail.com"
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
              placeholder="Enter your password"
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

          <div className="text-right mt-2">
            <a className="text-xs font-medium text-brand-orange hover:underline" href="#">
              Forgot Password
            </a>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold rounded-lg py-2.5 shadow-card transition-colors"
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={googleLogin}
            className="w-full mt-3 border border-ink-300 hover:bg-ink-100/60 rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 text-sm"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="text-center text-xs text-ink-500 mt-6">
            Didn't have an Account?{" "}
            <a className="text-brand-orange font-semibold hover:underline" href="#">
              Sign-up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

