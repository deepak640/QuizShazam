"use client";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IoArrowForward, IoCheckmarkCircle, IoArrowBack, IoSearchOutline, IoShareOutline } from "react-icons/io5";
import Loader from "@/components/Loader";
import { getQuizzes } from "@/lib/api";
import { useState } from "react";

const SUBJECT_THEMES = [
  { bg: "from-violet-600 to-indigo-500", light: "bg-violet-50", border: "border-violet-100", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  { bg: "from-blue-500 to-cyan-500", light: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  { bg: "from-emerald-500 to-teal-500", light: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  { bg: "from-amber-500 to-orange-500", light: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  { bg: "from-rose-500 to-pink-500", light: "bg-rose-50", border: "border-rose-100", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
  { bg: "from-fuchsia-500 to-violet-500", light: "bg-fuchsia-50", border: "border-fuchsia-100", text: "text-fuchsia-700", badge: "bg-fuchsia-100 text-fuchsia-700" },
];

const CARD_COLORS = ["from-violet-600 to-indigo-500", "from-indigo-500 to-cyan-500", "from-pink-500 to-rose-500", "from-emerald-500 to-teal-500", "from-orange-500 to-amber-500", "from-violet-700 to-indigo-600"];

export default function SubjectPage() {
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const params = useParams();
  const router = useRouter();
  const subject = decodeURIComponent(params.subject);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["quizzes", { token }],
    queryFn: getQuizzes,
  });

  if (isLoading) return <Loader />;
  const { quizzes, quizzesTaken } = data || {};
  const takenIds = quizzesTaken?.quizzesTaken || [];

  const subjectQuizzes = (quizzes || []).filter(
    (q) => (q.subject?.trim() || "General") === subject
  );

  const filtered = subjectQuizzes.filter(
    (q) =>
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.description?.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = subjectQuizzes.filter((q) => takenIds.includes(q._id)).length;
  const progress = subjectQuizzes.length ? Math.round((completedCount / subjectQuizzes.length) * 100) : 0;
  const totalQ = subjectQuizzes.reduce((s, q) => s + (q.questions?.length || 0), 0);

  // Pick theme based on subject initial
  const allSubjects = [...new Set((quizzes || []).map((q) => q.subject?.trim() || "General"))].sort((a, b) => {
    if (a === "General") return 1;
    if (b === "General") return -1;
    return a.localeCompare(b);
  });
  const subjectIdx = allSubjects.indexOf(subject);
  const theme = SUBJECT_THEMES[subjectIdx % SUBJECT_THEMES.length];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <IoArrowBack size={16} />
        Back to Quiz Library
      </button>

      {/* Hero */}
      <div className={`rounded-2xl bg-gradient-to-br ${theme.bg} p-6 sm:p-8 text-white shadow-lg mb-8`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Subject</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">{subject} Exams</h1>
            <p className="text-white/80 text-sm mb-4">
              {subjectQuizzes.length} test{subjectQuizzes.length !== 1 ? "s" : ""} · {totalQ} questions · {completedCount} completed
            </p>
            {/* Progress */}
            <div className="max-w-xs">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Progress</span>
                <span className="font-bold text-white">{progress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center ml-4 shrink-0">
            <span className="text-white font-extrabold text-2xl">{subject.charAt(0)}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search tests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition shadow-sm"
        />
      </div>

      {/* Section label */}
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
        {filtered.length} test{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Quiz cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium mb-1">
            {search ? `No results for "${search}"` : "No tests available"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((quiz, i) => {
            const isTaken = takenIds.includes(quiz._id);
            const colorClass = CARD_COLORS[i % CARD_COLORS.length];

            return (
              <div
                key={quiz._id}
                className={`group relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                  isTaken ? "border-slate-100 opacity-80" : "border-violet-50 card-lift"
                }`}
              >
                <div className={`hidden sm:block h-1.5 bg-gradient-to-r ${colorClass}`} />

                <div className="p-4 sm:p-6">
                  <div className="flex sm:flex-col gap-4 sm:gap-0">
                    <div className={`shrink-0 w-16 h-16 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-extrabold text-xl sm:text-base shadow-lg shadow-violet-200/50 sm:mb-4`}>
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1 sm:mb-2">
                        <div className="min-w-0 pr-2">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${theme.text} mb-0.5`}>{subject}</p>
                          <h5 className="font-bold text-slate-800 text-sm sm:text-base truncate leading-snug">
                            {quiz.title}
                          </h5>
                        </div>
                        {isTaken && <IoCheckmarkCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />}
                      </div>

                      <p className="text-slate-500 text-[11px] sm:text-sm mb-3 sm:mb-4 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                            {quiz.questions?.length || 0} Questions
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-[10px] sm:text-xs text-slate-400">
                            By {quiz.author?.split(" ")[0] || "Admin"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Share button */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              const url = `${window.location.origin}/dashboard/quiz/${quiz._id}`;
                              if (navigator.share) {
                                await navigator.share({ title: quiz.title, url }).catch(() => {});
                              } else {
                                await navigator.clipboard.writeText(url).catch(() => {});
                              }
                            }}
                            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 transition"
                            title="Share quiz"
                          >
                            <IoShareOutline size={14} />
                          </button>

                          {!isTaken ? (
                            <Link
                              href={`/dashboard/quiz/${quiz._id}`}
                              className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r ${colorClass} text-white transition-transform active:scale-95 shadow-md shadow-violet-200/50`}
                            >
                              <span className="hidden sm:inline text-xs font-bold mr-1">Start</span>
                              <IoArrowForward size={14} />
                            </Link>
                          ) : (
                            <Link
                              href={`/profile`}
                              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition"
                            >
                              View result
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isTaken && (
                  <div className="sm:hidden absolute top-0 right-0">
                    <div className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                      DONE
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
