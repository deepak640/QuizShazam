"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import {
  IoTrophyOutline, IoGlobeOutline, IoCalendarOutline,
  IoDocumentTextOutline, IoBookOutline, IoStarOutline,
  IoPeopleOutline, IoFlameOutline,
} from "react-icons/io5";
import {
  getGlobalLeaderboard, getWeeklyLeaderboard,
  getQuizLeaderboard, getSubjectLeaderboard,
  getLeaderboardSubjects, getLeaderboardQuizzes,
} from "@/lib/api";

const TABS = [
  { key: "global",  label: "Global",     Icon: IoGlobeOutline },
  { key: "weekly",  label: "Weekly",     Icon: IoCalendarOutline },
  { key: "quiz",    label: "By Quiz",    Icon: IoDocumentTextOutline },
  { key: "subject", label: "By Subject", Icon: IoBookOutline },
];

const RANK_STYLES = {
  1: { badge: "bg-yellow-400 text-yellow-900", bar: "bg-yellow-400", ring: "ring-4 ring-yellow-400 ring-offset-2", pillar: "bg-gradient-to-t from-violet-700 to-indigo-500", height: "h-32", label: "1st" },
  2: { badge: "bg-slate-300 text-slate-700",   bar: "bg-slate-400",  ring: "ring-4 ring-slate-300 ring-offset-2",  pillar: "bg-gradient-to-t from-slate-400 to-slate-300",   height: "h-20", label: "2nd" },
  3: { badge: "bg-amber-400 text-amber-900",   bar: "bg-amber-400",  ring: "ring-4 ring-amber-400 ring-offset-2",  pillar: "bg-gradient-to-t from-amber-500 to-amber-300",   height: "h-14", label: "3rd" },
};

