import axios from "axios";
const { VITE_REACT_API_URL } = import.meta.env;

export const getQuizzes = async ({queryKey}) => {
  const [key,{token}] = queryKey
  const res = await axios.get(`${VITE_REACT_API_URL}/quizzes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getQuestions = async ({ queryKey }) => {
  const [key, { id }] = queryKey;
  const res = await axios.get(
    `${VITE_REACT_API_URL}/users/quiz/${id}/questions`
  );
  return res.data;
};

export const getResult = async ({ queryKey }) => {
  const [key, { id, token }] = queryKey;
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
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const res = await axios.get(`${VITE_REACT_API_URL}/users/profile`, config);
  return res.data;
};

export const uploadData = async (values) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/create-quiz`, values);
  return values;
};

export const googleLogin = async (values) => {
  const res = await axios.post(
    `${VITE_REACT_API_URL}/users/login/google`,
    values
  );
  return res.data;
};

export const userLogin = async (values) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/users/login`, values);
  return res.data;
};

export const userRegister = async (values) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/users/register`, values);
  return res.data;
};

export const submitQuiz = async ({ values, config }) => {
  const res = await axios.post(
    `${VITE_REACT_API_URL}/users/submit-quiz`,
    values,
    config
  );
  return res.data;
};
