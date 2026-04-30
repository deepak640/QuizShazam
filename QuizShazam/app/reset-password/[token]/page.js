"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "react-query";
import { message } from "antd";
import Link from "next/link";
import { resetPassword } from "@/lib/api";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const { mutate } = useMutation(resetPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { messageApi.error("Passwords do not match!"); return; }
    mutate(
      { values: { password }, token },
      {
        onSuccess: (d) => messageApi.success(d.message),
        onError: ({ response }) => messageApi.error(response?.data?.message),
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {contextHolder}
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your new password below to reset it.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="Enter new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              placeholder="Confirm new password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition">
            Reset Password
          </button>
        </form>
        <Link href="/login" className="block text-center text-sm text-purple-600 hover:underline mt-4">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
