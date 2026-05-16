"use client";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import Link from "next/link";
import { IoSearchOutline, IoArrowForward, IoFlashOutline, IoCheckmarkCircle, IoShareOutline, IoTimeOutline } from "react-icons/io5";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { getQuizzes, getDailyChallenge } from "@/lib/api";
import dataNotFound from "@/public/dataNotFound.json";
import { useState, useEffect } from "react";

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

function DailyChallenge({ token }) {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-challenge", { token }],
    queryFn: getDailyChallenge,
    staleTime: 60_000,
  });
  const countdown = useCountdown(data?.nextReset);
  const [copied, setCopied] = useState(false);

  if (isLoading || !data?.quiz) return null;

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard/quiz/${data.quiz._id}`;
    if (navigator.share) {
      await navigator.share({ title: `Daily Challenge: ${data.quiz.title}`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 shadow-lg shadow-amber-200 text-white">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 90% 10%, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center shrink-0">
            <IoFlashOutline size={20} className="text-yellow-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Daily Challenge</span>
              {data.completedToday && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  <IoCheckmarkCircle size={10} /> Done
                </span>
              )}
            </div>
            <p className="font-extrabold text-base leading-snug">{data.quiz.title}</p>
            {data.quiz.subject && <p className="text-amber-200 text-xs">{data.quiz.subject}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {countdown && (
            <div className="flex items-center gap-1.5 text-xs font-bold bg-black/15 px-3 py-1.5 rounded-xl">
              <IoTimeOutline size={13} /> {countdown}
            </div>
          )}
          <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1.5 rounded-xl transition">
            <IoShareOutline size={13} /> {copied ? "Copied!" : "Share"}
          </button>
          {!data.completedToday && (
            <Link href={`/dashboard/quiz/${data.quiz._id}`}
              className="flex items-center gap-1.5 text-xs font-bold bg-white text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-xl transition">
              Start <IoArrowForward size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const SUBJECT_THEMES = [
  { bg: "from-violet-600 to-indigo-500", light: "bg-violet-50", border: "border-violet-100", text: "text-violet-700", badge: "bg-violet-100 text-violet-700", bar: "bg-violet-500" },
  { bg: "from-blue-500 to-cyan-500", light: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", bar: "bg-blue-500" },
  { bg: "from-emerald-500 to-teal-500", light: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  { bg: "from-amber-500 to-orange-500", light: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500" },
  { bg: "from-rose-500 to-pink-500", light: "bg-rose-50", border: "border-rose-100", text: "text-rose-700", badge: "bg-rose-100 text-rose-700", bar: "bg-rose-500" },
  { bg: "from-fuchsia-500 to-violet-500", light: "bg-fuchsia-50", border: "border-fuchsia-100", text: "text-fuchsia-700", badge: "bg-fuchsia-100 text-fuchsia-700", bar: "bg-fuchsia-500" },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const { data, isLoading } = useQuery({
    queryKey: ["quizzes", { token }],
    queryFn: getQuizzes,
  });

  if (isLoading) return <Loader />;
  const { quizzes, quizzesTaken } = data || {};

  if (!quizzes?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Lottie animationData={dataNotFound} style={{ width: 280 }} />
        <p className="text-slate-500 font-medium">No quizzes available yet</p>
      </div>
    );
  }

  const takenIds = quizzesTaken?.quizzesTaken || [];
  const takenCount = takenIds.length;

  // Group by subject
  const grouped = {};
  quizzes.forEach((q) => {
    const key = q.subject?.trim() || "General";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  });

  const subjects = Object.keys(grouped).sort((a, b) => {
    if (a === "General") return 1;
    if (b === "General") return -1;
    return a.localeCompare(b);
  });

  const filteredSubjects = subjects.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-violet-700 font-semibold uppercase tracking-widest text-xs mb-1">Explore</p>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-1">Quiz Library</h2>
        <p className="text-slate-500 text-sm">{subjects.length} subject{subjects.length !== 1 ? "s" : ""} · {quizzes.length} tests · {takenCount} completed</p>
      </div>

      {/* Daily Challenge */}
      <DailyChallenge token={token} />

      {/* Progress bar */}
      <div className="mb-8 bg-white rounded-2xl border border-violet-50 shadow-sm p-5 flex items-center gap-5">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">Overall progress</span>
            <span>{takenCount} / {quizzes.length} completed</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${quizzes.length ? (takenCount / quizzes.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-2xl font-extrabold gradient-text">
            {quizzes.length ? Math.round((takenCount / quizzes.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-400">done</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition shadow-sm"
        />
      </div>

      {/* Subject cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((subject, i) => {
          const subjectQuizzes = grouped[subject];
          const theme = SUBJECT_THEMES[i % SUBJECT_THEMES.length];
          const completedCount = subjectQuizzes.filter((q) => takenIds.includes(q._id)).length;
          const progress = subjectQuizzes.length ? Math.round((completedCount / subjectQuizzes.length) * 100) : 0;
          const totalQ = subjectQuizzes.reduce((s, q) => s + (q.questions?.length || 0), 0);

          return (
            <Link
              key={subject}
              href={`/dashboard/${encodeURIComponent(subject)}`}
              className="group block bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              {/* Top accent */}
              <div className={`h-1.5 bg-gradient-to-r ${theme.bg}`} />

              <div className="p-5">
                {/* Icon row */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.bg} flex items-center justify-center shadow-md`}>
                    <span className="text-white font-extrabold text-lg">{subject.charAt(0)}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${theme.badge}`}>
                    {subjectQuizzes.length} test{subjectQuizzes.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Subject name */}
                <h3 className={`text-base font-extrabold mb-0.5 group-hover:${theme.text} transition-colors text-slate-800`}>
                  {subject} Exams
                </h3>
                <p className="text-xs text-slate-500 mb-4">{totalQ} question{totalQ !== 1 ? "s" : ""} total</p>

                {/* Progress */}
                <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                  <span>{completedCount}/{subjectQuizzes.length} done</span>
                  <span className={`font-semibold ${theme.text}`}>{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full ${theme.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Test list preview */}
                <div className="space-y-1 mb-4">
                  {subjectQuizzes.slice(0, 3).map((q) => {
                    const done = takenIds.includes(q._id);
                    return (
                      <div key={q._id} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? "bg-emerald-400" : theme.bar}`} />
                        <span className={`truncate ${done ? "line-through text-slate-400" : ""}`}>{q.title}</span>
                        {done && <span className="text-emerald-500 shrink-0 text-[10px] font-semibold">Done</span>}
                      </div>
                    );
                  })}
                  {subjectQuizzes.length > 3 && (
                    <p className={`text-[11px] font-semibold ${theme.text} pl-3.5`}>+{subjectQuizzes.length - 3} more</p>
                  )}
                </div>

                {/* CTA */}
                <div className={`flex items-center justify-between pt-3 border-t ${theme.border}`}>
                  <span className="text-xs text-slate-400">
                    {completedCount === subjectQuizzes.length && subjectQuizzes.length > 0 ? "All completed!" : `${subjectQuizzes.length - completedCount} remaining`}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-bold ${theme.text} group-hover:gap-2 transition-all`}>
                    {completedCount === subjectQuizzes.length && subjectQuizzes.length > 0 ? "Review" : "Start"} <IoArrowForward size={13} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && search && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium mb-1">No results for &quot;{search}&quot;</p>
          <p className="text-sm">Try a different keyword</p>
        </div>
      )}
    </div>
  );
}
