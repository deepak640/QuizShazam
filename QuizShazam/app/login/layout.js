export const metadata = {
  title: "Sign In",
  description:
    "Sign in to your QuizShazam account to access your quizzes, track your scores, and continue your learning journey.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Sign In | QuizShazam",
    description: "Sign in to your QuizShazam account and pick up where you left off.",
    url: "/login",
  },
};

export default function LoginLayout({ children }) {
  return children;
}
