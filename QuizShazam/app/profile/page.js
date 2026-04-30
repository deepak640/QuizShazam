"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { message } from "antd";
import dynamic from "next/dynamic";
import Loader from "@/components/Loader";
import { getProfile, mailPasswordLink, userStats } from "@/lib/api";
import { IoArrowForward, IoTrophyOutline, IoBarChartOutline, IoBookOutline } from "react-icons/io5";

const BarChart = dynamic(() => import("@/components/BarChart"), { ssr: false });

export default function Profile() {
  const { token } = JSON.parse(Cookies.get("user") || "{}");
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: userData, isLoading } = useQuery({ queryKey: ["profile", { token }], queryFn: getProfile });
  const { mutate: sendMail } = useMutation({ mutationFn: mailPasswordLink });
  const obj = { userid: userData?.profile._id };
  const { data: stats } = useQuery({
    queryKey: ["stats", { token, obj }],
    queryFn: userStats,
    enabled: !!userData?.profile._id,
  });

  if (isLoading) return <Loader />;
  const { profile, quizzes } = userData;

  const handleSendMail = () => {
    sendMail(
      { values: { email: profile.email }, token },
      {
        onSuccess: (d) => messageApi.success(d.message),
        onError: (e) => messageApi.error(e.response?.data?.error),
      }
    );
  };

  const bestScore = stats?.length ? Math.max(...stats.map((s) => s.score || 0)) : 0;
  const avgScore = stats?.length ? Math.round(stats.reduce((a, s) => a + (s.score || 0), 0) / stats.length) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {contextHolder}

      {/* Profile hero card */}
      <div className="relative bg-gradient-to-r from-violet-700 to-indigo-500 rounded-3xl p-8 overflow-hidden shadow-xl shadow-violet-200">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={profile.photoURL}
                alt="profile"
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-0.5">{profile.username}</h2>
              <p className="text-violet-200 text-sm">{profile.email}</p>
              <span className="inline-block mt-2 text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} completed
              </span>
            </div>
          </div>
          {!profile.password && (
            <button
              onClick={handleSendMail}
              className="flex-shrink-0 bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition shadow-sm"
            >
              Set Password
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <IoBookOutline size={20} />, label: "Quizzes Taken", value: quizzes.length, color: "text-violet-700 bg-violet-50" },
          { icon: <IoTrophyOutline size={20} />, label: "Best Score", value: bestScore, color: "text-amber-600 bg-amber-50" },
          { icon: <IoBarChartOutline size={20} />, label: "Avg. Score", value: avgScore, color: "text-indigo-600 bg-indigo-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quizzes taken */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-slate-800 text-lg">Completed Quizzes</h3>
          <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{quizzes.length} total</span>
        </div>
        {quizzes.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizzes.map((q, i) => (
              <button
                key={i}
                onClick={() => router.push(`/profile/quiz/${q._id}`)}
                className="card-lift group text-left border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-violet-200 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {q.title?.charAt(0) || "Q"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-700 text-sm truncate">{q.title}</h4>
                    <p className="text-slate-400 text-xs truncate">{q.description}</p>
                  </div>
                </div>
                <IoArrowForward className="text-slate-300 group-hover:text-violet-600 transition flex-shrink-0" />
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

      {/* Stats chart */}
      {stats?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-lg mb-5">Score History</h3>
          <BarChart userStats={stats} />
        </div>
      )}
    </div>
  );
}
