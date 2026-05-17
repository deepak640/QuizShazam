"use client";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { message } from "antd";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { getProfile, userStats, getUserBadges } from "@/lib/api";
import { useRef, useState } from "react";
import {
  IoArrowForward, IoTrophyOutline, IoBarChartOutline, IoBookOutline,
  IoCallOutline, IoRibbonOutline, IoShareOutline, IoChevronBack, IoChevronForward,
  IoFlameOutline, IoSparklesOutline,
} from "react-icons/io5";

const BarChart = dynamic(() => import("@/components/BarChart"), { ssr: false });

function BadgeCard({ b }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        b.earned ? "border-violet-100 bg-violet-50/60" : "border-slate-100 bg-slate-50/50 opacity-40 grayscale"
      }`}
    >
      <span className="text-2xl leading-none shrink-0">{b.icon}</span>
      <div className="min-w-0">
        <p className={`text-xs font-bold truncate ${b.earned ? "text-slate-800" : "text-slate-500"}`}>{b.label}</p>
        <p className="text-[10px] text-slate-400 truncate leading-tight">{b.desc}</p>
        {b.earned && b.earnedAt && (
          <p className="text-[10px] text-violet-500 font-medium mt-0.5">
            {new Date(b.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}

const CARD_WIDTH = 196 + 12; // w-48 (192px) + gap-3 (12px)

function BadgesSection({ badges, earnedBadges }) {
  const sliderRef = useRef(null);
  const [activeIndex, setActiveIndex]       = useState(0);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(badges.length > 1);

  const updateScrollState = () => {
    const el = sliderRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / CARD_WIDTH);
    setActiveIndex(Math.min(idx, badges.length - 1));
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollToIndex = (idx) => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * CARD_WIDTH, behavior: "smooth" });
  };

  const scroll = (dir) => {
    const next = Math.max(0, Math.min(badges.length - 1, activeIndex + dir));
    scrollToIndex(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
          <IoRibbonOutline className="text-violet-500" size={17} /> Achievements
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
            {earnedBadges.length}/{badges.length}
          </span>
          {/* Slider arrows — only on mobile */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                canScrollLeft ? "border-violet-200 text-violet-600 hover:bg-violet-50" : "border-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              <IoChevronBack size={14} />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                canScrollRight ? "border-violet-200 text-violet-600 hover:bg-violet-50" : "border-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              <IoChevronForward size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: horizontal slider */}
      <div className="sm:hidden">
        <div
          ref={sliderRef}
          onScroll={updateScrollState}
          className="no-scrollbar flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        >
          {badges.map((b) => (
            <div key={b.id} className="shrink-0 w-48">
              <BadgeCard b={b} />
            </div>
          ))}
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {badges.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-5 bg-violet-600" : "w-1.5 bg-slate-200 hover:bg-violet-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* sm+: responsive grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3">
        {badges.map((b) => (
          <BadgeCard key={b.id} b={b} />
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: userData, isLoading } = useQuery({ queryKey: ["profile", { token }], queryFn: getProfile });
  const obj = { userid: userData?.profile._id };
  const { data: stats } = useQuery({
    queryKey: ["stats", { token, obj }],
    queryFn: userStats,
    enabled: !!userData?.profile._id,
  });
  const { data: badgesData } = useQuery({
    queryKey: ["badges", { token }],
    queryFn: getUserBadges,
    enabled: !!token,
  });

  if (isLoading) return <Loader />;
  if (!userData?.profile) return <Loader />;
  const { profile, quizzes } = userData;

  const bestScore = stats?.length ? Math.max(...stats.map((s) => s.score || 0)) : 0;
  const avgScore  = stats?.length ? Math.round(stats.reduce((a, s) => a + (s.score || 0), 0) / stats.length) : 0;

  const badges       = badgesData?.badges || [];
  const earnedBadges = badges.filter((b) => b.earned);

  // Always use email prefix as slug — it's URL-safe and unique
  const profileSlug = profile.email?.split("@")[0] || profile.username?.toLowerCase().replace(/\s+/g, "-");

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/u/${profileSlug}`;
    const name = profile.username || profileSlug;
    if (navigator.share) {
      await navigator.share({ title: `${name} on QuizShazam`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      messageApi.success("Profile link copied!");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-8">
      {contextHolder}

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-violet-700 to-indigo-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 overflow-hidden shadow-xl shadow-violet-200">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          {/* Avatar + info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={profile.photoURL} alt="profile"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover border-4 border-white/30 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate">{profile.username}</h2>
              <p className="text-violet-200 text-xs sm:text-sm truncate">{profile.email}</p>
              {profile.bio && (
                <p className="text-violet-100 text-xs mt-1 line-clamp-2 max-w-xs">{profile.bio}</p>
              )}
              {profile.phone && (
                <p className="text-violet-200 text-xs mt-1 flex items-center gap-1">
                  <IoCallOutline size={11} /> {profile.phone}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                  {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} done
                </span>
                {earnedBadges.length > 0 && (
                  <span className="text-xs bg-yellow-400/20 text-yellow-200 px-2.5 py-1 rounded-full font-medium">
                    {earnedBadges.length} badge{earnedBadges.length !== 1 ? "s" : ""}
                  </span>
                )}
                {profile.xp > 0 && (
                  <span className="text-xs bg-violet-400/20 text-violet-100 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <IoSparklesOutline size={10} /> {profile.xp} XP
                  </span>
                )}
                {profile.streak > 0 && (
                  <span className="text-xs bg-orange-400/20 text-orange-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <IoFlameOutline size={10} /> {profile.streak} day streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Share button */}
          {profile.username && (
            <button
              onClick={handleShareProfile}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all shrink-0"
            >
              <IoShareOutline size={13} /> Share
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: <IoBookOutline size={18} />,     label: "Quizzes Taken", value: quizzes.length,   color: "text-violet-700 bg-violet-50" },
          { icon: <IoTrophyOutline size={18} />,   label: "Best Score",    value: bestScore,         color: "text-amber-600  bg-amber-50"  },
          { icon: <IoSparklesOutline size={18} />, label: "Total XP",      value: `${profile.xp || 0} XP`, color: "text-purple-600 bg-purple-50" },
          { icon: <IoFlameOutline size={18} />,    label: "Day Streak",    value: profile.streak || 0, color: "text-orange-500 bg-orange-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-5 text-center">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-lg sm:text-2xl font-extrabold text-slate-800">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Completed quizzes ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">Completed Quizzes</h3>
          <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{quizzes.length} total</span>
        </div>

        {quizzes.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {quizzes.map((q, i) => (
              <button
                key={i}
                onClick={() => router.push(`/profile/quiz/${q._id}`)}
                className={`card-lift group text-left border rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 transition w-full ${
                  q.isDeleted ? "border-slate-100 opacity-60 hover:opacity-80" : "border-slate-100 hover:border-violet-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                    q.isDeleted ? "bg-slate-400" : "bg-gradient-to-br from-violet-600 to-indigo-500"
                  }`}>
                    {q.title?.charAt(0) || "Q"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-semibold text-slate-700 text-sm truncate">{q.title}</h4>
                      {q.isDeleted && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs truncate">
                      {q.isDeleted ? "This quiz has been archived" : q.description}
                    </p>
                  </div>
                </div>
                <IoArrowForward className="text-slate-300 group-hover:text-violet-600 transition shrink-0" size={16} />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-slate-500 font-medium">No quizzes completed yet</p>
            <p className="text-slate-400 text-sm mt-1">Head to the dashboard to take your first quiz!</p>
          </div>
        )}
      </div>

      {/* ── Badges ─────────────────────────────────────────────────────────── */}
      {badges.length > 0 && <BadgesSection badges={badges} earnedBadges={earnedBadges} />}

      {/* ── Score history chart ─────────────────────────────────────────────── */}
      {stats?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg mb-4 sm:mb-5">Score History</h3>
          <div className="overflow-x-auto">
            <BarChart userStats={stats} />
          </div>
        </div>
      )}
    </div>
  );
}
