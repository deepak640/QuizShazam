"use client";
import { useQuery } from "react-query";
import Cookies from "js-cookie";
import Link from "next/link";
import { IoArrowForward, IoCheckmarkCircle, IoSearchOutline } from "react-icons/io5";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { getQuizzes } from "@/lib/api";
import dataNotFound from "@/public/dataNotFound.json";
import { useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const COLORS = ["from-violet-600 to-indigo-500", "from-indigo-500 to-cyan-500", "from-pink-500 to-rose-500", "from-emerald-500 to-teal-500", "from-orange-500 to-amber-500", "from-violet-700 to-indigo-600"];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const { data, isLoading } = useQuery(["quizzes", { token }], getQuizzes);

  if (isLoading) return <Loader />;
  const { quizzes, quizzesTaken } = data || {};

  if (!quizzes?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Lottie animationData={dataNotFound} style={{ width: 280 }} />
        <p className="text-slate-500 font-medium">No quizzes available yet</p>
      </div>
    );
  }

  const filtered = quizzes.filter((q) =>
    q.title?.toLowerCase().includes(search.toLowerCase()) ||
    q.description?.toLowerCase().includes(search.toLowerCase())
  );

  const takenCount = quizzesTaken?.quizzesTaken?.length || 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-violet-700 font-semibold uppercase tracking-widest text-xs mb-1">Explore</p>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-1">Available Quizzes</h2>
        <p className="text-slate-500 text-sm">{quizzes.length} quizzes · {takenCount} completed</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 bg-white rounded-2xl border border-violet-50 shadow-sm p-5 flex items-center gap-5">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">Your progress</span>
            <span>{takenCount} / {quizzes.length} completed</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${quizzes.length ? (takenCount / quizzes.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-2xl font-extrabold gradient-text">
            {quizzes.length ? Math.round((takenCount / quizzes.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-400">done</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search quizzes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition shadow-sm"
        />
      </div>

      {/* Quiz grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((quiz, i) => {
          const isTaken = quizzesTaken?.quizzesTaken?.includes(quiz._id);
          const colorClass = COLORS[i % COLORS.length];
          return (
            <div
              key={i}
              className={`group relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                isTaken ? "border-slate-100 opacity-70" : "border-violet-50 card-lift"
              }`}
            >
              {/* Color accent bar */}
              <div className={`h-1.5 bg-gradient-to-r ${colorClass}`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                    {quiz.title?.charAt(0) || "Q"}
                  </div>
                  {isTaken ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                      <IoCheckmarkCircle size={13} /> Done
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                      {quiz.questions?.length || 0} Qs
                    </span>
                  )}
                </div>

                <h5 className="font-bold text-slate-800 text-base mb-1.5 leading-snug">{quiz.title}</h5>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">{quiz.description}</p>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">By {quiz.author || "Unknown"}</span>
                  {!isTaken && (
                    <Link
                      href={`/dashboard/quiz/${quiz._id}`}
                      className={`flex items-center gap-1.5 font-semibold text-sm text-white bg-gradient-to-r ${colorClass} px-4 py-1.5 rounded-full hover:opacity-90 transition shadow-sm`}
                    >
                      Start <IoArrowForward size={13} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium mb-1">No results for "{search}"</p>
          <p className="text-sm">Try a different keyword</p>
        </div>
      )}
    </div>
  );
}
