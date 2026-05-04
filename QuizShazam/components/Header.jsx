"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { Modal } from "antd";
import Chatbot from "./Chatbot";
import { IoFlashOutline, IoPersonOutline, IoChatbubbleEllipsesOutline, IoLogOutOutline, IoMenuOutline, IoCloseOutline } from "react-icons/io5";

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setNavActive(false);
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

      <nav
        className={`sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-100"
            : "bg-white border-b border-slate-100"
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-700 to-indigo-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition">
            <IoFlashOutline className="text-white" size={16} />
          </div>
          <span className="text-lg font-extrabold gradient-text">
            QuizShazam
          </span>
        </button>

        {/* Right side */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
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

            {navActive && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
                  onClick={() => setNavActive(false)}
                >
                  <IoPersonOutline size={16} /> Profile
                </Link>
                <button
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition"
                  onClick={() => {
                    setNavActive(false);
                    setChatOpen(true);
                  }}
                >
                  <IoChatbubbleEllipsesOutline size={16} /> AI Assistant
                </button>
                <div className="my-1 border-t border-slate-50" />
                <button
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                  onClick={handleLogout}
                >
                  <IoLogOutOutline size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-violet-700 transition"
              >
                Home
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-violet-700 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-gradient-to-r from-violet-700 to-indigo-500 text-white px-5 py-2 rounded-full hover:opacity-90 transition shadow-sm shadow-violet-100"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu */}
            <button
              className="md:hidden text-slate-700 hover:text-violet-700 transition"
              onClick={() => setNavActive((v) => !v)}
            >
              {navActive ? (
                <IoCloseOutline size={24} />
              ) : (
                <IoMenuOutline size={24} />
              )}
            </button>
            {navActive && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-slate-100 md:hidden z-50">
                <div className="flex flex-col px-6 py-4 gap-3">
                  <Link
                    href="/"
                    className="text-sm font-medium text-slate-700 py-2"
                    onClick={() => setNavActive(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-slate-700 py-2"
                    onClick={() => setNavActive(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold text-violet-700 py-2"
                    onClick={() => setNavActive(false)}
                  >
                    Create Account →
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </nav>
    </>
  );
}
