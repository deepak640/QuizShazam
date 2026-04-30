"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import Loader from "@/components/Loader";
import { getResult } from "@/lib/api";
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const { data, isLoading } = useQuery({ queryKey: ["results", { id, token }], queryFn: getResult });

  if (isLoading) return <Loader />;
  const { answers, quiz, score } = data;

  const total = answers.length;
  const correct = answers.filter((a) => {
    const correctIdx = a.questionId.options.findIndex((o) => o.isCorrect);
    return a.selectedOption === correctIdx;
  }).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const strokeDashoffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const scoreColor = pct >= 70 ? "#10b981" : pct >= 40 ? "#3b82f6" : "#ef4444";
  const scoreLabel = pct >= 70 ? "Excellent!" : pct >= 40 ? "Good effort!" : "Keep practicing!";

  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 fade-up">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 transition font-medium mb-8"
      >
        <IoArrowBack size={16} /> Back to profile
      </button>

      {/* Score hero */}
      <div className="bg-gradient-to-br from-violet-700 to-indigo-500 rounded-3xl p-8 text-center mb-8 relative overflow-hidden shadow-xl shadow-violet-200">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <h1 className="text-2xl font-extrabold text-white mb-6 relative z-10">{quiz.title}</h1>

        {/* Circular score */}
        <div className="relative inline-flex items-center justify-center mb-4 z-10">
          <svg width="120" height="120" className="-rotate-90">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={RADIUS} fill="none"
              stroke="white" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-3xl font-extrabold text-white">{pct}%</p>
          </div>
        </div>

        <p className="text-2xl font-extrabold text-white relative z-10">{scoreLabel}</p>
        <p className="text-violet-200 mt-1 relative z-10">
          {correct} / {total} correct · Score: <span className="font-bold text-white">{score}</span>
        </p>

        {/* Mini breakdown */}
        <div className="flex justify-center gap-6 mt-6 relative z-10">
          <div className="flex items-center gap-1.5 text-emerald-300 text-sm font-semibold">
            <IoCheckmarkCircle size={16} /> {correct} correct
          </div>
          <div className="flex items-center gap-1.5 text-red-300 text-sm font-semibold">
            <IoCloseCircle size={16} /> {total - correct} wrong
          </div>
        </div>
      </div>

      {/* Q&A review */}
      <div className="space-y-5">
        {answers.map((answer, i) => {
          const correctIdx = answer.questionId.options.findIndex((o) => o.isCorrect);
          const userCorrect = answer.selectedOption === correctIdx;
          return (
            <div key={i} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              {/* Question header */}
              <div className={`flex items-start gap-3 p-5 border-b ${userCorrect ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                <span className={`mt-0.5 flex-shrink-0 ${userCorrect ? "text-emerald-500" : "text-red-400"}`}>
                  {userCorrect ? <IoCheckmarkCircle size={20} /> : <IoCloseCircle size={20} />}
                </span>
                <p className="font-semibold text-slate-800 text-sm leading-snug">
                  <span className="text-slate-400 mr-1">{i + 1}.</span>
                  {answer.questionId.questionText}
                </p>
              </div>

              {/* Options */}
              <ul className="p-4 space-y-2">
                {answer.questionId.options.map((opt, j) => {
                  const isCorrect = opt.isCorrect;
                  const isUserAnswer = j === answer.selectedOption;
                  let cls = "border-slate-100 text-slate-600 bg-white";
                  if (isCorrect) cls = "border-emerald-300 bg-emerald-50 text-emerald-700";
                  else if (isUserAnswer) cls = "border-red-300 bg-red-50 text-red-600";

                  return (
                    <li key={j} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${cls}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isCorrect ? "bg-emerald-200 text-emerald-700" : isUserAnswer ? "bg-red-200 text-red-600" : "bg-slate-100 text-slate-400"
                      }`}>
                        {LABELS[j]}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && <span className="text-xs font-semibold text-emerald-600">✓ Correct</span>}
                      {!isCorrect && isUserAnswer && <span className="text-xs font-semibold text-red-500">✗ Your answer</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
