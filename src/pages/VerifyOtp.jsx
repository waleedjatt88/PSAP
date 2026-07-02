import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import OtpInput from "../components/OtpInput";
import { useUser } from "../store/user";
import { verifyOtp, resendOtp } from "../lib/authApi";

const RESEND_COOLDOWN = 30;

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { applySession } = useUser();

  const email = params.get("email") || "";
  const purpose = params.get("purpose") === "reset" ? "reset" : "signup";

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (!email) nav("/login", { replace: true });
  }, [email, nav]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const result = await verifyOtp({ email, otp, purpose });
      if (purpose === "reset") {
        nav("/reset-password", { state: { ticket: result.resetTicket, email }, replace: true });
        return;
      }
      // purpose === "signup" — verifying issues a session directly.
      applySession({ token: result.token, user: result.user });
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setError(null);
    setInfo(null);
    try {
      await resendOtp({ email, purpose });
      setInfo("A new code has been sent.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.message || "Could not resend code");
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        <>
          Enter the 6-digit code we sent to{" "}
          <span className="text-white font-medium">{email}</span>
        </>
      }
      footer={
        <>
          Didn't get the code?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="text-purple-300 font-semibold hover:text-white hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </>
      }
    >
      <form onSubmit={submit}>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Verification code
        </label>
        <OtpInput value={otp} onChange={setOtp} />

        {error && (
          <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {info && (
          <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || otp.length !== 6}
          className="w-full mt-6 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 shadow-lg transition-all"
        >
          {busy ? "Verifying…" : "Verify"}
        </button>

        <div className="text-center text-xs text-gray-400 mt-4">
          <Link to="/login" className="text-purple-300 font-semibold hover:text-white hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
