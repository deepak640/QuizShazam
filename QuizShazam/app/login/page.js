"use client";
import { useFormik } from "formik";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Cookies from "js-cookie";
import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import GoogleButton from "@/components/GoogleButton";
import { googleLogin, userLogin, validate2FALogin } from "@/lib/api";
import { useState } from "react";
import { IoEyeOutline, IoEyeOffOutline, IoFlashOutline, IoShieldCheckmarkOutline, IoArrowBackOutline } from "react-icons/io5";

export default function Login() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isRemember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // 2FA state
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async ({ values, method }) =>
      method === "google" ? await googleLogin(values) : await userLogin(values),
  });

  const { mutate: validateOTP, isPending: otpLoading } = useMutation({
    mutationFn: validate2FALogin,
  });

  const finishLogin = (data) => {
    Cookies.set("user", JSON.stringify(data), { expires: isRemember ? 30 : undefined });
    window.location.href = "/dashboard";
  };

  const onSuccess = (data) => {
    if (data.requiresTwoFactor) {
      setTempToken(data.tempToken);
      setTwoFARequired(true);
      return;
    }
    finishLogin(data);
  };
  const onError = (error) => messageApi.error(error.response?.data?.error || "Login failed");

  const SignInWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      mutate(
        { values: { email: user.email, username: user.displayName, photoURL: user.photoURL }, method: "google" },
        { onSuccess, onError }
      );
    } catch {}
  };

  const { handleChange, values, handleSubmit } = useFormik({
    initialValues: { email: "", password: "" },
    onSubmit: (vals) => mutate({ values: vals, method: "login" }, { onSuccess, onError }),
  });

  const handleOTPSubmit = (e) => {
    e.preventDefault();
    validateOTP(
      { tempToken, code: otpCode },
      {
        onSuccess: finishLogin,
        onError: (err) => messageApi.error(err.response?.data?.error || "Invalid code"),
      }
    );
  };

  return (
    <div className="min-h-[90vh] flex">
      {contextHolder}

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-800 to-indigo-600 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 70%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <IoFlashOutline className="text-white" size={24} />
            <span className="text-white font-bold text-xl">QuizShazam</span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            {twoFARequired ? "One more step!" : "Welcome back,"}
            <br />
            {twoFARequired ? "Verify it's you." : "Quiz Master!"}
          </h2>
          <p className="text-violet-200 text-base leading-relaxed">
            {twoFARequired
              ? "Enter the 6-digit code from your authenticator app to continue."
              : "Pick up where you left off. Your progress, stats, and quizzes are waiting for you."}
          </p>
          {!twoFARequired && (
            <div className="mt-8 flex gap-4">
              {["50+ Quizzes", "10K+ Players", "Instant Results"].map((label) => (
                <span key={label} className="text-xs text-violet-200 bg-white/10 px-3 py-1.5 rounded-full font-medium">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="text-violet-300 text-xs relative z-10">© 2025 QuizShazam</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md fade-up">

          {/* ── 2FA Step ── */}
          {twoFARequired ? (
            <div>
              <button onClick={() => { setTwoFARequired(false); setOtpCode(""); setTempToken(""); }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition">
                <IoArrowBackOutline size={16} /> Back to login
              </button>

              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-violet-100 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                  <IoShieldCheckmarkOutline size={22} className="text-violet-600 md:size-24" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Two-Factor Auth</h2>
                  <p className="text-slate-500 text-xs md:text-sm">Enter the code from your authenticator app</p>
                </div>
              </div>

              <form onSubmit={handleOTPSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2 md:mb-1.5 text-center sm:text-left">6-digit verification code</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" autoFocus
                    className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-4 text-2xl md:text-3xl font-mono tracking-[0.4em] md:tracking-[0.6em] text-center focus:ring-2 focus:ring-violet-300 focus:border-violet-300 focus:bg-white transition"
                  />
                  <p className="text-[10px] md:text-xs text-slate-400 mt-3 text-center leading-relaxed px-4">
                    Open Google Authenticator or Authy and enter the current code
                  </p>
                </div>
                <button type="submit" disabled={otpCode.length !== 6 || otpLoading}
                  className="w-full bg-gradient-to-r from-violet-700 to-indigo-500 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-200 text-sm">
                  {otpLoading ? "Verifying…" : "Verify & Sign In"}
                </button>
              </form>
            </div>

          ) : (
            /* ── Normal login step ── */
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-1">Sign In</h2>
                <p className="text-slate-500 text-sm">Enter your credentials to access your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email" name="email" value={values.email} onChange={handleChange}
                    required placeholder="you@example.com" autoComplete="off"
                    className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} name="password" value={values.password}
                      onChange={handleChange} required placeholder="••••••••" autoComplete="off"
                      className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 focus:bg-white transition"
                    />
                    <button type="button" onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={isRemember} onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-700" />
                    Remember me
                  </label>
                  <Link href="#" className="text-sm text-violet-700 hover:underline font-medium">Forgot password?</Link>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full bg-gradient-to-r from-violet-700 to-indigo-500 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-200 text-sm">
                  {isLoading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium">or continue with</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <GoogleButton handleClick={SignInWithGoogle} isLoading={isLoading} />
                <p className="text-center text-sm text-slate-500">
                  No account yet?{" "}
                  <Link href="/register" className="text-violet-700 font-semibold hover:underline">Create one</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
