"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import Loader from "@/components/Loader";
import { getResult, getWeakTopics } from "@/lib/api";
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoTrophyOutline, IoTimeOutline, IoStarOutline, IoBookOutline, IoLinkOutline } from "react-icons/io5";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreBadge({ pct }) {
  if (pct >= 70) return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Excellent</span>;
  if (pct >= 40) return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Good effort</span>;
  return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">Keep practicing</span>;
}

export default function ResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const { data, isLoading } = useQuery({ queryKey: ["results", { id, token }], queryFn: getResult });
  const { data: topicsData } = useQuery({
    queryKey: ["weakTopics", { token }],
    queryFn: getWeakTopics,
    enabled: !!token,
  });

  if (isLoading) return <Loader />;
  const { answers, quiz, score } = data;
  const weakTopics = topicsData?.weakTopics ?? [];

  const total = answers.length;
  const isAnswerCorrect = (a) => {
    if (a.questionId.isMultiSelect) {
      const correctIndices = a.questionId.options.map((o, i) => o.isCorrect ? i : -1).filter(i => i !== -1);
      const selected = Array.isArray(a.selectedOptions) ? a.selectedOptions : [];
      return correctIndices.length > 0 &&
        correctIndices.every(i => selected.includes(i)) &&
        selected.every(i => correctIndices.includes(i));
    }
    const correctIdx = a.questionId.options.findIndex((o) => o.isCorrect);
    return a.selectedOption === correctIdx;
  };
  const correct = answers.filter(isAnswerCorrect).length;
  const wrong = total - correct;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const strokeDashoffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const ringColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#6366f1" : "#ef4444";
  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 fade-up">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 transition font-medium mb-6"
        >
          <IoArrowBack size={16} /> Back to profile
        </button>

        {/* Archived notice */}
        {quiz.isDeleted && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-amber-500 text-base mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">This quiz has been archived</p>
              <p className="text-xs text-amber-700 mt-0.5">The quiz is no longer active but your results and answers are preserved below.</p>
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* ── Left sidebar (sticky) ─────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-6">

            {/* Score card */}
            <div className="bg-gradient-to-br from-violet-700 to-indigo-600 rounded-3xl p-6 text-center relative overflow-hidden shadow-xl shadow-violet-200">
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "22px 22px" }}
              />
              <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-4 relative z-10">Your Score</p>

              {/* Ring */}
              <div className="relative inline-flex items-center justify-center mb-4 z-10">
                <svg width="136" height="136" className="-rotate-90">
                  <circle cx="68" cy="68" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                  <circle
                    cx="68" cy="68" r={RADIUS} fill="none"
                    stroke="white" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: "stroke-dashoffset 1.2s ease" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-4xl font-black text-white leading-none">{pct}%</p>
                  <p className="text-violet-300 text-xs mt-1 font-medium">accuracy</p>
                </div>
              </div>

              <h2 className="text-base font-bold text-white relative z-10 leading-snug mb-2">{quiz.title}</h2>
              <div className="relative z-10">
                <ScoreBadge pct={pct} />
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 text-center shadow-sm">
                <IoCheckmarkCircle className="text-emerald-500 mx-auto mb-1" size={22} />
                <p className="text-2xl font-black text-slate-800">{correct}</p>
                <p className="text-xs text-slate-400 font-medium">Correct</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 text-center shadow-sm">
                <IoCloseCircle className="text-red-400 mx-auto mb-1" size={22} />
                <p className="text-2xl font-black text-slate-800">{wrong}</p>
                <p className="text-xs text-slate-400 font-medium">Wrong</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 text-center shadow-sm">
                <IoTrophyOutline className="text-amber-400 mx-auto mb-1" size={22} />
                <p className="text-2xl font-black text-slate-800">{score}</p>
                <p className="text-xs text-slate-400 font-medium">Points</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 text-center shadow-sm">
                <IoStarOutline className="text-violet-500 mx-auto mb-1" size={22} />
                <p className="text-2xl font-black text-slate-800">{total}</p>
                <p className="text-xs text-slate-400 font-medium">Total Q&apos;s</p>
              </div>
            </div>

            {/* Accuracy bar */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-600">Accuracy</span>
                <span className="text-xs font-bold text-slate-800">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, backgroundColor: ringColor }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-emerald-600 font-medium">{correct} correct</span>
                <span className="text-[11px] text-red-400 font-medium">{wrong} wrong</span>
              </div>
            </div>

            {/* Weak topics */}
            {weakTopics.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <IoBookOutline size={13} className="text-violet-500" /> Your Weak Topics
                </p>
                <div className="space-y-2.5">
                  {weakTopics.slice(0, 5).map((t) => (
                    <div key={t.topic}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-medium text-slate-700 truncate">{t.topic}</span>
                        <span className={`text-[11px] font-bold ml-2 shrink-0 ${t.accuracy < 40 ? "text-red-500" : t.accuracy < 65 ? "text-amber-500" : "text-emerald-500"}`}>
                          {t.accuracy}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${t.accuracy < 40 ? "bg-red-400" : t.accuracy < 65 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${t.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── Right: Q&A review ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Mobile score strip */}
            <div className="lg:hidden bg-gradient-to-r from-violet-700 to-indigo-600 rounded-2xl p-4 mb-5 flex items-center gap-4 shadow-lg shadow-violet-200">
              <div className="relative shrink-0">
                <svg width="72" height="72" className="-rotate-90">
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 - (pct / 100) * 2 * Math.PI * 28}
                    style={{ transition: "stroke-dashoffset 1.2s ease" }}
                  />
                </svg>
                <p className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{pct}%</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{quiz.title}</p>
                <p className="text-violet-200 text-xs mt-0.5">{correct}/{total} correct · {score} pts</p>
                <div className="flex gap-3 mt-2">
                  <span className="text-emerald-300 text-xs font-semibold flex items-center gap-1"><IoCheckmarkCircle size={13} />{correct}</span>
                  <span className="text-red-300 text-xs font-semibold flex items-center gap-1"><IoCloseCircle size={13} />{wrong}</span>
                </div>
              </div>
            </div>

            {/* Section title */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Review Answers
                <span className="ml-2 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{total} questions</span>
              </h3>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Correct</span>
                <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Wrong</span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {answers.map((answer, i) => {
                const userCorrect = isAnswerCorrect(answer);
                const isMulti = answer.questionId.isMultiSelect;
                const selectedArr = Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [];

                return (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                    {/* Question header */}
                    <div className={`flex items-start gap-3 px-5 py-3.5 border-b ${userCorrect ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                      <span className={`mt-0.5 shrink-0 ${userCorrect ? "text-emerald-500" : "text-red-400"}`}>
                        {userCorrect ? <IoCheckmarkCircle size={18} /> : <IoCloseCircle size={18} />}
                      </span>
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm leading-snug flex-1">
                          <span className="text-slate-400 mr-1.5 font-normal">{i + 1}.</span>
                          {answer.questionId.questionText}
                        </p>
                        {isMulti && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                            ☑ Multi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options — 2-col grid on wide screens */}
                    <ul className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {answer.questionId.options.map((opt, j) => {
                        const isCorrect = opt.isCorrect;
                        const isUserAnswer = isMulti ? selectedArr.includes(j) : j === answer.selectedOption;
                        let cls = "border-slate-100 text-slate-600 bg-slate-50/50";
                        if (isCorrect && isUserAnswer) cls = "border-emerald-300 bg-emerald-50 text-emerald-700";
                        else if (isCorrect) cls = "border-emerald-200 bg-emerald-50/60 text-emerald-600";
                        else if (isUserAnswer) cls = "border-red-300 bg-red-50 text-red-600";

                        return (
                          <li key={j} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${cls}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect && isUserAnswer ? "bg-emerald-200 text-emerald-700"
                              : isCorrect ? "bg-emerald-100 text-emerald-600"
                              : isUserAnswer ? "bg-red-200 text-red-600"
                              : "bg-slate-200 text-slate-400"
                            }`}>
                              {LABELS[j]}
                            </span>
                            <span className="flex-1 leading-snug">{opt.text}</span>
                            {isCorrect && <IoCheckmarkCircle className="shrink-0 text-emerald-500" size={15} />}
                            {!isCorrect && isUserAnswer && <IoCloseCircle className="shrink-0 text-red-400" size={15} />}
                          </li>
                        );
                      })}
                    </ul>

                    {/* Explanation — only rendered when data exists */}
                    {answer.questionId.explanation && (
                      <div className="mx-4 mb-4 rounded-xl bg-violet-50 border border-violet-100 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-violet-700 mb-1.5">
                          <IoBookOutline size={13} /> Explanation
                        </p>
                        <p className="text-xs text-violet-800 leading-relaxed">{answer.questionId.explanation}</p>
                        {answer.questionId.referenceLink && (
                          <a
                            href={answer.questionId.referenceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-violet-600 hover:text-violet-800 transition"
                          >
                            <IoLinkOutline size={12} /> Learn more
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
