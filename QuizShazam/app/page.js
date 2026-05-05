"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { message, Skeleton } from "antd";
import { SlBadge } from "react-icons/sl";
import { IoArrowForward, IoFlashOutline, IoTrophyOutline, IoPeopleOutline, IoBookOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query";
import { getAllQuizzesPublic } from "@/lib/api";

const STATS = [
  { icon: <IoFlashOutline size={22} />, value: "50+", label: "Quizzes" },
  { icon: <IoPeopleOutline size={22} />, value: "10K+", label: "Players" },
  { icon: <IoTrophyOutline size={22} />, value: "500K+", label: "Attempts" },
];

const ABOUT_FEATURES = [
  {
    icon: <IoBookOutline size={24} className="text-violet-600" />,
    title: "Extensive Library",
    desc: "Access a wide range of topics from technical coding challenges to general trivia."
  },
  {
    icon: <IoTrophyOutline size={24} className="text-amber-500" />,
    title: "Track Progress",
    desc: "Monitor your performance over time with detailed analytics and scoring."
  },
  {
    icon: <IoShieldCheckmarkOutline size={24} className="text-emerald-500" />,
    title: "Verified Content",
    desc: "All quizzes are curated and verified to ensure high-quality learning experiences."
  }
];

function HomeContent() {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["public-quizzes"],
    queryFn: getAllQuizzesPublic
  });

  useEffect(() => {
    if (searchParams.get("auth") === "required") {
      messageApi.warning("Please log in to continue");
    }
  }, []);

  return (
    <>
      {contextHolder}

      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh min-h-[80vh] md:min-h-[88vh] flex flex-col items-center justify-center text-center px-6 py-16 md:py-24">
        {/* Decorative blobs - Hidden on very small screens to prevent clutter */}
        <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-violet-300 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-blue-300 opacity-20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 fade-up max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-800 text-[10px] md:text-xs font-semibold px-3 md:px-4 py-1.5 rounded-full mb-4 md:mb-6 uppercase tracking-widest">
            <IoFlashOutline size={14} /> #1 Quiz Platform
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-4 md:mb-6 px-2">
            Test Your Knowledge,<br className="hidden sm:block" />
            <span className="gradient-text">Master Every Quiz</span>
          </h1>
          <p className="text-slate-500 text-base md:text-xl max-w-xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
            Dive into hundreds of quizzes across every topic. Challenge yourself, track your progress, and climb the leaderboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-6 sm:px-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-700 to-indigo-500 text-white px-8 py-3.5 rounded-full font-semibold hover:opacity-90 hover:scale-105 transition-all text-base shadow-lg shadow-violet-200"
            >
              Start Quizzing <IoArrowForward />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 border border-violet-200 px-8 py-3.5 rounded-full font-semibold hover:bg-violet-50 transition text-base"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 mt-12 md:mt-16 flex flex-wrap gap-4 md:gap-8 justify-center px-4">
          {STATS.map((s, i) => (
            <div key={i} className="glass rounded-2xl px-4 md:px-8 py-3 md:py-4 flex items-center gap-3 shadow-sm min-w-[120px] md:min-w-0">
              <span className="text-violet-700">{s.icon}</span>
              <div className="text-left">
                <p className="text-lg md:text-xl font-extrabold text-slate-800">{s.value}</p>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-16 md:py-24 px-6 border-y border-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4">Why Choose QuizShazam?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg">
              We provide a comprehensive platform for learners and experts alike to challenge themselves and grow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {ABOUT_FEATURES.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-slate-50 transition-colors">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm md:text-base">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Quizzes Section */}
      <section className="px-6 py-16 md:py-20 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-10 gap-4 text-center sm:text-left">
          <div>
            <p className="text-violet-700 font-semibold uppercase tracking-widest text-[10px] md:text-xs mb-2">Explore</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Available Quizzes</h2>
            <p className="text-slate-500 mt-2 text-sm md:text-base">Pick a topic and start your journey towards mastery.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-1 text-violet-700 font-semibold text-sm hover:gap-2 transition-all">
            See all quizzes <IoArrowForward />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <Skeleton active paragraph={{ rows: 3 }} />
              </div>
            ))
          ) : (
            quizzes?.slice(0, 6).map((quiz, i) => (
              <div key={i} className="card-lift bg-white rounded-2xl p-6 border border-violet-50 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10 flex flex-col h-full">
                  <span className="inline-block self-start text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 mb-4">
                    Quiz
                  </span>
                  <h4 className="font-bold text-slate-800 text-lg mb-2">{quiz.title}</h4>
                  <p className="text-slate-500 text-sm mb-5 leading-relaxed line-clamp-2">{quiz.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-violet-700 text-[11px] md:text-xs flex items-center gap-1.5 font-medium uppercase tracking-wider">
                      <SlBadge className="shrink-0" /> Ready to start
                    </p>
                    <Link href={`/login`} className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-700 hover:text-white transition shrink-0">
                      <IoArrowForward size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-500 p-8 md:p-12 text-center shadow-xl shadow-violet-200">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <h3 className="text-2xl md:text-4xl font-extrabold text-white mb-3 md:mb-4 relative z-10">Ready to prove yourself?</h3>
          <p className="text-violet-100 mb-8 md:mb-10 text-sm md:text-lg max-w-lg mx-auto relative z-10">Join thousands of learners who sharpen their mind every day.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-8 py-3.5 rounded-full hover:scale-105 transition-transform relative z-10 shadow-lg text-sm md:text-base">
            Get Started Free <IoArrowForward />
          </Link>
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
