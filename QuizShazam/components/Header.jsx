"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { Modal } from "antd";
import Chatbot from "./Chatbot";
import { IoFlashOutline, IoPersonOutline, IoChatbubbleEllipsesOutline, IoLogOutOutline, IoMenuOutline, IoCloseOutline, IoSettingsOutline, IoBookOutline } from "react-icons/io5";

export default function Header() {
  const [user, setUser] = useState(null);
  const [navActive, setNavActive] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const data = Cookies.get("user");
    if (data) setUser(JSON.parse(data));

    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleClickOutside = (e) => {
      if (window.innerWidth >= 768 && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNavActive(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (navActive && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [navActive]);

  const handleLogout = () => {
    Cookies.remove("user");
    setNavActive(false);
    window.location.href = "/";
  };

  return (
    <>
      <Modal
        title={null}
        centered
        width={900}
        footer={null}
        open={chatOpen}
        onCancel={() => setChatOpen(false)}
      >
        <Chatbot />
      </Modal>

      {/* Mobile Overlay/Backdrop */}
      {navActive && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setNavActive(false)}
        />
      )}

      <nav
        className={`sticky top-0 z-[100] flex items-center justify-between px-6 py-3.5 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100"
            : "bg-white border-b border-slate-100"
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => {
            setNavActive(false);
            router.push("/");
          }}
          className="flex items-center gap-2 group relative z-[110]"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-700 to-indigo-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition">
            <IoFlashOutline className="text-white" size={16} />
          </div>
          <span className="text-lg font-extrabold gradient-text">
            QuizShazam
          </span>
        </button>

        {/* Desktop Links */}
        {!user && (
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-violet-700 transition">Home</Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-violet-700 transition">Quizzes</Link>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-3 relative z-[110]">
          {user ? (
            <div className="hidden md:block relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2.5 focus:outline-none group"
                onClick={() => setNavActive((v) => !v)}
              >
                <img
                  src={user.photoURL}
                  alt="profile"
                  className="w-9 h-9 rounded-xl object-cover border-2 border-violet-200 group-hover:border-violet-400 transition"
                />
                <span className="hidden sm:block text-sm font-semibold text-slate-700 group-hover:text-violet-700 transition">
                  {user.username}
                </span>
              </button>

              {/* User Dropdown - Desktop */}
              {navActive && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-[120] py-2 overflow-hidden hidden md:block animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.username}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
                    onClick={() => setNavActive(false)}
                  >
                    <IoPersonOutline size={17} className="text-slate-400" /> Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
                    onClick={() => setNavActive(false)}
                  >
                    <IoSettingsOutline size={17} className="text-slate-400" /> Settings
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition md:block hidden"
                    onClick={() => setNavActive(false)}
                  >
                    <IoBookOutline size={17} className="text-slate-400" /> Browse Quizzes
                  </Link>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
                    onClick={() => {
                      setNavActive(false);
                      setChatOpen(true);
                    }}
                  >
                    <IoChatbubbleEllipsesOutline size={17} className="text-slate-400" /> AI Assistant
                  </button>
                  <div className="my-1 border-t border-slate-50" />
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition font-medium"
                    onClick={handleLogout}
                  >
                    <IoLogOutOutline size={17} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-violet-700 px-4 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-linear-to-r from-violet-700 to-indigo-500 text-white px-6 py-2.5 rounded-xl hover:opacity-90 transition shadow-md shadow-violet-200/50"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-700 hover:text-violet-700 transition relative z-[110]"
            onClick={(e) => {
              e.stopPropagation();
              setNavActive((v) => !v);
            }}
          >
            {navActive ? <IoCloseOutline size={26} /> : <IoMenuOutline size={26} />}
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <div 
          className={`absolute top-0 left-0 right-0 bg-white border-b border-slate-100 shadow-2xl md:hidden z-[90] transition-all duration-300 ease-in-out transform ${
            navActive ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="pt-20 pb-8 px-6 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-4 p-4 mb-4 bg-slate-50 rounded-2xl">
                  <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                  <div>
                    <p className="font-bold text-slate-900">{user.username}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                
                <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation</p>
                <Link
                  href="/profile"
                  className="flex items-center gap-4 px-4 py-3.5 text-base font-semibold text-slate-700 hover:bg-violet-50 rounded-xl transition"
                  onClick={() => setNavActive(false)}
                >
                  <IoPersonOutline size={20} className="text-violet-600" /> My Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-4 px-4 py-3.5 text-base font-semibold text-slate-700 hover:bg-violet-50 rounded-xl transition"
                  onClick={() => setNavActive(false)}
                >
                  <IoSettingsOutline size={20} className="text-violet-600" /> Settings
                </Link>
                <button
                  className="flex items-center gap-4 w-full px-4 py-3.5 text-base font-semibold text-slate-700 hover:bg-violet-50 rounded-xl transition text-left"
                  onClick={() => {
                    setNavActive(false);
                    setChatOpen(true);
                  }}
                >
                  <IoChatbubbleEllipsesOutline size={20} className="text-violet-600" /> AI Assistant
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-4 px-4 py-3.5 text-base font-semibold text-slate-700 hover:bg-violet-50 rounded-xl transition"
                  onClick={() => setNavActive(false)}
                >
                  <IoFlashOutline size={20} className="text-violet-600" /> Browse Quizzes
                </Link>
                
                <div className="my-4 border-t border-slate-100" />
                
                <button
                  className="flex items-center gap-4 w-full px-4 py-3.5 text-base font-bold text-red-500 hover:bg-red-50 rounded-xl transition text-left"
                  onClick={handleLogout}
                >
                  <IoLogOutOutline size={22} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="px-4 py-4 text-lg font-bold text-slate-800 border-b border-slate-50"
                  onClick={() => setNavActive(false)}
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-4 text-lg font-bold text-slate-800 border-b border-slate-50"
                  onClick={() => setNavActive(false)}
                >
                  Browse Quizzes
                </Link>
                <div className="mt-6 flex flex-col gap-3 px-2">
                  <Link
                    href="/login"
                    className="w-full py-4 text-center font-bold text-slate-700 bg-slate-100 rounded-2xl hover:bg-slate-200 transition"
                    onClick={() => setNavActive(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="w-full py-4 text-center font-bold text-white bg-linear-to-r from-violet-700 to-indigo-500 rounded-2xl shadow-lg shadow-violet-200 transition"
                    onClick={() => setNavActive(false)}
                  >
                    Get Started Free
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
