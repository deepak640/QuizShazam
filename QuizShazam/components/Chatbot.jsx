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

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setMessages((prev) => [...prev, { sender: "bot", text: "Typing..." }]);

    sendChat(
      { values: { message: userMsg }, token: getToken() },
      {
        onSuccess: (data) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated.pop();
            return [...updated, { sender: "bot", text: data }];
          });
        },
        onError: () => {
          setMessages((prev) => {
            const updated = [...prev];
            updated.pop();
            return updated;
          });
        },
      }
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.sender === "user" ? "bg-purple-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
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
