import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const getQuizzes = async ({ queryKey }) => {
  const [, { token }] = queryKey;
  const res = await axios.get(`${API_URL}/quizzes`, { headers: authHeader(token) });
  return res.data;
};

export const getAllQuizzesPublic = async () => {
  const res = await axios.get(`${API_URL}/getAllQuizzes`);
  return res.data;
};

export const getQuestions = async ({ queryKey }) => {
  const [, { id }] = queryKey;
  const res = await axios.get(`${API_URL}/users/quiz/${id}/questions`);
  // Backend now returns { questions, quiz } — normalise for consumers
  if (res.data && res.data.questions) return res.data;
  // Legacy fallback: array of questions
  return { questions: res.data, quiz: null };
};

export const getResult = async ({ queryKey }) => {
  const [, { id, token }] = queryKey;
  const res = await axios.get(`${API_URL}/users/results/${id}`, { headers: authHeader(token) });
  return res.data;
};

export const getProfile = async ({ queryKey }) => {
  const [, { token }] = queryKey;
  const res = await axios.get(`${API_URL}/users/profile`, { headers: authHeader(token) });
  return res.data;
};

export const userStats = async ({ queryKey }) => {
  const [, { token, obj }] = queryKey;
  const res = await axios.get(`${API_URL}/users/total-quizMatrix?userid=${obj.userid}`, { headers: authHeader(token) });
  return res.data;
};

export const uploadData = async ({ values, token }) => {
  const res = await axios.post(`${API_URL}/create-quiz`, values, { headers: authHeader(token) });
  return res.data;
};

export const googleLogin = async (values) => {
  const res = await axios.post(`${API_URL}/users/login/google`, values);
  return res.data;
};

export const userLogin = async (values) => {
  const res = await axios.post(`${API_URL}/users/login`, values);
  return res.data;
};

export const userRegister = async (values) => {
  const res = await axios.post(`${API_URL}/users/register`, values);
  return res.data;
};

export const submitQuiz = async ({ values, token }) => {
  const res = await axios.post(`${API_URL}/users/submit-quiz`, values, { headers: authHeader(token) });
  return res.data;
};

export const chat = async ({ values, token }) => {
  const res = await axios.post(`${API_URL}/users/chat`, values, { headers: authHeader(token) });
  return res.data;
};

export const mailPasswordLink = async ({ values, token }) => {
  const res = await axios.post(`${API_URL}/mail-password`, values, { headers: authHeader(token) });
  return res.data;
};

export const resetPassword = async ({ values, token }) => {
  const res = await axios.post(`${API_URL}/reset-password`, values, { headers: authHeader(token) });
  return res.data;
};

export const updateProfile = async ({ values, token }) => {
  const res = await axios.put(`${API_URL}/users/profile`, values, {
    headers: { ...authHeader(token), "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const setup2FA = async ({ token }) => {
  const res = await axios.post(`${API_URL}/users/2fa/setup`, {}, { headers: authHeader(token) });
  return res.data;
};

export const enable2FA = async ({ values, token }) => {
  const res = await axios.post(`${API_URL}/users/2fa/enable`, values, { headers: authHeader(token) });
  return res.data;
};

export const disable2FA = async ({ values, token }) => {
  const res = await axios.post(`${API_URL}/users/2fa/disable`, values, { headers: authHeader(token) });
  return res.data;
};

export const validate2FALogin = async (values) => {
  const res = await axios.post(`${API_URL}/users/2fa/validate`, values);
  return res.data;
};

export const getWeakTopics = async ({ queryKey }) => {
  const [, { token }] = queryKey;
  const res = await axios.get(`${API_URL}/analytics/weak-topics`, { headers: authHeader(token) });
  return res.data;
};

export const getSettings = async () => {
  const res = await axios.get(`${API_URL}/settings`);
  return res.data;
};

export const getGlobalLeaderboard = async () => {
  const res = await axios.get(`${API_URL}/leaderboard/global`);
  return res.data;
};

export const getWeeklyLeaderboard = async () => {
  const res = await axios.get(`${API_URL}/leaderboard/weekly`);
  return res.data;
};

export const getQuizLeaderboard = async ({ queryKey }) => {
  const [, { quizId }] = queryKey;
  const res = await axios.get(`${API_URL}/leaderboard/quiz/${quizId}`);
  return res.data;
};

export const getSubjectLeaderboard = async ({ queryKey }) => {
  const [, { subject }] = queryKey;
  const res = await axios.get(`${API_URL}/leaderboard/subject/${encodeURIComponent(subject)}`);
  return res.data;
};

export const getLeaderboardSubjects = async () => {
  const res = await axios.get(`${API_URL}/leaderboard/subjects`);
  return res.data;
};

export const getLeaderboardQuizzes = async () => {
  const res = await axios.get(`${API_URL}/getAllQuizzes`);
  return res.data;
};

// ── Quiz Session Persistence ──────────────────────────────────────────────────

export const getOrCreateSession = async ({ quizId, token }) => {
  const res = await axios.get(`${API_URL}/users/quiz-session/${quizId}`, {
    headers: authHeader(token),
  });
  return res.data;
};

export const saveSessionProgress = async ({ quizId, answers, currentIndex, token }) => {
  const res = await axios.patch(
    `${API_URL}/users/quiz-session/${quizId}/save`,
    { answers, currentIndex },
    { headers: authHeader(token) }
  );
  return res.data;
};

export const discardQuizSession = async ({ quizId, token }) => {
  const res = await axios.delete(`${API_URL}/users/quiz-session/${quizId}`, {
    headers: authHeader(token),
  });
  return res.data;
};
