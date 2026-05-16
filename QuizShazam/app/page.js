"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { message, Skeleton } from "antd";
import { IoArrowForward } from "react-icons/io5";
import { SlBadge } from "react-icons/sl";
import { useQuery } from "@tanstack/react-query";
import { getAllQuizzesPublic } from "@/lib/api";
import { motion, useInView, useAnimation } from "framer-motion";
import {
  Shield, RefreshCw, Bot, Trophy, BarChart3, Monitor,
  Timer, Layers, Lock, TrendingUp, CheckCircle, XCircle,
  ArrowRight, Star, Zap, Users, BookOpen, Award
} from "lucide-react";

const FEATURES = [
  { icon: Shield, title: "Real-time Auto-Save", desc: "Every answer is saved instantly. No progress is ever lost, even if the browser crashes.", color: "#6d28d9" },
  { icon: RefreshCw, title: "Resume After Disconnect", desc: "Students can resume exactly where they left off after any interruption.", color: "#7c3aed" },
  { icon: Bot, title: "AI-Powered Assistant", desc: "Built-in AI chatbot helps students and admins with instant answers.", color: "#5b21b6" },
  { icon: Trophy, title: "Advanced Leaderboard", desc: "Real-time competitive leaderboards to keep students engaged and motivated.", color: "#d97706" },
  { icon: BarChart3, title: "Admin Analytics Dashboard", desc: "Track completion rates, scores, and student performance at a glance.", color: "#059669" },
  { icon: Monitor, title: "Multi-Device Support", desc: "Works seamlessly on desktop, tablet, and mobile browsers.", color: "#0284c7" },
  { icon: Timer, title: "Timer-Based Assessments", desc: "Per-question timers with automatic submission when time expires.", color: "#dc2626" },
  { icon: Layers, title: "Scalable Architecture", desc: "Built on MongoDB + Express to handle thousands of concurrent sessions.", color: "#7c3aed" },
  { icon: Lock, title: "Role-Based Authentication", desc: "Separate access controls for students, admins, and super-admins.", color: "#374151" },
  { icon: TrendingUp, title: "Performance Tracking", desc: "Detailed analytics showing improvement trends over time.", color: "#16a34a" },
];

const STATS = [
  { value: 500, suffix: "+", label: "Quizzes Created" },
  { value: 10000, suffix: "+", label: "Assessments Completed" },
  { value: 99.9, suffix: "%", label: "Session Recovery Rate", decimal: true },
  { value: 40, suffix: "%", label: "Completion Improvement" },
  { value: 5000, suffix: "+", label: "Active Users" },
];

const USE_CASES = [
  { icon: BookOpen, title: "Schools & Colleges", desc: "Conduct class tests, mid-terms and finals with auto-grading and result publishing.", color: "#6d28d9" },
  { icon: Award, title: "Coaching Institutes", desc: "Run JEE, NEET, CAT prep tests with timed sections and detailed analytics.", color: "#d97706" },
  { icon: Users, title: "HR Screening", desc: "Screen candidates at scale with standardized assessments and instant scoring.", color: "#059669" },
  { icon: Zap, title: "Corporate Training", desc: "Track employee training completion and knowledge retention over time.", color: "#0284c7" },
  { icon: Trophy, title: "Online Certifications", desc: "Issue digital certificates upon passing with verifiable completion records.", color: "#dc2626" },
  { icon: BarChart3, title: "Coding Assessments", desc: "Technical screening tests with performance insights for engineering teams.", color: "#7c3aed" },
];

const TESTIMONIALS = [
  { initials: "RK", name: "Rajesh Kumar", role: "Principal", company: "DPS Academy", rating: 5, text: "QuizShazam transformed our online exam experience. The auto-save feature alone has eliminated so many student complaints about lost progress." },
  { initials: "PS", name: "Priya Sharma", role: "HR Manager", company: "TechCorp India", rating: 5, text: "We screen 500+ candidates monthly. The platform handles everything smoothly and the admin dashboard gives us exactly the insights we need." },
  { initials: "AM", name: "Ankit Mehta", role: "Coaching Director", company: "Momentum Classes", rating: 5, text: "The leaderboard feature has made students more competitive and engaged. Our completion rates went up by over 40% in the first month." },
];

const HOW_IT_WORKS = [
  { step: 1, icon: BookOpen, title: "Create Assessment", desc: "Upload via Excel or use our form builder to create quizzes with timers, multi-select, and explanations." },
  { step: 2, icon: Users, title: "Share With Users", desc: "Students access quizzes from the dashboard. No app install needed — works in any browser." },
  { step: 3, icon: Monitor, title: "Track Progress", desc: "Watch real-time session data. Students can pause and resume without losing any answers." },
  { step: 4, icon: BarChart3, title: "Analyze Results", desc: "Get detailed score reports, topic-wise breakdowns, and leaderboard rankings instantly." },
];

