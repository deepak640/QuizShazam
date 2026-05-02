import { Poppins } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import Header from "@/components/Header";
import FloatingChat from "@/components/FloatingChat";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quizshazam.com";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "QuizShazam — Test Your Knowledge & Master Every Quiz",
    template: "%s | QuizShazam",
  },
  description:
    "Challenge yourself with 50+ quizzes across DSA, JavaScript, React, SQL, and more. Track your progress, compete, and become a quiz master.",
  keywords: [
    "quiz", "online quiz", "knowledge test", "DSA quiz", "JavaScript quiz",
    "React quiz", "SQL quiz", "Next.js quiz", "quiz platform", "trivia",
  ],
  authors: [{ name: "QuizShazam" }],
  creator: "QuizShazam",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "QuizShazam",
    title: "QuizShazam — Test Your Knowledge & Master Every Quiz",
    description:
      "Challenge yourself with 50+ quizzes across DSA, JavaScript, React, SQL, and more. Track your progress and become a quiz master.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "QuizShazam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuizShazam — Test Your Knowledge & Master Every Quiz",
    description: "Challenge yourself with 50+ quizzes across DSA, JavaScript, React, and more.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: BASE_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "QuizShazam",
  url: BASE_URL,
  description:
    "Challenge yourself with 50+ quizzes across DSA, JavaScript, React, SQL, and more.",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/dashboard?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#fafafa]">
        <QueryProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <FloatingChat />
        </QueryProvider>
      </body>
    </html>
  );
}
