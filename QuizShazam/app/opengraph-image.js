import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QuizShazam — Test Your Knowledge & Master Every Quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5b21b6 0%, #4f46e5 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Glow blob */}
        <div
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "rgba(139,92,246,0.4)",
            filter: "blur(80px)",
            top: -100,
            right: -100,
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.5px",
            }}
          >
            QuizShazam
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 900,
            zIndex: 1,
            marginBottom: 24,
          }}
        >
          Test Your Knowledge,
          <br />
          Master Every Quiz
        </div>

        {/* Sub text */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(221,214,254,0.9)",
            textAlign: "center",
            zIndex: 1,
            marginBottom: 40,
          }}
        >
          DSA · JavaScript · React · SQL · Next.js
        </div>

        {/* Pill badges */}
        <div style={{ display: "flex", gap: 16, zIndex: 1 }}>
          {["50+ Quizzes", "10K+ Players", "Free Forever"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 100,
                padding: "10px 24px",
                fontSize: 20,
                color: "white",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
