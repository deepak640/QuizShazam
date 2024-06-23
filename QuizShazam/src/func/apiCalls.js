import axios from "axios";

export const getQuizzes = async () => {
  const { VITE_REACT_API_URL } = import.meta.env;
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const res = await axios.get(`${VITE_REACT_API_URL}/quizzes`, config);
  return res.data;
};

export const getQuestions = async ({ queryKey }) => {
  const [key, { id }] = queryKey;
  const { VITE_REACT_API_URL } = import.meta.env;
  const res = await axios.get(
    `${VITE_REACT_API_URL}/users/quiz/${id}/questions`
  );
  return res.data;
};

export const getResult = async ({ queryKey }) => {
  const [key, { id, token }] = queryKey;
  const { VITE_REACT_API_URL } = import.meta.env;
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const res = await axios.get(
    `${VITE_REACT_API_URL}/users/results/${id}`,
    config
  );
  return res.data;
};

export const getProfile = async ({ queryKey }) => {
  const [key, { token }] = queryKey;
  const { VITE_REACT_API_URL } = import.meta.env;
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const res = await axios.get(`${VITE_REACT_API_URL}/users/profile`, config);
  return res.data;
};
