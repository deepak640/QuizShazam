"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { message } from "antd";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { getQuestions, submitQuiz, getSettings } from "@/lib/api";
import { IoVideocamOffOutline, IoVideocamOutline, IoShieldCheckmarkOutline } from "react-icons/io5";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ── Camera widget ─────────────────────────────────────────────────────────────
function CameraWidget() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    let stream;
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("denied"); return; }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setStatus("active");
      })
      .catch(() => setStatus("denied"));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  if (status === "denied") {
    return (
      <div className="fixed top-20 right-6 z-50 w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 shadow-md flex items-center justify-center">
        <IoVideocamOffOutline className="text-slate-400" size={20} />
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-6 z-50 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/70 bg-black transition-all hover:scale-110 duration-300"
      style={{ width: 160, height: 120 }}>
      {status === "pending" && (
        <div className="w-full h-full flex items-center justify-center bg-slate-800">
          <IoVideocamOutline className="text-slate-400" size={24} />
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)", display: status === "active" ? "block" : "none" }}
      />
      {status === "active" && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2 py-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-[10px] font-bold tracking-widest">LIVE</span>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  // selectedOptions[qId] = number (single) | number[] (multi)
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: quizData, isLoading } = useQuery({
    queryKey: ["questions", { id }],
    queryFn: getQuestions,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  // Derive timer max once settings load, default 10
  const TIMER_MAX = settingsData?.quizTimerSeconds ?? 10;

  // Initialise timeLeft once TIMER_MAX is known
  useEffect(() => {
    if (settingsData) setTimeLeft(settingsData.quizTimerSeconds ?? 10);
  }, [settingsData]);

  const { mutate, data: submitData, isPending } = useMutation({
    mutationFn: ({ values, token }) => submitQuiz({ values, token }),
  });

  const buildFinalAnswers = useCallback(() => {
    if (!quizData) return [];
    return quizData.map((q) => {
      const existing = answers.find((a) => a.questionId === q._id);
      if (existing) return existing;
      return q.isMultiSelect
        ? { questionId: q._id, selectedOptions: [] }
        : { questionId: q._id, selectedOption: null };
    });
  }, [quizData, answers]);

  const handleSubmit = useCallback(() => {
    if (!quizData) return;
    const finalAnswers = buildFinalAnswers();
    const userStr = Cookies.get("user");
    const { token } = userStr ? JSON.parse(userStr) : {};
    mutate(
      { values: { quizId: id, answers: finalAnswers }, token },
      {
        onSuccess: (data) => {
          if (typeof document !== "undefined" && document.exitFullscreen)
            document.exitFullscreen().catch(() => {});
          messageApi.open({ type: "success", content: data.message, onClose: () => router.push("/profile") });
        },
        onError: (err) => messageApi.error(err.response?.data?.error || "Submission failed"),
      }
    );
  }, [quizData, buildFinalAnswers, id, mutate, messageApi, router]);

  const isCurrentAnswered = useCallback(() => {
    if (!quizData) return false;
    const q = quizData[currentIndex];
    const sel = selectedOptions[q._id];
    if (q.isMultiSelect) return Array.isArray(sel) && sel.length > 0;
    return sel !== undefined;
  }, [quizData, currentIndex, selectedOptions]);

  const handleNext = useCallback(() => {
    if (!quizData) return;
    if (!isCurrentAnswered()) {
      messageApi.warning("Please select an answer or wait for the timer");
      return;
    }
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(TIMER_MAX);
    } else {
      handleSubmit();
    }
  }, [quizData, currentIndex, isCurrentAnswered, messageApi, handleSubmit, TIMER_MAX]);

  // Fullscreen
  useEffect(() => {
    if (!isLoading && quizData?.length) {
      const enter = () => {
        const el = document.documentElement;
        (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el)?.catch?.(() => {});
      };
      enter();
      const onChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", onChange);
      document.addEventListener("webkitfullscreenchange", onChange);
      return () => {
        document.removeEventListener("fullscreenchange", onChange);
        document.removeEventListener("webkitfullscreenchange", onChange);
      };
    }
  }, [isLoading, quizData]);

  // Block back/unload
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!quizData?.length || timeLeft === null) return;
    if (timeLeft <= 0) {
      const q = quizData[currentIndex];
      const qId = q._id;
      setAnswers((prev) =>
        prev.find((a) => a.questionId === qId)
          ? prev
          : [...prev, q.isMultiSelect ? { questionId: qId, selectedOptions: [] } : { questionId: qId, selectedOption: null }]
      );
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
  }, [timeLeft, currentIndex, quizData, handleSubmit, TIMER_MAX]);

  // Single-select click
  const handleSingleClick = (qId, optIdx) => {
    setSelectedOptions((prev) => ({ ...prev, [qId]: optIdx }));
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === qId);
      return existing
        ? prev.map((a) => a.questionId === qId ? { ...a, selectedOption: optIdx } : a)
        : [...prev, { questionId: qId, selectedOption: optIdx }];
    });
  };

  // Multi-select toggle
  const handleMultiToggle = (qId, optIdx) => {
    setSelectedOptions((prev) => {
      const cur = Array.isArray(prev[qId]) ? prev[qId] : [];
      const next = cur.includes(optIdx) ? cur.filter((i) => i !== optIdx) : [...cur, optIdx];
      return { ...prev, [qId]: next };
    });
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === qId);
      const cur = existing?.selectedOptions ?? [];
      const next = cur.includes(optIdx) ? cur.filter((i) => i !== optIdx) : [...cur, optIdx];
      return existing
        ? prev.map((a) => a.questionId === qId ? { ...a, selectedOptions: next } : a)
        : [...prev, { questionId: qId, selectedOptions: next }];
    });
  };

  if (isLoading || timeLeft === null) return <Loader />;
  if (!quizData?.length) return <p className="text-center py-20 text-slate-500">No quiz data available.</p>;

  const currentQ = quizData[currentIndex];
  const { questionText, _id, options, isMultiSelect } = currentQ;
  const progress = (currentIndex / quizData.length) * 100;
  const isUrgent = timeLeft <= 3;
  const LABELS = ["A", "B", "C", "D"];
  const multiSelected = Array.isArray(selectedOptions[_id]) ? selectedOptions[_id] : [];

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center px-4 py-10 select-none">
      {contextHolder}

      {!isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Fullscreen Required</h2>
            <p className="text-slate-500 mb-8">To maintain the integrity of the assessment, this quiz must be taken in fullscreen mode.</p>
            <button
              onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
              className="w-full py-4 bg-violet-700 text-white font-bold rounded-2xl shadow-xl shadow-violet-200 hover:scale-105 transition"
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      <CameraWidget />

      <div className="w-full max-w-2xl fade-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Assessment
          </div>
          <div className="text-sm text-slate-500 font-extrabold bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
            {currentIndex + 1} <span className="text-slate-300">/</span> {quizData.length}
          </div>
        </div>

        <div className="h-2 bg-slate-200 rounded-full mb-8 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="glass rounded-[2.5rem] shadow-2xl shadow-violet-100/50 p-8 md:p-12 border border-white">
          <div className="flex items-start justify-between mb-6 gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-black text-violet-700 uppercase tracking-[0.2em]">
                  Question {currentIndex + 1}
                </span>
                {isMultiSelect && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    ☑ Multi-select
                  </span>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 leading-tight">{questionText}</h3>
              {isMultiSelect && (
                <p className="text-xs text-slate-400 mt-1.5 font-medium">Select all correct answers</p>
              )}
            </div>

            {/* Circular timer */}
            <div className="relative shrink-0 w-20 h-20">
              <svg width="80" height="80" className="-rotate-90">
                <circle cx="40" cy="40" r={35} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r={35} fill="none"
                  stroke={isUrgent ? "#ef4444" : "#7c3aed"}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={219.91}
                  strokeDashoffset={219.91 - (timeLeft / TIMER_MAX) * 219.91}
                  style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${isUrgent ? "text-red-500 animate-pulse" : "text-violet-900"}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4 mb-10">
            {options.filter(Boolean).map((opt, i) => {
              const isSelected = isMultiSelect
                ? multiSelected.includes(i)
                : selectedOptions[_id] === i;

              return (
                <button
                  key={i}
                  onClick={() =>
                    isMultiSelect ? handleMultiToggle(_id, i) : handleSingleClick(_id, i)
                  }
                  className={`w-full text-left flex items-center gap-5 px-6 py-4 rounded-2xl border-2 text-base font-bold transition-all duration-300 ${
                    isSelected
                      ? "border-violet-600 bg-violet-50 text-violet-900 shadow-lg shadow-violet-100 ring-2 ring-violet-600/10"
                      : "border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/30 text-slate-700 hover:shadow-md"
                  }`}
                >
                  {isMultiSelect ? (
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all border-2 ${
                      isSelected
                        ? "bg-violet-700 text-white border-violet-700 scale-110"
                        : "bg-white text-slate-400 border-slate-200"
                    }`}>
                      {isSelected ? "✓" : LABELS[i]}
                    </span>
                  ) : (
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                      isSelected ? "bg-violet-700 text-white rotate-12 scale-110" : "bg-slate-100 text-slate-400"
                    }`}>
                      {LABELS[i]}
                    </span>
                  )}
                  {opt.text}
                </button>
              );
            })}
          </div>

          {/* Multi-select selection count indicator */}
          {isMultiSelect && multiSelected.length > 0 && (
            <p className="text-xs text-violet-600 font-semibold text-center mb-4">
              {multiSelected.length} option{multiSelected.length > 1 ? "s" : ""} selected
            </p>
          )}

          <div className="flex">
            {currentIndex < quizData.length - 1 ? (
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-500 text-white text-base font-black hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-violet-200"
              >
                Next Question →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isPending || !!submitData}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-500 text-white text-base font-black hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-violet-200 disabled:opacity-50"
              >
                {isPending ? "Submitting…" : "Finish Assessment ✓"}
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-10 flex-wrap">
          {quizData.map((q, i) => {
            const answered = q.isMultiSelect
              ? Array.isArray(selectedOptions[q._id]) && selectedOptions[q._id].length > 0
              : selectedOptions[q._id] !== undefined;
            return (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "bg-violet-700 w-8" : answered ? "bg-violet-300" : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-slate-400">
          <IoShieldCheckmarkOutline size={16} />
          <p className="text-center text-[10px] font-bold uppercase tracking-widest">
            Secure Browser Assessment — No exit allowed
          </p>
        </div>
      </div>
    </div>
  );
}
