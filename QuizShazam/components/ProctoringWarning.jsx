"use client";
import { useEffect } from "react";
import { IoWarningOutline, IoClose } from "react-icons/io5";

export default function ProctoringWarning({ warning, violationCount, maxViolations, onDismiss }) {
  useEffect(() => {
    if (!warning) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [warning, onDismiss]);

  if (!warning) return null;

  const remaining = maxViolations - violationCount;
  const isLast = remaining <= 0;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[500] flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border max-w-sm w-[calc(100vw-32px)] animate-in fade-in slide-in-from-top-4 duration-300 ${
      isLast ? "bg-red-600 border-red-500 text-white" : "bg-slate-900 border-white/10 text-white"
    }`}>
      <IoWarningOutline size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{warning}</p>
        {maxViolations && (
          <p className="text-xs mt-0.5 opacity-75">
            {isLast ? "Auto-submitting quiz..." : `Warning ${violationCount}/${maxViolations} — ${remaining} remaining`}
          </p>
        )}
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100 transition">
        <IoClose size={16} />
      </button>
    </div>
  );
}
