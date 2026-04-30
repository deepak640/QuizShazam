"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import errorpage from "@/public/errorpage.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-64">
        <Lottie animationData={errorpage} loop />
      </div>
      <h2 className="text-2xl font-bold text-gray-700 mt-4">Page not found</h2>
      <p className="text-gray-400 text-sm mt-2 mb-6">The page you're looking for doesn't exist.</p>
      <Link href="/" className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-2.5 rounded-full font-semibold hover:opacity-90 transition text-sm">
        Go Home
      </Link>
    </div>
  );
}
