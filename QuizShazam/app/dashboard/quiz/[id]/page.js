"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { message } from "antd";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { getQuestions, submitQuiz } from "@/lib/api";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const TIMER_MAX = 10;
const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [popKey, setPopKey] = useState(0);

  const { data: quizData, isLoading } = useQuery({ queryKey: ["questions", { id }], queryFn: getQuestions });
  const { mutate, data: submitData, isPending } = useMutation({
    mutationFn: ({ values, token }) => submitQuiz({ values, token })
  });

  useEffect(() => {
    if (!quizData?.length) return;
    if (timeLeft <= 0) {
      const qId = quizData[currentIndex]._id;
      if (!answers.find((a) => a.questionId === qId)) {
        setAnswers((prev) => [...prev, { questionId: qId, selectedOption: null }]);
      }
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex((i) => i + 1);
        setTimeLeft(TIMER_MAX);
      } else {
        handleSubmit();
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, currentIndex, quizData]);

  const handleOptionClick = (qId, optIdx) => {
    setPopKey((k) => k + 1);
    setSelectedOptions((prev) => ({ ...prev, [qId]: optIdx }));
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === qId);
      return existing
        ? prev.map((a) => (a.questionId === qId ? { ...a, selectedOption: optIdx } : a))
        : [...prev, { questionId: qId, selectedOption: optIdx }];
    });
  };

  const handleSubmit = () => {
    const finalAnswers = quizData.map(
      (q) => answers.find((a) => a.questionId === q._id) || { questionId: q._id, selectedOption: null }
    );
    const { token } = JSON.parse(Cookies.get("user") || "{}");
    mutate(
      { values: { quizId: id, answers: finalAnswers }, token },
      {
        onSuccess: (data) =>
          messageApi.open({ type: "success", content: data.message, onClose: () => router.push("/profile") }),
        onError: (err) => messageApi.error(err.response?.data?.error || "Submission failed"),
      }
    );
  };

  const handleNext = () => {
    const selected = selectedOptions[quizData[currentIndex]._id];
    if (selected === undefined) { messageApi.warning("Please select an answer"); return; }
    if (currentIndex < quizData.length - 1) { setCurrentIndex((i) => i + 1); setTimeLeft(TIMER_MAX); }
    else handleSubmit();
  };

  const handlePrev = () => {
    if (currentIndex > 0) { setCurrentIndex((i) => i - 1); setTimeLeft(TIMER_MAX); }
  };

  if (isLoading) return <Loader />;
  if (!quizData?.length) return <p className="text-center py-20 text-slate-500">No quiz data available.</p>;

  const { questionText, _id, options } = quizData[currentIndex];
  const progress = ((currentIndex) / quizData.length) * 100;
  const strokeDashoffset = CIRCUMFERENCE - (timeLeft / TIMER_MAX) * CIRCUMFERENCE;
  const isUrgent = timeLeft <= 3;

  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center px-4 py-10">
      {contextHolder}

      <div className="w-full max-w-2xl fade-up">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 transition font-medium"
          >
            ← Back
          </button>
          <div className="text-sm text-slate-500 font-medium">
            {currentIndex + 1} <span className="text-slate-300">/</span> {quizData.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div className="glass rounded-3xl shadow-xl shadow-violet-100 p-8">
          {/* Timer + question header */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-widest">
                Question {currentIndex + 1}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 leading-snug">{questionText}</h3>
            </div>

            {/* SVG circular timer */}
            <div className="relative flex-shrink-0 w-16 h-16">
              <svg width="64" height="64" className="-rotate-90">
                <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#f3f4f6" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r={RADIUS} fill="none"
                  stroke={isUrgent ? "#ef4444" : "#7c3aed"}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${isUrgent ? "text-red-500" : "text-violet-800"}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {options.filter(Boolean).map((opt, i) => {
              const isSelected = selectedOptions[_id] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleOptionClick(_id, i)}
                  className={`w-full text-left flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "border-violet-600 bg-violet-50 text-violet-800 shadow-sm shadow-violet-100"
                      : "border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/50 text-slate-700"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                    isSelected ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {LABELS[i]}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition"
            >
              ← Previous
            </button>
            {currentIndex < quizData.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition shadow-md shadow-violet-200"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isPending || !!submitData}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-md shadow-violet-200"
              >
                {isPending ? "Submitting…" : "Submit Quiz ✓"}
              </button>
            )}
          </div>
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-1.5 mt-6 flex-wrap">
          {quizData.map((q, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-violet-700 scale-125"
                  : selectedOptions[q._id] !== undefined
                  ? "bg-violet-300"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
