"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { message } from "antd";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { getQuestions, submitQuiz } from "@/lib/api";
import { IoVideocamOffOutline, IoVideocamOutline, IoShieldCheckmarkOutline } from "react-icons/io5";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const TIMER_MAX = 10;
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
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
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
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: quizData, isLoading } = useQuery({ queryKey: ["questions", { id }], queryFn: getQuestions });
  const { mutate, data: submitData, isPending } = useMutation({
    mutationFn: ({ values, token }) => submitQuiz({ values, token }),
  });

  // Automate Fullscreen
  useEffect(() => {
    if (!isLoading && quizData?.length) {
      const enterFullscreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(() => {});
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      };
      
      enterFullscreen();
      
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      
      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      };
    }
  }, [isLoading, quizData]);

  // Prevent back navigation and exit
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Auto-advance or submit when timer hits 0
  useEffect(() => {
    if (!quizData?.length) return;
    if (timeLeft <= 0) {
      const qId = quizData[currentIndex]._id;
      setAnswers((prev) =>
        prev.find((a) => a.questionId === qId)
          ? prev
          : [...prev, { questionId: qId, selectedOption: null }]
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
  }, [timeLeft, currentIndex, quizData]);

  const handleOptionClick = (qId, optIdx) => {
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
        onSuccess: (data) => {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          messageApi.open({ type: "success", content: data.message, onClose: () => router.push("/profile") });
        },
        onError: (err) => messageApi.error(err.response?.data?.error || "Submission failed"),
      }
    );
  };

  const handleNext = () => {
    if (selectedOptions[quizData[currentIndex]._id] === undefined) {
      messageApi.warning("Please select an answer or wait for the timer");
      return;
    }
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(TIMER_MAX);
    } else {
      handleSubmit();
    }
  };

  if (isLoading) return <Loader />;
  if (!quizData?.length) return <p className="text-center py-20 text-slate-500">No quiz data available.</p>;

  const { questionText, _id, options } = quizData[currentIndex];
  const progress = (currentIndex / quizData.length) * 100;
  const strokeDashoffset = CIRCUMFERENCE - (timeLeft / TIMER_MAX) * CIRCUMFERENCE;
  const isUrgent = timeLeft <= 3;
  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center px-4 py-10 select-none">
      {contextHolder}

      {/* Warning for exit fullscreen */}
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

      {/* Camera — fixed top-right with better placement */}
      <CameraWidget />

      <div className="w-full max-w-2xl fade-up">
        {/* Top bar — Removed Exit button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Assessment
          </div>
          <div className="text-sm text-slate-500 font-extrabold bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
            {currentIndex + 1} <span className="text-slate-300">/</span> {quizData.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-200 rounded-full mb-8 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div className="glass rounded-[2.5rem] shadow-2xl shadow-violet-100/50 p-8 md:p-12 border border-white">
          {/* Timer + question header */}
          <div className="flex items-start justify-between mb-8 gap-6">
            <div className="flex-1">
              <span className="text-xs font-black text-violet-700 uppercase tracking-[0.2em]">
                Question {currentIndex + 1}
              </span>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2 leading-tight">{questionText}</h3>
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
              const isSelected = selectedOptions[_id] === i;
              return (
                <button
                  key={i}
                  onClick={() => handleOptionClick(_id, i)}
                  className={`w-full text-left flex items-center gap-5 px-6 py-4 rounded-2xl border-2 text-base font-bold transition-all duration-300 ${
                    isSelected
                      ? "border-violet-600 bg-violet-50 text-violet-900 shadow-lg shadow-violet-100 ring-2 ring-violet-600/10"
                      : "border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/30 text-slate-700 hover:shadow-md"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                    isSelected ? "bg-violet-700 text-white rotate-12 scale-110" : "bg-slate-100 text-slate-400"
                  }`}>
                    {LABELS[i]}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
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

        {/* Question dots */}
        <div className="flex justify-center gap-2 mt-10 flex-wrap">
          {quizData.map((q, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "bg-violet-700 w-8"
                  : selectedOptions[q._id] !== undefined
                  ? "bg-violet-300"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Secure hint */}
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
