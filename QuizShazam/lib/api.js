import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const getQuizzes = async ({ queryKey }) => {
  const [, { token }] = queryKey;
  const res = await axios.get(`${API_URL}/quizzes`, { headers: authHeader(token) });
  return res.data;
};

export const getQuestions = async ({ queryKey }) => {
  const [, { id }] = queryKey;
  const res = await axios.get(`${API_URL}/users/quiz/${id}/questions`);
  return res.data;
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
