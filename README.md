# QuizShazam — Product

This directory contains the core product: the student-facing frontend and the backend API.

## Structure

```
product/
├── QuizShazam/   # Student frontend — Next.js 16, port 3000
└── Server/       # REST API — Express.js + MongoDB, port 4000
```

## Quick Start

### Backend (run first)
```bash
cd Server
npm install
PORT=4000 nodemon app.js
```

### Student Frontend
```bash
cd QuizShazam
npm install
PORT=3000 NODE_OPTIONS=--max-old-space-size=4096 next dev --webpack
```

> Use `--webpack` flag — Turbopack causes panics on Next.js 16.

## Backend API Routes

| Prefix | File | Scope |
|--------|------|-------|
| `/` | `routes/index.routes.js` | Quiz CRUD, leaderboard, analytics, settings |
| `/users` | `routes/users.routes.js` | Auth, submissions, profile, badges, 2FA |
| `/proctor` | `routes/proctor.routes.js` | Proctoring violations and config |

## Student Frontend Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Browse quizzes by subject |
| `/dashboard/quiz/[id]` | Take a quiz |
| `/profile` | Stats, XP, streak, badges, quiz history |
| `/u/[username]` | Public profile (no login required) |
| `/leaderboard` | Rankings |
| `/certificate/[id]` | Pass certificate |
| `/settings` | Account, 2FA, password |

See [PROJECT_OVERVIEW.md](../PROJECT_OVERVIEW.md) for full technical documentation.
