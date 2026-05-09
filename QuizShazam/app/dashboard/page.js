"use client";
import { useQuery } from "@tanstack/react-query";
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
  const { data, isLoading } = useQuery({
    queryKey: ["quizzes", { token }],
    queryFn: getQuizzes
  });

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

      {/* Quiz grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((quiz, i) => {
          const isTaken = quizzesTaken?.quizzesTaken?.includes(quiz._id);
          const colorClass = COLORS[i % COLORS.length];
          return (
            <div
              key={i}
              className={`group relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                isTaken ? "border-slate-100 opacity-80" : "border-violet-50 card-lift"
              }`}
            >
              {/* Desktop: Color accent bar at top */}
              <div className={`hidden sm:block h-1.5 bg-gradient-to-r ${colorClass}`} />

              <div className="p-4 sm:p-6">
                {/* Mobile: Horizontal Layout | Desktop: Vertical Layout */}
                <div className="flex sm:flex-col gap-4 sm:gap-0">
                  
                  {/* Icon/Thumbnail */}
                  <div className={`shrink-0 w-16 h-16 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-lg sm:text-base shadow-lg shadow-violet-200/50 sm:mb-4`}>
                    {quiz.title?.charAt(0) || "Q"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <h5 className="font-bold text-slate-800 text-sm sm:text-base truncate leading-snug pr-2">
                        {quiz.title}
                      </h5>
                      {isTaken && (
                        <IoCheckmarkCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                      )}
                    </div>

                    <p className="text-slate-500 text-[11px] sm:text-sm mb-3 sm:mb-4 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                          {quiz.questions?.length || 0} Questions
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          By {quiz.author?.split(" ")[0] || "Admin"}
                        </span>
                      </div>

                      {!isTaken && (
                        <Link
                          href={`/dashboard/quiz/${quiz._id}`}
                          className={`flex items-center justify-center w-8 h-8 sm:w-auto sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r ${colorClass} text-white transition-transform active:scale-95 shadow-md shadow-violet-200/50`}
                        >
                          <span className="hidden sm:inline text-xs font-bold mr-1">Start</span>
                          <IoArrowForward size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: Finished Indicator */}
              {isTaken && (
                <div className="sm:hidden absolute top-0 right-0">
                   <div className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                     DONE
                   </div>
                </div>
              )}
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
