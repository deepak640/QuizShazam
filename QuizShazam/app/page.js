"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { message } from "antd";
import { SlBadge } from "react-icons/sl";
import { IoArrowForward, IoFlashOutline, IoTrophyOutline, IoPeopleOutline } from "react-icons/io5";

const FEATURED = [
  { title: "General Knowledge", desc: "Test your knowledge across history, science, and pop culture.", score: 98, tag: "Popular" },
  { title: "Science & Tech", desc: "Explore the cutting edge of technology and natural sciences.", score: 95, tag: "Trending" },
  { title: "World Geography", desc: "How well do you know the world's countries and capitals?", score: 91, tag: "New" },
];

const STATS = [
  { icon: <IoFlashOutline size={22} />, value: "50+", label: "Quizzes" },
  { icon: <IoPeopleOutline size={22} />, value: "10K+", label: "Players" },
  { icon: <IoTrophyOutline size={22} />, value: "500K+", label: "Attempts" },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (searchParams.get("auth") === "required") {
      messageApi.warning("Please log in to continue");
    }
  }, []);

  return (
    <>
      {contextHolder}

      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh min-h-[88vh] flex flex-col items-center justify-center text-center px-6 py-24">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-300 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 opacity-20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 fade-up max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-violet-100 text-violet-800 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <IoFlashOutline size={14} /> #1 Quiz Platform
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Test Your Knowledge,<br />
            <span className="gradient-text">Master Every Quiz</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Dive into hundreds of quizzes across every topic. Challenge yourself, track your progress, and climb the leaderboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-700 to-indigo-500 text-white px-8 py-3.5 rounded-full font-semibold hover:opacity-90 hover:scale-105 transition-all text-base shadow-lg shadow-violet-200"
            >
              Start Quizzing <IoArrowForward />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-violet-700 border border-violet-200 px-8 py-3.5 rounded-full font-semibold hover:bg-violet-50 transition text-base"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 mt-16 flex flex-wrap gap-8 justify-center">
          {STATS.map((s, i) => (
            <div key={i} className="glass rounded-2xl px-8 py-4 flex items-center gap-3 shadow-sm">
              <span className="text-violet-700">{s.icon}</span>
              <div className="text-left">
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured quizzes */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-violet-700 font-semibold uppercase tracking-widest text-xs mb-2">Featured</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Challenge Yourself</h2>
            <p className="text-slate-500 mt-2">Handpicked quizzes to put your skills to the test.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-violet-700 font-semibold text-sm hover:gap-2 transition-all">
            See all quizzes <IoArrowForward />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURED.map((quiz, i) => (
            <div key={i} className="card-lift bg-white rounded-2xl p-6 border border-violet-50 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-violet-100 text-violet-700 mb-4">
                  {quiz.tag}
                </span>
                <h4 className="font-bold text-slate-800 text-lg mb-2">{quiz.title}</h4>
                <p className="text-slate-500 text-sm mb-5 leading-relaxed">{quiz.desc}</p>
                <div className="flex items-center justify-between">
                  <p className="text-violet-700 text-sm flex items-center gap-1.5 font-medium">
                    <SlBadge /> Top: {quiz.score}%
                  </p>
                  <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-700 hover:text-white transition">
                    <IoArrowForward size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-500 p-10 text-center shadow-xl shadow-violet-200">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <h3 className="text-3xl font-extrabold text-white mb-3 relative z-10">Ready to prove yourself?</h3>
          <p className="text-violet-100 mb-7 relative z-10">Join thousands of learners who sharpen their mind every day.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-8 py-3.5 rounded-full hover:scale-105 transition-transform relative z-10 shadow-lg">
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
