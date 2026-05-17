"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { message } from "antd";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import {
  getQuestions, submitQuiz, getSettings,
  getOrCreateSession, saveSessionProgress, discardQuizSession,
} from "@/lib/api";
import {
  IoVideocamOffOutline, IoVideocamOutline,
  IoShieldCheckmarkOutline, IoCloudDoneOutline,
  IoCloudUploadOutline, IoWarningOutline,
  IoTrophyOutline, IoFlameOutline, IoSparklesOutline,
  IoArrowUpOutline, IoBookOutline, IoRibbonOutline,
  IoCheckmarkCircle, IoCloseCircle, IoArrowForward,
} from "react-icons/io5";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const LS_KEY = (id) => `quiz_draft_${id}`;
const LS_START_KEY = (id) => `quiz_start_${id}`;

// ── Camera widget ─────────────────────────────────────────────────────────────
function CameraWidget() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    let stream;
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("denied"); return; }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; setStatus("active"); })
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
      <video ref={videoRef} autoPlay playsInline muted
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

// ── Session countdown banner ───────────────────────────────────────────────────
function SessionBanner({ expiresAt, onExpired }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining(0); onExpired?.(); return; }
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  if (remaining === null) return null;

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1_000);
  const display = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  const isUrgent = remaining < 5 * 60 * 1000;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-2xl shadow-xl border backdrop-blur-md ${
      isUrgent ? "bg-red-600/95 border-red-500 text-white" : "bg-slate-900/90 border-white/10 text-white"
    }`}>
      <span className={`w-2 h-2 rounded-full ${isUrgent ? "bg-white animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
      <span className="text-xs font-semibold tracking-wide">Session closes in</span>
      <span className={`text-sm font-black tabular-nums ${isUrgent ? "animate-pulse" : ""}`}>{display}</span>
    </div>
  );
}

// ── Session expired screen ─────────────────────────────────────────────────────
function SessionExpiredScreen() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <IoWarningOutline className="text-red-400" size={40} />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Session Expired</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          This assessment session has ended. Please contact your educator if you believe this is a mistake.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

