"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { chat } from "@/lib/api";
import Cookies from "js-cookie";
import { IoChatbubbleEllipses, IoClose, IoSend, IoSparklesOutline } from "react-icons/io5";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  
  const { mutate: sendChat, isPending } = useMutation({
    mutationFn: chat
  });

  const getToken = () => {
    const data = Cookies.get("user");
    return data ? JSON.parse(data).token : null;
  };

  const allSuggestions = [
    "What is my score?",
    "Show me available quizzes",
    "Who is the developer?",
    "Explain React Hooks",
    "How to use this platform?"
  ];

  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions(allSuggestions.slice(0, 3));
    } else {
      const filtered = allSuggestions.filter(s => 
        s.toLowerCase().includes(input.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 3));
    }
  }, [input]);

  const processSend = (text) => {
    if (!text.trim() || isPending) return;
    
    const newMsg = { sender: "user", text };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    sendChat(
      { values: { message: text }, token: getToken() },
      {
        onSuccess: (data) => {
          setMessages((prev) => [...prev, { sender: "bot", text: data }]);
        },
        onError: (error) => {
          const errorMsg = error.response?.status === 401 
            ? "Please log in to chat with me! 🔐" 
            : "Oops! I'm having trouble connecting. Please try again later.";
          setMessages((prev) => [...prev, { sender: "bot", text: errorMsg }]);
        },
      }
    );
  };

  const handleSend = () => processSend(input);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isPending]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ 
        sender: "bot", 
        text: "Hi! I'm your AI Quiz Assistant. How can I help you today? ✨" 
      }]);
    }
  }, [isOpen, messages.length]);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-32px)] sm:w-[400px] h-[70vh] sm:h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 sm:p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <IoSparklesOutline size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">QuizBuddy AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                  <span className="text-[10px] text-violet-100">Always online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <IoClose size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.sender === "user" 
                    ? "bg-violet-600 text-white rounded-br-none" 
                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Suggestions */}
          {suggestions.length > 0 && !isPending && (
            <div className="px-3 py-2 sm:px-4 bg-white border-t border-slate-50 overflow-x-auto no-scrollbar">
              <div className="flex flex-nowrap gap-2 min-w-max pb-1">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => processSend(s)}
                    className="text-[10px] sm:text-[11px] font-medium bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full hover:bg-violet-600 hover:text-white transition-all duration-200 border border-violet-100 whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isPending}
              className="flex-shrink-0 bg-violet-600 text-white p-2.5 rounded-xl hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-200"
            >
              <IoSend size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen 
            ? "bg-white text-slate-600 rotate-90" 
            : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-110 active:scale-95"
        }`}
      >
        {isOpen ? <IoClose size={24} className="sm:hidden" /> : <IoChatbubbleEllipses size={24} className="sm:hidden" />}
        {isOpen ? <IoClose size={28} className="hidden sm:block" /> : <IoChatbubbleEllipses size={28} className="hidden sm:block" />}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}
