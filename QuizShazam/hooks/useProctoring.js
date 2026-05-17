"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { logProctorViolation } from "@/lib/api";

const WARNINGS = {
  TAB_SWITCH:     "Warning: Please stay on the quiz tab.",
  WINDOW_BLUR:    "Warning: Do not switch windows during the quiz.",
  FULLSCREEN_EXIT:"Warning: You exited fullscreen. Please return to fullscreen.",
  COPY_ATTEMPT:   "Copying is not allowed during the quiz.",
  CUT_ATTEMPT:    "Cutting is not allowed during the quiz.",
  PASTE_ATTEMPT:  "Pasting is not allowed during the quiz.",
  RIGHT_CLICK:    "Right-click is disabled during the quiz.",
};

export function useProctoring({ config, quizId, sessionId, token, onAutoSubmit }) {
  const [violationCount, setViolationCount] = useState(0);
  const [lastWarning, setLastWarning] = useState(null);
  const lastEventRef = useRef({});
  const violationCountRef = useRef(0);
  const autoSubmittedRef = useRef(false);

  const clearWarning = useCallback(() => setLastWarning(null), []);

  const handleViolation = useCallback(async (eventType) => {
    if (!config?.enabled) return;
    const now = Date.now();
    const last = lastEventRef.current[eventType] || 0;
    if (now - last < 2000) return;
    lastEventRef.current[eventType] = now;

    setLastWarning(WARNINGS[eventType] || "Suspicious activity detected.");

    try {
      const result = await logProctorViolation({ quizId, sessionId, eventType, metadata: { ts: now }, token });
      if (result?.violationCount !== undefined) {
        violationCountRef.current = result.violationCount;
        setViolationCount(result.violationCount);
        if (
          config.autoSubmitOnViolationLimit &&
          result.violationCount >= config.maxViolations &&
          !autoSubmittedRef.current
        ) {
          autoSubmittedRef.current = true;
          await logProctorViolation({ quizId, sessionId, eventType: "AUTO_SUBMIT", metadata: { reason: "max_violations_reached" }, token });
          onAutoSubmit?.();
        }
      }
    } catch {
      // non-blocking, don't interrupt quiz
    }
  }, [config, quizId, sessionId, token, onAutoSubmit]);

  useEffect(() => {
    if (!config?.enabled || typeof window === "undefined") return;

    const cleanups = [];

    if (config.detectTabSwitch) {
      const onVisibility = () => { if (document.hidden) handleViolation("TAB_SWITCH"); };
      const onBlur = () => handleViolation("WINDOW_BLUR");
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("blur", onBlur);
      cleanups.push(() => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("blur", onBlur);
      });
    }

    if (config.detectFullscreenExit) {
      const onFsChange = () => { if (!document.fullscreenElement) handleViolation("FULLSCREEN_EXIT"); };
      document.addEventListener("fullscreenchange", onFsChange);
      cleanups.push(() => document.removeEventListener("fullscreenchange", onFsChange));
    }

    if (config.blockCopyPaste) {
      const onCopy  = (e) => { e.preventDefault(); handleViolation("COPY_ATTEMPT"); };
      const onPaste = (e) => { e.preventDefault(); handleViolation("PASTE_ATTEMPT"); };
      const onCut   = (e) => { e.preventDefault(); handleViolation("CUT_ATTEMPT"); };
      document.addEventListener("copy",  onCopy,  { capture: true });
      document.addEventListener("paste", onPaste, { capture: true });
      document.addEventListener("cut",   onCut,   { capture: true });
      cleanups.push(() => {
        document.removeEventListener("copy",  onCopy,  { capture: true });
        document.removeEventListener("paste", onPaste, { capture: true });
        document.removeEventListener("cut",   onCut,   { capture: true });
      });
    }

    if (config.disableRightClick) {
      const onCtxMenu = (e) => { e.preventDefault(); handleViolation("RIGHT_CLICK"); };
      document.addEventListener("contextmenu", onCtxMenu, { capture: true });
      cleanups.push(() => document.removeEventListener("contextmenu", onCtxMenu, { capture: true }));
    }

    return () => cleanups.forEach(fn => fn());
  }, [config, handleViolation]);

  return { violationCount, lastWarning, clearWarning };
}
