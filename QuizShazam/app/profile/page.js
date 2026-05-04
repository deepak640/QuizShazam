"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { message, Modal } from "antd";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import Loader from "@/components/Loader";
import { getProfile, mailPasswordLink, userStats, updateProfile } from "@/lib/api";
import {
  IoArrowForward, IoTrophyOutline, IoBarChartOutline, IoBookOutline,
  IoSettingsOutline, IoCameraOutline, IoPersonOutline, IoCallOutline,
  IoInformationCircleOutline,
} from "react-icons/io5";

const BarChart = dynamic(() => import("@/components/BarChart"), { ssr: false });

function EditProfileModal({ profile, token, onClose }) {
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
      messageApi.success("Profile updated!");
      setTimeout(onClose, 800);
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
    <Modal open onCancel={onClose} footer={null} width={480} title={
      <div className="flex items-center gap-2 py-1">
        <IoPersonOutline size={18} className="text-violet-600" />
        <span className="font-semibold text-slate-800">Edit Profile</span>
      </div>
    }>
      {ctx}
      <div className="space-y-5 py-2">
        {/* Avatar upload */}
        <div className="flex justify-center">
          <div className="relative">
            <img src={preview} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-4 border-violet-100" />
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white shadow"
            >
              <IoCameraOutline size={14} />
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
            placeholder="Tell us about yourself…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold disabled:opacity-50 hover:from-violet-700 hover:to-indigo-700">
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Profile() {
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [editOpen, setEditOpen] = useState(false);

  const { data: userData, isLoading } = useQuery({ queryKey: ["profile", { token }], queryFn: getProfile });
  const { mutate: sendMail } = useMutation({ mutationFn: mailPasswordLink });
  const obj = { userid: userData?.profile._id };
  const { data: stats } = useQuery({
    queryKey: ["stats", { token, obj }],
    queryFn: userStats,
    enabled: !!userData?.profile._id,
  });

  if (isLoading) return <Loader />;
  const { profile, quizzes } = userData;

  const handleSendMail = () => {
    sendMail(
      { values: { email: profile.email }, token },
      {
        onSuccess: (d) => messageApi.success(d.message),
        onError: (e) => messageApi.error(e.response?.data?.error),
      }
    );
  };

  const bestScore = stats?.length ? Math.max(...stats.map((s) => s.score || 0)) : 0;
  const avgScore = stats?.length ? Math.round(stats.reduce((a, s) => a + (s.score || 0), 0) / stats.length) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {contextHolder}
      {editOpen && <EditProfileModal profile={profile} token={token} onClose={() => setEditOpen(false)} />}

      {/* Profile hero card */}
      <div className="relative bg-gradient-to-r from-violet-700 to-indigo-500 rounded-3xl p-8 overflow-hidden shadow-xl shadow-violet-200">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src={profile.photoURL} alt="profile"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-0.5">{profile.username}</h2>
              <p className="text-violet-200 text-sm">{profile.email}</p>
              {profile.bio && <p className="text-violet-100 text-xs mt-1 max-w-xs">{profile.bio}</p>}
              {profile.phone && (
                <p className="text-violet-200 text-xs mt-1 flex items-center gap-1">
                  <IoCallOutline size={12} /> {profile.phone}
                </p>
              )}
              <span className="inline-block mt-2 text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} completed
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
              <IoCameraOutline size={16} /> Edit Profile
            </button>
            <button onClick={() => router.push("/settings")}
              className="flex items-center gap-1.5 bg-white text-violet-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-violet-50 transition shadow-sm">
              <IoSettingsOutline size={16} /> Settings
            </button>
            {!profile.password && (
              <button onClick={handleSendMail}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition border border-white/20">
                Set Password
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <IoBookOutline size={20} />, label: "Quizzes Taken", value: quizzes.length, color: "text-violet-700 bg-violet-50" },
          { icon: <IoTrophyOutline size={20} />, label: "Best Score", value: bestScore, color: "text-amber-600 bg-amber-50" },
          { icon: <IoBarChartOutline size={20} />, label: "Avg. Score", value: avgScore, color: "text-indigo-600 bg-indigo-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quizzes taken */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-slate-800 text-lg">Completed Quizzes</h3>
          <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{quizzes.length} total</span>
        </div>
        {quizzes.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q, i) => (
              <button key={i} onClick={() => router.push(`/profile/quiz/${q._id}`)}
                className="card-lift group text-left border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-violet-200 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {q.title?.charAt(0) || "Q"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-700 text-sm truncate">{q.title}</h4>
                    <p className="text-slate-400 text-xs truncate">{q.description}</p>
                  </div>
                </div>
                <IoArrowForward className="text-slate-300 group-hover:text-violet-600 transition flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-slate-500 font-medium">No quizzes completed yet</p>
            <p className="text-slate-400 text-sm mt-1">Head to the dashboard to take your first quiz!</p>
          </div>
        )}
      </div>

      {/* Stats chart */}
      {stats?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-lg mb-5">Score History</h3>
          <BarChart userStats={stats} />
        </div>
      )}
    </div>
  );
}
