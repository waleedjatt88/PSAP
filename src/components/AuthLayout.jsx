import Logo from "./Logo";
import loginIllustration from "../assets/Login.png";

// Shared shell for the auth screens that live outside Login.jsx (OTP
// verification, forgot/reset password) — mirrors Login.jsx's dark
// glassmorphism treatment (glow blobs + glass card + robot illustration)
// so they read as one continuous flow.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-[#070518] overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0" />

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

      <div className="flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-sm bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <div className="lg:hidden mb-8 bg-white rounded-xl px-2 py-1 shadow-lg w-fit">
            <Logo />
          </div>
          <h2 className="text-3xl font-extrabold text-white font-display">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="text-center text-xs text-gray-400 mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