// ── Autosave indicator ────────────────────────────────────────────────────────
// status: "idle" | "saving" | "saved" | "offline"
function AutosaveIndicator({ status, restoredSession }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "saved") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(t);
    }
    if (status === "saving" || status === "offline") setVisible(true);
    else setVisible(false);
  }, [status]);

  if (!visible && !restoredSession) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {restoredSession && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-200 animate-in fade-in slide-in-from-bottom-2">
          <IoCloudDoneOutline size={14} />
          Previous session restored
        </div>
      )}
      {visible && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
          status === "saving"  ? "bg-slate-800 text-white" :
          status === "saved"   ? "bg-emerald-600 text-white" :
          status === "offline" ? "bg-amber-500 text-white" : ""
        }`}>
          {status === "saving"  && <><IoCloudUploadOutline size={13} className="animate-pulse" /> Saving…</>}
          {status === "saved"   && <><IoCloudDoneOutline size={13} /> Saved</>}
          {status === "offline" && <><IoWarningOutline size={13} /> Offline — progress cached locally</>}
        </div>
      )}
    </div>
  );
}

// ── Resume modal ──────────────────────────────────────────────────────────────
function ResumeModal({ answeredCount, onResume, onDiscard }) {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-5">
          <IoCloudDoneOutline className="text-violet-600" size={32} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Unfinished Quiz</h2>
        <p className="text-slate-500 text-sm mb-1">
          You have an unfinished attempt with{" "}
          <span className="font-bold text-violet-700">{answeredCount} answer{answeredCount !== 1 ? "s" : ""}</span> saved.
        </p>
        <p className="text-slate-400 text-xs mb-7">Would you like to continue where you left off?</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-violet-700 to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-violet-200 hover:opacity-90 transition"
          >
            Resume Quiz
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3 border border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition text-sm"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

// ── useDebounce ───────────────────────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timerRef = useRef(null);
  return useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ── Quiz-level timer bar ──────────────────────────────────────────────────────
function QuizTimerBar({ quizTimeLeft, totalSeconds }) {
  if (quizTimeLeft === null || totalSeconds === null) return null;
  const pct = totalSeconds > 0 ? Math.max(0, (quizTimeLeft / totalSeconds) * 100) : 0;
  const mm = String(Math.floor(quizTimeLeft / 60)).padStart(2, "0");
  const ss = String(quizTimeLeft % 60).padStart(2, "0");
  const isUrgent = quizTimeLeft <= 60;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Quiz Timer</span>
        <span className={`text-sm font-black tabular-nums ${isUrgent ? "text-red-500 animate-pulse" : "text-slate-700"}`}>
          {mm}:{ss}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-gradient-to-r from-red-500 to-orange-400" : "bg-gradient-to-r from-violet-600 to-indigo-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Post-quiz results overlay ─────────────────────────────────────────────────
function PostQuizOverlay({ data, quizTitle, onViewProfile, onRetake }) {
  const { passed, percentage, xpEarned, streak, rankBefore, rankAfter, newBadges = [], weakTopics = [] } = data;
  const rankImproved = rankBefore && rankAfter && rankAfter < rankBefore;

  const rows = [
    {
      icon: <IoSparklesOutline size={18} />,
      color: "text-violet-600 bg-violet-50",
      label: `+${xpEarned} XP earned`,
      show: xpEarned > 0,
    },
    {
      icon: <IoFlameOutline size={18} />,
      color: "text-orange-500 bg-orange-50",
      label: `${streak} day streak${streak > 1 ? " maintained 🔥" : " started!"}`,
      show: streak > 0,
    },
    {
      icon: <IoRibbonOutline size={18} />,
      color: "text-yellow-600 bg-yellow-50",
      label: newBadges.length === 1
        ? `New badge unlocked: ${newBadges[0].id.replace(/_/g, " ")}`
        : `${newBadges.length} new badges unlocked!`,
      show: newBadges.length > 0,
    },
    {
      icon: <IoArrowUpOutline size={18} />,
      color: "text-emerald-600 bg-emerald-50",
      label: `Rank improved: #${rankBefore} → #${rankAfter}`,
      show: rankImproved,
    },
    {
      icon: <IoBookOutline size={18} />,
      color: "text-blue-600 bg-blue-50",
      label: `Weak topic${weakTopics.length > 1 ? "s" : ""} identified: ${weakTopics.join(", ")}`,
      show: weakTopics.length > 0,
    },
  ].filter(r => r.show);

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className={`p-6 text-center ${passed ? "bg-gradient-to-br from-violet-700 to-indigo-500" : "bg-gradient-to-br from-red-600 to-rose-500"}`}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            {passed
              ? <IoTrophyOutline size={32} className="text-white" />
              : <IoCloseCircle size={32} className="text-white" />
            }
          </div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
            {passed ? "Quiz Passed!" : "Not Passed"}
          </p>
          <p className="text-5xl font-black text-white">{percentage}%</p>
        </div>

        {/* Stat rows */}
        {rows.length > 0 && (
          <div className="px-5 py-4 space-y-2.5">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}>
                  {r.icon}
                </div>
                <p className="text-sm font-semibold text-slate-700">{r.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-6 pt-2 flex flex-col gap-2.5">
          <button
            onClick={onViewProfile}
            className="w-full py-3 bg-gradient-to-r from-violet-700 to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-200 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            View Profile <IoArrowForward size={16} />
          </button>
          {!passed && (
            <button
              onClick={onRetake}
              className="w-full py-3 border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition text-sm"
            >
              Retake Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  // ── quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionExpiredMidQuiz, setSessionExpiredMidQuiz] = useState(false);

  // ── quiz-level timer
  const [quizTimeLeft, setQuizTimeLeft] = useState(null);   // seconds
  const [quizTotalSeconds, setQuizTotalSeconds] = useState(null);

  // ── answer locking
  const [lockedQuestions, setLockedQuestions] = useState(new Set());

  // ── session persistence state
  const [sessionPhase, setSessionPhase] = useState("loading"); // "loading" | "prompt" | "active"
  const [savedSession, setSavedSession] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState("idle");
  const [restoredSession, setRestoredSession] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const tokenRef = useRef(null);

  // ── load token once
  useEffect(() => {
    try {
      const raw = Cookies.get("user");
      if (raw) tokenRef.current = JSON.parse(raw)?.token;
    } catch {}
  }, []);

  // ── online/offline detection
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  setAutosaveStatus("idle"); };
    const onOffline = () => { setIsOnline(false);  setAutosaveStatus("offline"); };
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── data queries
  const { data: quizPayload, isLoading } = useQuery({
    queryKey: ["questions", { id, token: tokenRef.current }],
    queryFn: getQuestions,
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const quizData            = quizPayload?.questions ?? [];
  const quizMeta            = quizPayload?.quiz ?? null;
  const isSession           = quizMeta?.isSession ?? false;
  const sessionExpiredInit  = quizMeta?.sessionExpired ?? false;
  const timerMinutes        = quizMeta?.timerMinutes ?? 5;
  const allowPrevious       = quizMeta?.allowPreviousQuestion ?? false;

  // ── fetch or create backend session once quiz data is ready
  useEffect(() => {
    if (isLoading || !quizData?.length || !tokenRef.current) return;
    if (sessionPhase !== "loading") return;

    getOrCreateSession({ quizId: id, token: tokenRef.current })
      .then(({ session, isNew }) => {
        if (!isNew && session?.answers?.length > 0) {
          setSavedSession(session);
          setSessionPhase("prompt");
        } else {
          // Fresh start — record start time
          localStorage.setItem(LS_START_KEY(id), String(Date.now()));
          const totalSec = timerMinutes * 60;
          setQuizTotalSeconds(totalSec);
          setQuizTimeLeft(totalSec);
          setSessionPhase("active");
        }
      })
      .catch(() => {
        // Backend unavailable — fall back to localStorage draft
        const draft = _loadLocalDraft(id);
        if (draft?.answers?.length > 0) {
          setSavedSession(draft);
          setSessionPhase("prompt");
        } else {
          localStorage.setItem(LS_START_KEY(id), String(Date.now()));
          const totalSec = timerMinutes * 60;
          setQuizTotalSeconds(totalSec);
          setQuizTimeLeft(totalSec);
          setSessionPhase("active");
        }
      });
  }, [isLoading, quizData, id, sessionPhase, timerMinutes]);

  // ── submission
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
        onSuccess: () => {
          localStorage.removeItem(LS_KEY(id));
          localStorage.removeItem(LS_START_KEY(id));
          if (typeof document !== "undefined" && document.exitFullscreen)
            document.exitFullscreen().catch(() => {});
          router.push("/profile");
        },
        onError: (err) => {
          const msg = err.response?.data?.message || err.response?.data?.error || "Submission failed";
          if (err.response?.status === 403)
            messageApi.error("Session expired — your answers could not be submitted.");
          else
            messageApi.error(msg);
        },
      }
    );
  }, [quizData, buildFinalAnswers, id, mutate, messageApi, router]);

  // ── quiz-level countdown
  useEffect(() => {
    if (sessionPhase !== "active" || quizTimeLeft === null) return;
    if (quizTimeLeft <= 0) { handleSubmit(); return; }
    const timer = setInterval(() => setQuizTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [quizTimeLeft, sessionPhase, handleSubmit]);

  // ── RESUME handler
  const handleResume = useCallback(() => {
    if (!savedSession) return;
    const restoredAnswers = savedSession.answers ?? [];
    const restoredIndex   = savedSession.currentIndex ?? 0;

    // Rebuild selectedOptions map from saved answers
    const opts = {};
    restoredAnswers.forEach((a) => {
      if (a.selectedOptions?.length > 0) opts[a.questionId] = a.selectedOptions;
      else if (a.selectedOption !== null && a.selectedOption !== undefined) opts[a.questionId] = a.selectedOption;
    });

    // Restore locked questions (all that have been answered up to restoredIndex - 1)
    const locked = new Set();
    restoredAnswers.forEach((a, i) => {
      if (i < restoredIndex) locked.add(a.questionId);
    });
    setLockedQuestions(locked);

    setAnswers(restoredAnswers);
    setSelectedOptions(opts);
    setCurrentIndex(restoredIndex);

    // Calculate remaining time from start timestamp
    const totalSec = timerMinutes * 60;
    const startTs = parseInt(localStorage.getItem(LS_START_KEY(id)) || "0", 10);
    let remaining = totalSec;
    if (startTs > 0) {
      const elapsedSec = Math.floor((Date.now() - startTs) / 1000);
      remaining = Math.max(0, totalSec - elapsedSec);
    }
    setQuizTotalSeconds(totalSec);
    setQuizTimeLeft(remaining);
    if (remaining <= 0) {
      // Already expired — auto-submit immediately after mounting
      setSessionPhase("active");
      setTimeout(() => handleSubmit(), 100);
      return;
    }

    setRestoredSession(true);
    setSessionPhase("active");

    // Fade out "restored" badge after 4s
    setTimeout(() => setRestoredSession(false), 4000);
  }, [savedSession, timerMinutes, id, handleSubmit]);

  // ── DISCARD handler
  const handleDiscard = useCallback(async () => {
    try {
      if (tokenRef.current) await discardQuizSession({ quizId: id, token: tokenRef.current });
    } catch {}
    localStorage.removeItem(LS_KEY(id));
    // Reset start time on fresh start
    localStorage.setItem(LS_START_KEY(id), String(Date.now()));
    setSavedSession(null);
    setLockedQuestions(new Set());
    const totalSec = timerMinutes * 60;
    setQuizTotalSeconds(totalSec);
    setQuizTimeLeft(totalSec);
    setSessionPhase("active");
  }, [id, timerMinutes]);

  // ── auto-save core
  const performSave = useCallback(async (currentAnswers, idx) => {
    if (!tokenRef.current || !isOnline) {
      _saveLocalDraft(id, { answers: currentAnswers, currentIndex: idx });
      return;
    }
    setAutosaveStatus("saving");
    try {
      await saveSessionProgress({
        quizId: id,
        answers: currentAnswers,
        currentIndex: idx,
        token: tokenRef.current,
      });
      _saveLocalDraft(id, { answers: currentAnswers, currentIndex: idx });
      setAutosaveStatus("saved");
    } catch {
      // Network failed — keep local copy safe
      _saveLocalDraft(id, { answers: currentAnswers, currentIndex: idx });
      setAutosaveStatus("offline");
    }
  }, [id, isOnline]);

  const debouncedSave = useDebounce(performSave, 1500);

  // ── save on answer change
  useEffect(() => {
    if (sessionPhase !== "active" || !answers.length) return;
    debouncedSave(answers, currentIndex);
  }, [answers, sessionPhase]); // intentionally excludes currentIndex & debouncedSave to avoid re-triggering on nav

  // ── periodic save every 15s
  useEffect(() => {
    if (sessionPhase !== "active") return;
    const id15 = setInterval(() => {
      if (answers.length) performSave(answers, currentIndex);
    }, 15_000);
    return () => clearInterval(id15);
  }, [sessionPhase, answers, currentIndex, performSave]);

  const isCurrentAnswered = useCallback(() => {
    if (!quizData) return false;
    const q   = quizData[currentIndex];
    const sel = selectedOptions[q._id];
    if (q.isMultiSelect) return Array.isArray(sel) && sel.length > 0;
    return sel !== undefined;
  }, [quizData, currentIndex, selectedOptions]);

  const handleNext = useCallback(() => {
    if (!quizData) return;
    if (!isCurrentAnswered()) {
      messageApi.warning("Please select an answer before proceeding");
      return;
    }
    const currentQ = quizData[currentIndex];
    // Lock this question's answer
    setLockedQuestions((prev) => new Set([...prev, currentQ._id]));

    if (currentIndex < quizData.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleSubmit();
    }
  }, [quizData, currentIndex, isCurrentAnswered, messageApi, handleSubmit]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  // ── fullscreen
  useEffect(() => {
    if (sessionPhase !== "active" || !quizData?.length) return;
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el)?.catch?.(() => {});
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [sessionPhase, quizData]);

  // ── block back/unload
  useEffect(() => {
    if (sessionPhase !== "active") return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [sessionPhase]);

  // ── answer handlers
  const handleSingleClick = (qId, optIdx) => {
    if (lockedQuestions.has(qId)) return;
    setSelectedOptions((prev) => ({ ...prev, [qId]: optIdx }));
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === qId);
      return existing
        ? prev.map((a) => a.questionId === qId ? { ...a, selectedOption: optIdx } : a)
        : [...prev, { questionId: qId, selectedOption: optIdx }];
    });
  };

  const handleMultiToggle = (qId, optIdx) => {
    if (lockedQuestions.has(qId)) return;
    setSelectedOptions((prev) => {
      const cur  = Array.isArray(prev[qId]) ? prev[qId] : [];
      const next = cur.includes(optIdx) ? cur.filter((i) => i !== optIdx) : [...cur, optIdx];
      return { ...prev, [qId]: next };
    });
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === qId);
      const cur  = existing?.selectedOptions ?? [];
      const next = cur.includes(optIdx) ? cur.filter((i) => i !== optIdx) : [...cur, optIdx];
      return existing
        ? prev.map((a) => a.questionId === qId ? { ...a, selectedOptions: next } : a)
        : [...prev, { questionId: qId, selectedOptions: next }];
    });
  };

  // ── render gates
  if (isLoading || sessionPhase === "loading") return <Loader />;
  if (sessionExpiredInit || sessionExpiredMidQuiz) return <SessionExpiredScreen />;

  if (sessionPhase === "prompt" && savedSession) {
    return (
      <ResumeModal
        answeredCount={savedSession.answers?.length ?? 0}
        onResume={handleResume}
        onDiscard={handleDiscard}
      />
    );
  }

  if (quizTimeLeft === null) return <Loader />;
  if (!quizData?.length) return <p className="text-center py-20 text-slate-500">No quiz data available.</p>;

  const currentQ    = quizData[currentIndex];
  const { questionText, _id, options, isMultiSelect } = currentQ;
  const progress    = (currentIndex / quizData.length) * 100;
  const LABELS      = ["A", "B", "C", "D"];
  const multiSelected = Array.isArray(selectedOptions[_id]) ? selectedOptions[_id] : [];
  const isLocked    = lockedQuestions.has(_id);

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center px-4 py-10 select-none">
      {contextHolder}

      {/* Session countdown banner */}
      {isSession && quizMeta?.expiresAt && (
        <SessionBanner
          expiresAt={quizMeta.expiresAt}
          onExpired={() => setSessionExpiredMidQuiz(true)}
        />
      )}

      {/* Fullscreen gate */}
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
      <AutosaveIndicator status={autosaveStatus} restoredSession={restoredSession} />

      <div className="w-full max-w-2xl fade-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {isSession ? "Session Assessment" : "Live Assessment"}
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
          {/* Quiz-level timer bar */}
          <QuizTimerBar quizTimeLeft={quizTimeLeft} totalSeconds={quizTotalSeconds} />

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
                {isLocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    🔒 Locked
                  </span>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 leading-tight">{questionText}</h3>
              {isMultiSelect && (
                <p className="text-xs text-slate-400 mt-1.5 font-medium">Select all correct answers</p>
              )}
              {isLocked && (
                <p className="text-xs text-amber-600 mt-1 font-medium">Answer locked — cannot be changed</p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4 mb-10">
            {options.filter(Boolean).map((opt, i) => {
              const isSelected = isMultiSelect ? multiSelected.includes(i) : selectedOptions[_id] === i;
              return (
                <button
                  key={i}
                  onClick={() => isMultiSelect ? handleMultiToggle(_id, i) : handleSingleClick(_id, i)}
                  disabled={isLocked}
                  className={`w-full text-left flex items-center gap-5 px-6 py-4 rounded-2xl border-2 text-base font-bold transition-all duration-300 ${
                    isLocked
                      ? isSelected
                        ? "border-violet-400 bg-violet-50 text-violet-800 opacity-80 cursor-not-allowed"
                        : "border-slate-100 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                      : isSelected
                        ? "border-violet-600 bg-violet-50 text-violet-900 shadow-lg shadow-violet-100 ring-2 ring-violet-600/10"
                        : "border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/30 text-slate-700 hover:shadow-md"
                  }`}
                >
                  {isMultiSelect ? (
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all border-2 ${
                      isSelected ? "bg-violet-700 text-white border-violet-700 scale-110" : "bg-white text-slate-400 border-slate-200"
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

          {isMultiSelect && multiSelected.length > 0 && (
            <p className="text-xs text-violet-600 font-semibold text-center mb-4">
              {multiSelected.length} option{multiSelected.length > 1 ? "s" : ""} selected
            </p>
          )}

          <div className="flex gap-3">
            {/* Previous button */}
            {allowPrevious && currentIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="py-4 px-6 rounded-2xl border-2 border-slate-200 text-slate-600 text-base font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                ← Previous
              </button>
            )}

            {currentIndex < quizData.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-500 text-white text-base font-black hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-violet-200"
              >
                Next Question →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isPending || !!submitData}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-500 text-white text-base font-black hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-violet-200 disabled:opacity-50"
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

// ── localStorage helpers ──────────────────────────────────────────────────────

function _saveLocalDraft(quizId, data) {
  try {
    localStorage.setItem(LS_KEY(quizId), JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}

function _loadLocalDraft(quizId) {
  try {
    const raw = localStorage.getItem(LS_KEY(quizId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Discard drafts older than 24h
    if (Date.now() - parsed.savedAt > 24 * 3_600_000) {
      localStorage.removeItem(LS_KEY(quizId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