const PAIN_POINTS = [
  "Students losing quiz progress mid-exam",
  "Browser crashes destroying hours of work",
  "Weak admin tools with no real data",
  "No real-time analytics or insights",
  "Poor student engagement and low completion",
];

const SOLUTIONS = [
  "Automatic session persistence on every answer",
  "Resume assessments instantly after any crash",
  "Live admin dashboard with full control",
  "Real-time progress tracking and reporting",
  "Gamified leaderboards driving engagement",
];

const PLATFORM_SCREENS = [
  { title: "Quiz Dashboard", accent: "#6d28d9", rows: ["JavaScript Fundamentals  •  15 Qs", "React Advanced   •  20 Qs  •  Timer", "Data Structures   •  25 Qs"] },
  { title: "Leaderboard", accent: "#d97706", rows: ["🥇  Ankit M.   •  98/100", "🥈  Priya S.    •  95/100", "🥉  Rahul K.   •  91/100"] },
  { title: "Analytics Panel", accent: "#059669", rows: ["Avg Score: 78%   ↑ 12%", "Completion: 94%  ↑ 8%", "Sessions Today: 142"] },
  { title: "Quiz Creator", accent: "#0284c7", rows: ["+ Add Question", "✓ Set Timer: 30s", "✓ Mark: Multi-select"] },
  { title: "Resume Session", accent: "#dc2626", rows: ["Last saved: 2 min ago", "Progress: Q8 of 20", "▶  Resume Now"] },
  { title: "Certificate", accent: "#7c3aed", rows: ["✓  Score: 92%   PASSED", "Issued: May 2026", "🏅  Download PDF"] },
];

