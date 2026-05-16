"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPublicProfile } from "@/lib/api";
import Loader from "@/components/Loader";
import {
  IoArrowBack, IoTrophyOutline, IoStarOutline, IoBarChartOutline,
  IoCalendarOutline, IoRibbonOutline, IoPersonOutline,
} from "react-icons/io5";

const BADGE_META = {
  first_quiz:    { icon: "🎯", label: "First Step",     color: "#7c3aed" },
  hat_trick:     { icon: "🎩", label: "Hat Trick",      color: "#6366f1" },
  quiz_master:   { icon: "🏆", label: "Quiz Master",    color: "#f59e0b" },
  veteran:       { icon: "⭐", label: "Veteran",        color: "#0ea5e9" },
  perfect_score: { icon: "💯", label: "Perfect Score",  color: "#10b981" },
  high_scorer:   { icon: "🔥", label: "High Scorer",    color: "#ef4444" },
  subject_expert:{ icon: "📚", label: "Subject Expert", color: "#8b5cf6" },
  daily_champion:{ icon: "☀️", label: "Daily Champion", color: "#f59e0b" },
  sharpshooter:  { icon: "🎖️", label: "Sharpshooter",  color: "#06b6d4" },
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 text-center shadow-sm">
      <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: color + "18" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}

function BadgeChip({ badge }) {
  const meta = BADGE_META[badge.id] || { icon: "🏅", label: badge.label, color: "#7c3aed" };
  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold"
      style={{ borderColor: meta.color + "30", background: meta.color + "10", color: meta.color }}
    >
      <span className="text-base leading-none">{meta.icon}</span>
      <span>{meta.label}</span>
    </div>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-profile", { username }],
    queryFn: getPublicProfile,
    retry: 1,
  });

  if (isLoading) return <Loader />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <IoPersonOutline className="text-slate-400" size={28} />
          </div>
          <p className="font-semibold text-slate-700">User not found</p>
          <p className="text-sm text-slate-400">@{username} doesn&apos;t exist or hasn&apos;t set a username yet.</p>
          <button onClick={() => router.back()} className="text-violet-600 text-sm font-medium hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const joinedDate = new Date(data.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const avatarUrl = data.photoURL?.startsWith("http")
    ? data.photoURL
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=7c3aed&color=fff&size=160&bold=true`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 transition font-medium"
        >
          <IoArrowBack size={16} /> Back
        </button>

        {/* Hero card */}
        <div className="bg-gradient-to-br from-violet-700 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-200 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10 flex items-center gap-5">
            <img
              src={avatarUrl}
              alt={data.username}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-extrabold">{data.username}</h1>
              {data.bio && <p className="text-violet-200 text-sm mt-1 max-w-xs">{data.bio}</p>}
              <div className="flex items-center gap-1.5 mt-2 text-violet-300 text-xs">
                <IoCalendarOutline size={12} />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={IoBarChartOutline} label="Quizzes"   value={data.totalQuizzes} color="#7c3aed" />
          <StatCard icon={IoStarOutline}     label="Avg Score" value={`${data.avgScore}%`} color="#f59e0b" />
          <StatCard icon={IoTrophyOutline}   label="Best"      value={`${data.bestScore}%`} color="#10b981" />
        </div>

        {/* Badges */}
        {data.badges?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <IoRibbonOutline size={15} className="text-violet-500" />
              Achievements · {data.badges.length}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.badges.map(b => <BadgeChip key={b.id} badge={b} />)}
            </div>
          </div>
        )}

        {data.badges?.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-8 text-center">
            <p className="text-slate-400 text-sm">No badges earned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