function avatarUrl(user) {
  const name = user?.username || user?.email?.split("@")[0] || "?";
  if (user?.photoURL?.startsWith("http")) return user.photoURL;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=80&bold=true`;
}

function userName(user) {
  return user?.username || user?.email?.split("@")[0] || "Unknown";
}

// ─── Podium ──────────────────────────────────────────────────────────────────

function PodiumSlot({ entry, order }) {
  const isFirst = entry.rank === 1;
  const s = RANK_STYLES[entry.rank] || {};
  const score = entry.totalScore ?? entry.bestScore ?? 0;
  const name = userName(entry.user);

  return (
    <div className={`flex flex-col items-center gap-2 ${order === 0 ? "order-2" : order === 1 ? "order-1" : "order-3"}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${s.badge ?? "bg-slate-100 text-slate-500"}`}>
        {s.label}
      </span>
      <div className="relative">
        <img
          src={avatarUrl(entry.user)}
          alt={name}
          className={`object-cover rounded-2xl shadow-lg ${isFirst ? "w-16 h-16" : "w-12 h-12"} ${s.ring ?? ""}`}
          onError={e => { e.target.src = avatarUrl({ username: name }); }}
        />
        {isFirst && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <IoTrophyOutline className="w-5 h-5 text-yellow-400" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className={`text-xs font-bold truncate max-w-[80px] ${isFirst ? "text-slate-900" : "text-slate-600"}`}>{name}</p>
        <p className={`text-sm font-extrabold ${isFirst ? "text-violet-700" : "text-slate-500"}`}>{score} <span className="text-[10px] font-normal text-slate-400">pts</span></p>
      </div>
      <div className={`w-20 ${s.height ?? "h-10"} ${s.pillar ?? "bg-slate-200"} rounded-t-xl flex items-start justify-center pt-2.5 shadow-md`}>
        <span className="text-white/20 font-black text-2xl">{entry.rank}</span>
      </div>
    </div>
  );
}

function Podium({ rows }) {
  if (!rows || rows.length < 3) return null;
  const ordered = [rows[1], rows[0], rows[2]];
  return (
    <div className="flex items-end justify-center gap-5 pt-8 pb-0 px-4">
      {ordered.map((entry, i) => entry && <PodiumSlot key={entry._id} entry={entry} order={i} />)}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

// ─── Leader Row ───────────────────────────────────────────────────────────────

function LeaderRow({ entry, maxScore, isMe }) {
  const score = entry.totalScore ?? entry.bestScore ?? 0;
  const name = userName(entry.user);
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const s = RANK_STYLES[entry.rank];
  const sub = [
    entry.quizzesTaken != null && `${entry.quizzesTaken} quiz${entry.quizzesTaken !== 1 ? "zes" : ""}`,
    entry.attempts != null && `${entry.attempts} attempt${entry.attempts !== 1 ? "s" : ""}`,
    entry.avgScore != null && `avg ${entry.avgScore}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-150 group ${
      isMe ? "bg-violet-50 border border-violet-200" : "hover:bg-slate-50"
    }`}>
      <div className="w-8 shrink-0 flex items-center justify-center">
        {s ? (
          <span className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center ${s.badge}`}>{entry.rank}</span>
        ) : (
          <span className="text-sm font-bold text-slate-300 group-hover:text-slate-500 transition-colors w-full text-center">{entry.rank}</span>
        )}
      </div>

      <img
        src={avatarUrl(entry.user)}
        alt={name}
        className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm"
        onError={e => { e.target.src = avatarUrl({ username: name }); }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className={`text-sm font-semibold truncate ${isMe ? "text-violet-800" : "text-slate-800"}`}>{name}</p>
          <p className={`text-sm font-bold ml-4 shrink-0 ${isMe ? "text-violet-700" : "text-slate-900"}`}>{score} <span className="text-xs font-normal text-slate-400">pts</span></p>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${s?.bar ?? "bg-violet-400"}`} style={{ width: `${pct}%` }} />
        </div>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="p-4 space-y-2 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
          <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-100 rounded-full w-2/5" />
            <div className="h-1.5 bg-slate-100 rounded-full w-3/4" />
          </div>
          <div className="w-16 h-3 bg-slate-100 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

function Empty({ needsSelect }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        <IoTrophyOutline className="w-7 h-7 text-slate-200" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{needsSelect ? "Select an option to load rankings" : "No entries yet"}</p>
      <p className="text-xs text-slate-400">{needsSelect ? "" : "Complete a quiz to appear here"}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [tab, setTab] = useState("global");
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const rawUser = Cookies.get("user");
  const currentUserId = rawUser ? JSON.parse(rawUser)?.id : null;

  const { data: global, isLoading: lg }       = useQuery({ queryKey: ["lb-global"],   queryFn: getGlobalLeaderboard,  enabled: tab === "global",   staleTime: 60_000 });
  const { data: weekly, isLoading: lw }       = useQuery({ queryKey: ["lb-weekly"],   queryFn: getWeeklyLeaderboard,  enabled: tab === "weekly",   staleTime: 60_000 });
  const { data: quizzes }                      = useQuery({ queryKey: ["lb-quiz-list"], queryFn: getLeaderboardQuizzes, enabled: tab === "quiz",     staleTime: 300_000 });
  const { data: subjects }                     = useQuery({ queryKey: ["lb-subjects"], queryFn: getLeaderboardSubjects, enabled: tab === "subject",  staleTime: 300_000 });
  const { data: quizBoard, isLoading: lq }    = useQuery({ queryKey: ["lb-quiz", selectedQuiz],              queryFn: getQuizLeaderboard,    enabled: tab === "quiz" && !!selectedQuiz,      staleTime: 60_000 });
  const { data: subjectBoard, isLoading: ls } = useQuery({ queryKey: ["lb-subject", { subject: selectedSubject }], queryFn: getSubjectLeaderboard, enabled: tab === "subject" && !!selectedSubject, staleTime: 60_000 });

  const rows       = tab === "global" ? global : tab === "weekly" ? weekly : tab === "quiz" ? quizBoard : subjectBoard;
  const isLoading  = tab === "global" ? lg : tab === "weekly" ? lw : tab === "quiz" ? lq : ls;
  const needsSelect = (tab === "quiz" && !selectedQuiz) || (tab === "subject" && !selectedSubject);
  const maxScore   = rows?.length ? Math.max(...rows.map(r => r.totalScore ?? r.bestScore ?? 0)) : 1;
  const showPodium = (tab === "global" || tab === "weekly") && (rows?.length ?? 0) >= 3;
  const totalScore = rows?.reduce((s, r) => s + (r.totalScore ?? r.bestScore ?? 0), 0) ?? 0;
  const avgScore   = rows?.length ? Math.round(totalScore / rows.length) : 0;

  return (
    <div className="w-full px-6 py-8 space-y-6">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-700 to-violet-900 px-8 py-10 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 75% 40%, white 0%, transparent 55%)" }} />
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/5 border border-white/10" />
        <div className="absolute right-16 top-20 w-28 h-28 rounded-full bg-white/5 border border-white/10" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <IoTrophyOutline className="w-5 h-5 text-yellow-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-300">Rankings</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Leaderboard</h1>
            <p className="text-violet-300 text-sm mt-1.5">Compete. Improve. Top the charts.</p>
          </div>

          {rows?.length > 0 && (
            <div className="flex gap-6 lg:gap-10">
              {[
                { label: "Players",   val: rows.length,   icon: IoPeopleOutline },
                { label: "Top Score", val: `${maxScore}`, icon: IoStarOutline },
                { label: "Avg Score", val: `${avgScore}`, icon: IoFlameOutline },
              ].map(({ label, val, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center gap-1 text-violet-400 mb-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-widest">{label}</span>
                  </div>
                  <p className="text-2xl font-black">{val}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === key ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Selector ── */}
      {tab === "quiz" && (
        <select value={selectedQuiz} onChange={e => setSelectedQuiz(e.target.value)}
          className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition shadow-sm">
          <option value="">Select a quiz</option>
          {(quizzes || []).map(q => <option key={q._id} value={q._id}>{q.subject ? `${q.subject} · ` : ""}{q.title}</option>)}
        </select>
      )}
      {tab === "subject" && (
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
          className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition shadow-sm">
          <option value="">Select a subject</option>
          {(subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {tab === "weekly" && (
        <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
          <IoCalendarOutline size={14} />
          Rankings reset every Monday at midnight
        </div>
      )}

      {/* ── Main content ── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <Skeleton />
        </div>
      ) : needsSelect || !rows?.length ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Empty needsSelect={needsSelect} />
        </div>
      ) : (
        <div className={`gap-5 ${showPodium ? "grid grid-cols-1 lg:grid-cols-[340px_1fr]" : ""}`}>

          {/* Left — podium + stats */}
          {showPodium && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-b from-slate-50 to-white">
                  <Podium rows={rows} />
                  <div className="h-5" />
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 gap-3">
                <StatCard icon={IoPeopleOutline} label="Total Players"  value={rows.length}    color="bg-violet-50 text-violet-600" />
                <StatCard icon={IoStarOutline}   label="Top Score"      value={`${maxScore} pts`} color="bg-yellow-50 text-yellow-600" />
                <StatCard icon={IoFlameOutline}  label="Average Score"  value={`${avgScore} pts`} color="bg-orange-50 text-orange-500" />
              </div>
            </div>
          )}

          {/* Right — ranked list */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* List header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <p className="text-sm font-bold text-slate-700">Rankings</p>
              <span className="text-xs text-slate-400">{rows.length} player{rows.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="p-3 space-y-0.5">
              {rows.map(entry => (
                <LeaderRow
                  key={entry._id}
                  entry={entry}
                  maxScore={maxScore}
                  isMe={currentUserId && String(entry._id) === String(currentUserId)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
