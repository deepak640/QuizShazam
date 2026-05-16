"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getCertificate } from "@/lib/api";
import {
  IoArrowBack, IoDownloadOutline, IoShareSocialOutline,
  IoTrophyOutline, IoRibbonOutline, IoIdCardOutline,
} from "react-icons/io5";
import Loader from "@/components/Loader";

// ─── Constants ────────────────────────────────────────────────────────────────

const PASS_THRESHOLD = 60;

const GRADE_MAP = [
  { min: 90, label: "A+", hex: "#7c3aed" },
  { min: 80, label: "A",  hex: "#6366f1" },
  { min: 70, label: "B+", hex: "#0ea5e9" },
  { min: 60, label: "B",  hex: "#10b981" },
];

function getGrade(pct) {
  return GRADE_MAP.find(g => pct >= g.min) ?? { label: "C", hex: "#f59e0b" };
}

function getHonor(pct) {
  if (pct >= 90) return "with Distinction";
  if (pct >= 70) return "with Merit";
  return "successfully";
}

// ─── Strip oklch from cloned document ────────────────────────────────────────
// html2canvas cannot parse oklch/oklab; we scrub those from the clone's
// inline styles and inject a CSS override so computed values don't bleed in.

function sanitizeClone(doc) {
  const style = doc.createElement("style");
  // Force the captured subtree to use only safe color formats
  style.textContent = `
    [data-cert] * {
      color-scheme: normal !important;
    }
  `;
  doc.head.appendChild(style);

  doc.querySelectorAll("[data-cert] *").forEach((el) => {
    const s = el.style;
    for (let i = s.length - 1; i >= 0; i--) {
      const prop = s[i];
      const val = s.getPropertyValue(prop);
      if (val.includes("oklch") || val.includes("oklab")) {
        s.removeProperty(prop);
      }
    }
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CertificatePage() {
  const { id } = useParams();
  const router = useRouter();
  const certRef = useRef(null);

  const [qrDataUrl, setQrDataUrl]   = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied]           = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["certificate", id],
    queryFn:  () => getCertificate(id),
    retry: 1,
  });

  // Generate QR pointing at this certificate URL
  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    const url = `${window.location.origin}/certificate/${id}`;
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(url, {
        width: 160, margin: 1,
        color: { dark: "#1e1b4b", light: "#ffffff" },
      }).then(setQrDataUrl);
    });
  }, [id]);

  // ── PDF download ────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => sanitizeClone(clonedDoc),
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const aspect = canvas.width / canvas.height;
      const pageAspect = pw / ph;
      let iw = pw, ih = ph;
      if (aspect > pageAspect) ih = pw / aspect;
      else iw = ph * aspect;
      pdf.addImage(imgData, "PNG", (pw - iw) / 2, (ph - ih) / 2, iw, ih);
      pdf.save(`QuizShazam_Certificate_${(data?.studentName || "Student").replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setDownloading(false);
    }
  };

  // ── Share ───────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    const url = `${window.location.origin}/certificate/${id}`;
    if (navigator.share) {
      await navigator.share({ title: "My Quiz Certificate", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) return <Loader />;

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "#fef2f2" }}>
            <IoIdCardOutline style={{ color: "#f87171" }} size={28} />
          </div>
          <p style={{ color: "#334155" }} className="font-semibold">Certificate not found</p>
          <p style={{ color: "#94a3b8" }} className="text-sm">This certificate ID may be invalid.</p>
          <button onClick={() => router.back()} style={{ color: "#7c3aed" }} className="text-sm font-medium hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const pct  = data.percentage;

  if (pct < PASS_THRESHOLD) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f8fafc" }}>
        <div className="rounded-3xl p-10 text-center max-w-md" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px #0001" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fffbeb" }}>
            <IoTrophyOutline style={{ color: "#fbbf24" }} size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#1e293b" }}>Certificate Not Unlocked</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
            A minimum score of {PASS_THRESHOLD}% is required. You scored{" "}
            <span className="font-semibold" style={{ color: "#334155" }}>{pct}%</span>. Keep practicing!
          </p>
          <button onClick={() => router.back()} className="mt-6 text-sm font-semibold hover:underline" style={{ color: "#7c3aed" }}>
            Back to results
          </button>
        </div>
      </div>
    );
  }

  // ── Certificate render ──────────────────────────────────────────────────────

  const g     = getGrade(pct);
  const honor = getHonor(pct);
  const issuedDate = new Date(data.completedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const certShortId = String(data.certificateId).slice(-10).toUpperCase();

  // All colors used inside certRef are inline hex — no Tailwind color classes
  const C = {
    bg:        "#ffffff",
    bgMuted:   "#f8fafc",
    border:    "#e2e8f0",
    borderFaint: "#ede9fe",
    text:      "#0f172a",
    textMid:   "#334155",
    textMuted: "#64748b",
    textFaint: "#94a3b8",
    violet:    "#7c3aed",
    violetDk:  "#4c1d95",
    violetLt:  "#ede9fe",
    divider:   "#c4b5fd",
    emerald:   "#059669",
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)" }}>

      {/* Top bar — can use Tailwind freely, not captured */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-7">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "#64748b" }}
        >
          <IoArrowBack size={16} /> Back to results
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#475569", boxShadow: "0 1px 3px #0001" }}
          >
            <IoShareSocialOutline size={16} />
            {copied ? "Link copied!" : "Share"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#7c3aed", color: "#ffffff", boxShadow: "0 2px 8px #7c3aed33", opacity: downloading ? 0.65 : 1 }}
          >
            <IoDownloadOutline size={16} />
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CERTIFICATE — all colors via inline style, zero Tailwind color classes
          data-cert attribute used by sanitizeClone()
      ══════════════════════════════════════════════════════════════════ */}
      <div
        ref={certRef}
        data-cert
        style={{
          maxWidth: 960, margin: "0 auto",
          background: C.bg,
          boxShadow: "0 20px 60px #00000018",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {/* Outer decorative border */}
        <div style={{ position: "relative", margin: 16, border: `3px solid ${C.borderFaint}` }}>

          {/* Inner border */}
          <div style={{ position: "absolute", inset: 8, border: `1px solid ${C.borderFaint}`, pointerEvents: "none" }} />

          {/* Corner ornaments — SVG only, safe for html2canvas */}
          {[
            { top: 0, left: 0, rotate: "0deg" },
            { top: 0, right: 0, rotate: "90deg" },
            { bottom: 0, right: 0, rotate: "180deg" },
            { bottom: 0, left: 0, rotate: "270deg" },
          ].map((pos, i) => (
            <div key={i} style={{ position: "absolute", width: 48, height: 48, pointerEvents: "none", ...pos }}>
              <svg viewBox="0 0 48 48" fill="none" style={{ width: "100%", height: "100%", transform: `rotate(${pos.rotate})` }}>
                <path d="M2 2 L20 2 L2 20 Z" fill={C.violet} opacity="0.12" />
                <path d="M2 2 L12 2 L2 12 Z" fill={C.violet} opacity="0.22" />
                <circle cx="4" cy="4" r="2.5" fill={C.violet} opacity="0.28" />
              </svg>
            </div>
          ))}

          {/* Content */}
          <div style={{ padding: "48px 56px" }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>

              {/* Logo row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${C.divider})` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: C.violet,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${C.violet}44`,
                  }}>
                    <IoTrophyOutline size={16} color="#fde047" />
                  </div>
                  <span style={{
                    fontFamily: "sans-serif", fontWeight: 800,
                    fontSize: 14, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: C.violetDk,
                  }}>
                    QuizShazam
                  </span>
                </div>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${C.divider})` }} />
              </div>

              {/* Subtitle */}
              <p style={{
                fontFamily: "sans-serif", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.32em", textTransform: "uppercase",
                color: C.textFaint, marginBottom: 6,
              }}>
                Proudly Presents
              </p>

              {/* Main title */}
              <h1 style={{
                fontSize: 38, fontWeight: 900, color: C.violetDk,
                letterSpacing: "-0.01em", margin: "0 0 8px 0",
              }}>
                Certificate of Completion
              </h1>

              {/* Decorative divider */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{ width: 64, height: 1, background: C.divider }} />
                <IoRibbonOutline size={14} color={C.divider} />
                <div style={{ width: 64, height: 1, background: C.divider }} />
              </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <p style={{
                fontFamily: "sans-serif", fontSize: 13, color: C.textFaint,
                letterSpacing: "0.04em", marginBottom: 12,
              }}>
                This is to certify that
              </p>

              {/* Student name */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
                <h2 style={{
                  fontSize: 52, fontWeight: 900, color: C.text,
                  letterSpacing: "-0.025em", margin: 0, lineHeight: 1,
                }}>
                  {data.studentName}
                </h2>
                {/* Underline */}
                <div style={{
                  position: "absolute", bottom: -4, left: 0, right: 0, height: 2,
                  background: `linear-gradient(to right, transparent, ${C.violet}, transparent)`,
                }} />
              </div>

              <p style={{
                fontFamily: "sans-serif", fontSize: 13, color: C.textFaint,
                letterSpacing: "0.04em", margin: "20px 0 12px",
              }}>
                has completed {honor}
              </p>

              <h3 style={{ fontSize: 26, fontWeight: 700, color: C.violet, margin: "0 0 4px 0" }}>
                {data.quizTitle}
              </h3>
              {data.quizSubject && data.quizSubject !== data.quizTitle && (
                <p style={{ fontFamily: "sans-serif", fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>
                  {data.quizSubject}
                </p>
              )}
            </div>

            {/* ── Score strip ────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 36 }}>

              {[
                { label: "Marks",    value: `${data.score}/${data.totalMarks ?? data.totalQuestions}`, color: C.text },
                { label: "Accuracy", value: `${pct}%`,                              color: g.hex  },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  textAlign: "center", padding: "12px 24px",
                  borderRadius: 16, border: `1px solid ${C.border}`,
                  background: C.bgMuted,
                }}>
                  <p style={{
                    fontFamily: "sans-serif", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.28em", textTransform: "uppercase",
                    color: C.textFaint, marginBottom: 2,
                  }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 900, color, margin: 0 }}>{value}</p>
                </div>
              ))}

              {/* Grade circle */}
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: `4px solid ${g.hex}44`,
                background: `${g.hex}12`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: g.hex }}>{g.label}</span>
              </div>

              {/* Status */}
              <div style={{
                textAlign: "center", padding: "12px 24px",
                borderRadius: 16, border: `1px solid ${C.border}`,
                background: C.bgMuted,
              }}>
                <p style={{
                  fontFamily: "sans-serif", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.28em", textTransform: "uppercase",
                  color: C.textFaint, marginBottom: 2,
                }}>
                  Status
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.emerald, margin: 0 }}>✓ Passed</p>
              </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>

              {/* Date */}
              <div>
                <p style={{
                  fontFamily: "sans-serif", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.28em", textTransform: "uppercase",
                  color: C.textFaint, marginBottom: 4,
                }}>
                  Date of Issue
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>{issuedDate}</p>
              </div>

              {/* Signature */}
              <div style={{ textAlign: "center" }}>
                <p style={{
                  fontFamily: "'Brush Script MT', cursive, Georgia, serif",
                  fontSize: 30, color: C.violetDk, opacity: 0.7, marginBottom: 4,
                }}>
                  QuizShazam
                </p>
                <div style={{ width: 160, height: 1, background: C.border, margin: "0 auto 4px" }} />
                <p style={{
                  fontFamily: "sans-serif", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.28em", textTransform: "uppercase", color: C.textFaint,
                }}>
                  Authorized Signature
                </p>
              </div>

              {/* QR + cert ID */}
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                {qrDataUrl ? (
                  <div style={{
                    padding: 6, border: `1px solid ${C.border}`, borderRadius: 10,
                    background: C.bg, boxShadow: "0 1px 4px #0001",
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="Certificate QR" width={96} height={96} style={{ display: "block" }} />
                  </div>
                ) : (
                  <div style={{
                    width: 108, height: 108, borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.bgMuted,
                  }} />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <IoIdCardOutline size={10} color={C.textFaint} />
                  <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.1em", color: C.textFaint }}>
                    {certShortId}
                  </span>
                </div>
                <p style={{ fontFamily: "sans-serif", fontSize: 9, color: C.textFaint }}>Scan to verify</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <p className="text-center text-xs mt-5" style={{ color: "#94a3b8" }}>
        Scan the QR code to verify this certificate · ID: {certShortId}
      </p>
    </div>
  );
}
