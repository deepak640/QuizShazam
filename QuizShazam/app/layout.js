import { Poppins } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import Header from "@/components/Header";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "QuizShazam",
  description: "Test Your Knowledge, Track Your Progress, and Become a Quiz Master",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="min-h-screen flex flex-col bg-\[#fafafa\]">
        <QueryProvider>
          <Header />
          <main className="flex-1">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
