# QuizShazam — Student Frontend

Next.js 16 App Router application. Students take quizzes, view their profiles, and track progress here.

## Dev Server

```bash
npm install
PORT=3000 NODE_OPTIONS=--max-old-space-size=4096 next dev --webpack
```

> Always use `--webpack`. Turbopack panics on this version of Next.js 16.

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home / landing |
| `/login` | Email or Google login |
| `/register` | Create account |
| `/dashboard` | Quiz listing, grouped by subject |
| `/dashboard/quiz/[id]` | Active quiz — timer, auto-save, proctoring |
| `/profile` | Own profile — XP, streak, badges, history, score chart |
| `/profile/quiz/[id]` | Detailed result for one quiz |
| `/u/[username]` | Public profile — anyone can view |
| `/leaderboard` | Global, weekly, subject rankings |
| `/certificate/[id]` | Certificate for passed quizzes |
| `/settings` | Password, 2FA, profile edit |
| `/upload` | File upload |

## Key Files

```
lib/api.js                  All API calls (Axios), auth headers, 401 redirect
lib/firebase.js             Firebase config for Google OAuth
hooks/useProctoring.js      Browser event listeners — tab, fullscreen, copy/paste
components/
  FloatingChat.jsx          AI chatbot with markdown rendering
  ProctoringWarning.jsx     Violation toast (auto-dismisses in 4s)
  Header.jsx                Top navigation
  BarChart.jsx              Score history chart
  Loader.jsx                Loading spinner
```

## Quiz Page Behaviour

- **Timer**: quiz-level countdown (not per-question). Auto-submits at 0.
- **Answer locking**: once you press Next, the answer is locked.
- **Session persistence**: answers auto-saved every few seconds via PATCH. Resume on reload.
- **Proctoring**: global config fetched from `/proctor/config`. Listeners attached if enabled.
- **Fullscreen gate**: quiz can only be started in fullscreen.

## Auth

Token stored in cookie: `{ token, photoURL, refreshToken }`.
All API calls read `Cookies.get("user")` and attach `Authorization: Bearer <token>`.
`middleware.ts` protects `/dashboard`, `/profile`, `/upload` — redirects to `/?auth=required` if no cookie.
