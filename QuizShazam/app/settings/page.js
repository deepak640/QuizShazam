"use client";
import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { message } from "antd";
import Loader from "@/components/Loader";
import {
  getProfile, updateProfile, mailPasswordLink,
  setup2FA, enable2FA, disable2FA,
} from "@/lib/api";
import {
  IoPersonOutline, IoShieldCheckmarkOutline, IoLockClosedOutline,
  IoCameraOutline, IoCheckmarkCircle, IoArrowBackOutline,
  IoQrCodeOutline, IoPhonePortraitOutline, IoAlertCircleOutline,
} from "react-icons/io5";

const TABS = [
  { key: "profile", label: "Profile", icon: IoPersonOutline },
  { key: "security", label: "Security & 2FA", icon: IoShieldCheckmarkOutline },
];

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ profile, token }) {
  const queryClient = useQueryClient();
  const [messageApi, ctx] = message.useMessage();
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [preview, setPreview] = useState(profile.photoURL || "");
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      messageApi.success("Profile updated successfully!");
    },
    onError: (e) => messageApi.error(e.response?.data?.error || "Update failed"),
  });

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.append("username", username);
    fd.append("bio", bio);
    fd.append("phone", phone);
    if (file) fd.append("photo", file);
    mutate({ values: fd, token });
  };

  return (
    <div className="space-y-6">
      {ctx}
      <div>
        <h2 className="text-base font-bold text-slate-800">Profile Information</h2>
        <p className="text-sm text-slate-500 mt-0.5">Update your name, photo, and personal details</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <img src={preview} alt="avatar"
            className="w-20 h-20 rounded-2xl object-cover border-4 border-violet-100 shadow" />
          <button onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-violet-700 transition">
            <IoCameraOutline size={15} />
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{profile.username}</p>
          <p className="text-xs text-slate-400">{profile.email}</p>
          <button onClick={() => inputRef.current?.click()}
            className="mt-1.5 text-xs text-violet-600 hover:underline font-medium">
            Change photo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
          <input value={profile.email} disabled
            className="w-full border border-slate-100 bg-slate-50 text-slate-400 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            placeholder="Tell us a little about yourself…"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={isPending}
          className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 shadow-sm shadow-violet-200 transition-all">
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab({ profile, token }) {
  const queryClient = useQueryClient();
  const [messageApi, ctx] = message.useMessage();

  // 2FA state machine: idle | setup | verify | done
  const [twoFAStep, setTwoFAStep] = useState("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(profile.twoFactorEnabled || false);

  const { mutate: sendMail, isPending: mailPending } = useMutation({
    mutationFn: mailPasswordLink,
    onSuccess: (d) => messageApi.success(d.message || "Reset link sent to your email"),
    onError: (e) => messageApi.error(e.response?.data?.error || "Failed to send email"),
  });

  const { mutate: runSetup2FA, isPending: setupPending } = useMutation({
    mutationFn: setup2FA,
    onSuccess: (d) => { setQrCode(d.qrCode); setSecret(d.secret); setTwoFAStep("verify"); },
    onError: (e) => messageApi.error(e.response?.data?.error || "Setup failed"),
  });

  const { mutate: runEnable2FA, isPending: enablePending } = useMutation({
    mutationFn: enable2FA,
    onSuccess: () => {
      messageApi.success("2FA enabled! Your account is now more secure.");
      setIs2FAEnabled(true);
      setTwoFAStep("done");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => messageApi.error(e.response?.data?.error || "Invalid code"),
  });

  const { mutate: runDisable2FA, isPending: disablePending } = useMutation({
    mutationFn: disable2FA,
    onSuccess: () => {
      messageApi.success("2FA has been disabled.");
      setIs2FAEnabled(false);
      setShowDisable(false);
      setDisableCode("");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => messageApi.error(e.response?.data?.error || "Invalid code"),
  });

  return (
    <div className="space-y-8">
      {ctx}

      {/* Password section */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <IoLockClosedOutline size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Password</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {profile.password ? "Change your current password via a reset link sent to your email." : "You signed in with Google. Set a password to enable email login."}
              </p>
            </div>
          </div>
          <button
            onClick={() => sendMail({ values: { email: profile.email }, token })}
            disabled={mailPending}
            className="w-full sm:w-auto shrink-0 px-4 py-2 text-xs font-semibold text-violet-700 bg-white border border-violet-200 rounded-xl hover:bg-violet-50 transition disabled:opacity-50 text-center"
          >
            {mailPending ? "Sending…" : profile.password ? "Change Password" : "Set Password"}
          </button>
        </div>
      </div>

      {/* 2FA section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Two-Factor Authentication
              {is2FAEnabled && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Enabled
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Add an extra layer of security using an authenticator app like Google Authenticator or Authy.
            </p>
          </div>
        </div>

        {/* ── Idle / disabled state ── */}
        {!is2FAEnabled && twoFAStep === "idle" && (
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <IoShieldCheckmarkOutline size={28} className="text-violet-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">2FA is not enabled</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              Protect your account by requiring a verification code when you log in.
            </p>
            <button
              onClick={() => runSetup2FA({ token })}
              disabled={setupPending}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition shadow-sm shadow-violet-200 disabled:opacity-50"
            >
              {setupPending ? "Generating…" : "Enable 2FA"}
            </button>
          </div>
        )}

        {/* ── QR / Verify step ── */}
        {twoFAStep === "verify" && (
          <div className="border border-violet-100 bg-violet-50/40 rounded-2xl p-4 md:p-6 space-y-6 md:space-y-5">
            <div className="flex items-start gap-3 p-3 md:p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl text-[10px] md:text-xs text-amber-700 leading-relaxed">
              <IoAlertCircleOutline size={16} className="shrink-0 mt-0.5" />
              <p>Scan the QR code below with <strong>Google Authenticator</strong> or <strong>Authy</strong>, then enter the 6-digit code to confirm.</p>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 md:gap-6">
              {/* QR */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 md:w-48 md:h-48 lg:w-40 lg:h-40" />
              </div>

              {/* Manual key + verify input */}
              <div className="flex-1 space-y-5 w-full">
                <div>
                  <p className="text-[10px] md:text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <IoQrCodeOutline size={13} /> Manual entry key
                  </p>
                  <code className="block bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 tracking-wider break-all text-center lg:text-left">
                    {secret}
                  </code>
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5 justify-center lg:justify-start">
                    <IoPhonePortraitOutline size={13} /> Enter 6-digit code from your app
                  </label>
                  <input
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl font-mono tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => { setTwoFAStep("idle"); setCode(""); }}
                    className="order-2 sm:order-1 flex-1 py-3 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition">
                    Cancel
                  </button>
                  <button
                    onClick={() => runEnable2FA({ values: { code }, token })}
                    disabled={code.length !== 6 || enablePending}
                    className="order-1 sm:order-2 flex-1 py-3 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-md shadow-violet-100"
                  >
                    {enablePending ? "Verifying…" : "Confirm & Enable"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Done / Enabled state ── */}
        {is2FAEnabled && (
          <div className="border border-emerald-100 bg-emerald-50/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <IoCheckmarkCircle size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">2FA is active</p>
                <p className="text-xs text-slate-500">Your account requires a verification code on each login.</p>
              </div>
            </div>

            {!showDisable ? (
              <button onClick={() => setShowDisable(true)}
                className="inline-block text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition">
                Disable 2FA
              </button>
            ) : (
              <div className="space-y-4 pt-1 max-w-sm">
                <p className="text-xs text-slate-600 leading-relaxed">Enter your current authenticator code to confirm disabling 2FA:</p>
                <input
                  value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xl font-mono tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex gap-2">
                  <button onClick={() => { setShowDisable(false); setDisableCode(""); }}
                    className="flex-1 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition">
                    Cancel
                  </button>
                  <button
                    onClick={() => runDisable2FA({ values: { code: disableCode }, token })}
                    disabled={disableCode.length !== 6 || disablePending}
                    className="flex-1 py-2.5 text-xs font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition shadow-sm"
                  >
                    {disablePending ? "Disabling…" : "Disable"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const router = useRouter();
  const [tab, setTab] = useState("profile");

  const { data: userData, isLoading } = useQuery({ queryKey: ["profile", { token }], queryFn: getProfile });

  if (isLoading) return <Loader />;
  const { profile } = userData;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push("/profile")}
          className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-500">
          <IoArrowBackOutline size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500">Manage your account preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 px-1 pt-1 gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl transition-all ${
                tab === key
                  ? "text-violet-700 bg-violet-50 border-b-2 border-violet-600"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "profile" && <ProfileTab profile={profile} token={token} />}
          {tab === "security" && <SecurityTab profile={profile} token={token} />}
        </div>
      </div>
    </div>
  );
}