function AnimatedCounter({ value, suffix, decimal }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(decimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value, decimal]);

  return (
    <span ref={ref}>
      {decimal ? count.toFixed(1) : count.toLocaleString()}{suffix}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function SectionWrapper({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["public-quizzes"],
    queryFn: getAllQuizzesPublic,
  });

  useEffect(() => {
    if (searchParams.get("auth") === "required") {
      messageApi.warning("Please log in to continue");
    }
  }, []);

  return (
    <>
      {contextHolder}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-mesh min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ background: "rgba(109,40,217,0.18)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" style={{ background: "rgba(59,130,246,0.15)" }} />

        <motion.div
          className="relative z-10 max-w-3xl"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-800 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <Zap size={13} /> Professional Assessment Platform
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Reliable Online Assessments<br className="hidden sm:block" />
            <span className="gradient-text"> That Never Lose Progress</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Built for coaching institutes, schools, corporate training, and certification platforms. Auto-save, resume anywhere, AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 text-white px-8 py-3.5 rounded-full font-semibold hover:opacity-90 hover:scale-105 transition-all text-base shadow-lg"
              style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
            >
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 border border-violet-200 px-8 py-3.5 rounded-full font-semibold hover:bg-violet-50 transition text-base"
            >
              Explore Platform
            </Link>
          </div>
        </motion.div>

        {/* Floating badge cards */}
        <div className="relative z-10 mt-14 w-full max-w-3xl">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {["Auto-Save", "Resume Anytime", "AI Powered", "Real-time Analytics"].map((badge, i) => (
              <motion.span
                key={badge}
                className="glass px-4 py-2 rounded-full text-sm font-semibold text-violet-700 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                ✓ {badge}
              </motion.span>
            ))}
          </div>

          {/* Dashboard mockup */}
          <motion.div
            className="glass rounded-2xl p-5 shadow-xl max-w-lg mx-auto text-left"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-slate-700 text-sm">My Active Quiz</span>
              <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">⏱ 04:32</span>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress: Q8 of 20</span>
                <span>40%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "40%", background: "linear-gradient(90deg, #6d28d9, #4f46e5)" }} />
              </div>
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-3">
              <Shield size={12} /> Auto-saved 2 seconds ago
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS TRUST BAR ── */}
      <section className="bg-white border-y border-slate-100 py-14 px-6">
        <SectionWrapper className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div key={i} variants={fadeUp}>
              <p className="text-3xl font-extrabold" style={{ color: "#6d28d9" }}>
                <AnimatedCounter value={s.value} suffix={s.suffix} decimal={s.decimal} />
              </p>
              <p className="text-slate-500 text-sm mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </SectionWrapper>
      </section>

      {/* ── CORE FEATURES ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-violet-700 font-semibold uppercase tracking-widest text-xs">Features</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Everything You Need</h2>
              <p className="text-slate-500 mt-3 max-w-xl mx-auto">A complete assessment platform with enterprise-grade reliability and simplicity.</p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="card-lift bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color + "18" }}>
                      <Icon size={20} style={{ color: f.color }} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{f.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── PROBLEM / SOLUTION ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">We Solve Real Problems</h2>
              <p className="text-slate-500 mt-3">Stop losing student data and start running assessments with confidence.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <motion.div variants={fadeUp} className="space-y-4">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Before QuizShazam</h3>
                {PAIN_POINTS.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-50 rounded-xl px-4 py-3">
                    <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 text-sm">{p}</span>
                  </div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp} className="space-y-4">
                <h3 className="font-bold text-lg text-slate-800 mb-4">After QuizShazam</h3>
                {SOLUTIONS.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-emerald-50 rounded-xl px-4 py-3">
                    <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 text-sm">{s}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── PLATFORM SHOWCASE ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-violet-700 font-semibold uppercase tracking-widest text-xs">Platform</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">See It In Action</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLATFORM_SCREENS.map((screen, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 card-lift">
                  <div className="h-1.5 w-full" style={{ background: screen.accent }} />
                  <div className="p-5">
                    <p className="font-bold text-slate-800 mb-4 text-sm">{screen.title}</p>
                    <div className="space-y-2">
                      {screen.rows.map((row, j) => (
                        <div key={j} className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 font-medium">{row}</div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-violet-700 font-semibold uppercase tracking-widest text-xs">Process</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">How It Works</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {HOW_IT_WORKS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div key={i} variants={fadeUp} className="text-center relative">
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-[60%] w-full border-t-2 border-dashed border-violet-200" />
                    )}
                    <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}>
                      {step.step}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                      <Icon size={20} className="text-violet-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-violet-700 font-semibold uppercase tracking-widest text-xs">Use Cases</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Built For Every Team</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {USE_CASES.map((uc, i) => {
                const Icon = uc.icon;
                return (
                  <motion.div key={i} variants={fadeUp} className="card-lift bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: uc.color + "18" }}>
                      <Icon size={22} style={{ color: uc.color }} />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2">{uc.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{uc.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── TECHNICAL EXCELLENCE ── */}
      <section className="py-16 px-6 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Technical Excellence</h2>
              <p className="text-slate-500 mt-2 text-sm">Enterprise-grade infrastructure, simplified.</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Session Recovery", icon: RefreshCw, color: "#6d28d9" },
                { label: "Secure Auth", icon: Lock, color: "#374151" },
                { label: "Cloud-Ready", icon: Layers, color: "#0284c7" },
                { label: "High Scalability", icon: TrendingUp, color: "#059669" },
                { label: "Fast API", icon: Zap, color: "#d97706" },
                { label: "AI Integration", icon: Bot, color: "#7c3aed" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div key={i} variants={fadeUp} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: item.color + "15" }}>
                      <Icon size={18} style={{ color: item.color }} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="text-violet-700 font-semibold uppercase tracking-widest text-xs">Testimonials</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-2">Trusted By Educators</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} variants={fadeUp} className="card-lift bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {Array(t.rating).fill(0).map((_, j) => (
                      <Star key={j} size={14} fill="#f59e0b" className="text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">{t.text}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role}, {t.company}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionWrapper>
            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center shadow-xl"
              style={{ background: "linear-gradient(135deg, #4c1d95, #1e1b4b)" }}
            >
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 relative z-10">
                Ready to Modernize Your Assessment Platform?
              </h2>
              <p className="text-purple-200 mb-10 max-w-lg mx-auto relative z-10">
                Join 5,000+ educators and HR teams already running better assessments with QuizShazam.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link href="/register" className="inline-flex items-center gap-2 bg-white font-bold px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-lg text-sm" style={{ color: "#6d28d9" }}>
                  Start Using QuizShazam <ArrowRight size={16} />
                </Link>
                <Link href="/dashboard" className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white hover:text-purple-900 transition text-sm">
                  Schedule Demo
                </Link>
              </div>
            </motion.div>
          </SectionWrapper>
        </div>
      </section>

      {/* ── AVAILABLE QUIZZES ── */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionWrapper>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-violet-700 font-semibold uppercase tracking-widest text-xs">Live</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">Available Quizzes</h2>
                <p className="text-slate-500 mt-1 text-sm">Pick a topic and start your journey right now.</p>
              </div>
              <Link href="/dashboard" className="inline-flex items-center gap-1 text-violet-700 font-semibold text-sm hover:gap-2 transition-all">
                See all quizzes <IoArrowForward />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {isLoading
                ? Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </div>
                  ))
                : quizzes?.slice(0, 6).map((quiz, i) => (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      className="card-lift bg-white rounded-2xl p-6 border border-violet-50 shadow-sm relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                      <div className="relative z-10 flex flex-col h-full">
                        <span className="inline-block self-start text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 mb-4">
                          Quiz
                        </span>
                        <h4 className="font-bold text-slate-800 text-lg mb-2">{quiz.title}</h4>
                        <p className="text-slate-500 text-sm mb-5 leading-relaxed line-clamp-2">{quiz.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <p className="text-violet-700 text-xs flex items-center gap-1.5 font-medium uppercase tracking-wider">
                            <SlBadge className="shrink-0" /> Ready to start
                          </p>
                          <Link href="/login" className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-700 hover:text-white transition shrink-0">
                            <IoArrowForward size={14} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
            </div>
          </SectionWrapper>
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
