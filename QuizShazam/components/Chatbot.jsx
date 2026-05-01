"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { chat } from "@/lib/api";
import Cookies from "js-cookie";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const { mutate: sendChat } = useMutation({
    mutationFn: chat
  });

  const getToken = () => {
    const data = Cookies.get("user");
    return data ? JSON.parse(data).token : null;
  };

  const allSuggestions = [
    "What is my score?",
    "Mera score kya hai?",
    "Who am I?",
    "Available quizzes",
    "Who is the developer?",
    "Namaste"
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
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setMessages((prev) => [...prev, { sender: "bot", text: "Typing..." }]);

    sendChat(
      { values: { message: text }, token: getToken() },
      {
        onSuccess: (data) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated.pop();
            return [...updated, { sender: "bot", text: data }];
          });
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated.pop();
            const errorMsg = error.response?.status === 401 
              ? "Please log in to chat with me! 🔐" 
              : "Oops! I'm having trouble connecting. Please try again later.";
            return [...updated, { sender: "bot", text: errorMsg }];
          });
        },
      }
    );
  };

  const handleSend = () => processSend(input);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${msg.sender === "user" ? "bg-purple-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t bg-gray-50/50">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => processSend(s)}
              className="text-[11px] font-medium bg-white border border-purple-100 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-200 shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={handleSend}
          className="bg-purple-600 text-white px-5 py-2 rounded-full text-sm hover:bg-purple-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
