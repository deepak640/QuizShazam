import axios from "axios";
const { VITE_REACT_API_URL } = import.meta.env;

export const getQuizzes = async ({ queryKey }) => {
  const [key, { token }] = queryKey;
  const res = await axios.get(`${VITE_REACT_API_URL}/quizzes`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const getQuestions = async ({ queryKey }) => {
  const [key, { id, token }] = queryKey;
  const res = await axios.get(`${VITE_REACT_API_URL}/users/quiz/${id}/questions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const getResult = async ({ queryKey }) => {
  const [key, { id, token }] = queryKey;
  const res = await axios.get(`${VITE_REACT_API_URL}/users/results/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const getProfile = async ({ queryKey }) => {
  const [key, { token }] = queryKey;
  const res = await axios.get(`${VITE_REACT_API_URL}/users/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const uploadData = async ({ values, token }) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/create-quiz`, values, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const googleLogin = async (values) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/users/login/google`, values);
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

export const submitQuiz = async ({ values, token }) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/users/submit-quiz`, values, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const chat = async ({ values, token }) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/users/chat`, values, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
};

export const mailPasswordLink = async ({ values, token }) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/mail-password`, values, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}
export const resetPassword = async ({ values, token }) => {

  const res = await axios.post(`${VITE_REACT_API_URL}/reset-password`, values, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}
export const userStats = async ({ queryKey }) => {
  const [key, { token, obj }] = queryKey;
  console.log("🚀 ~ userStats ~ obj", obj)
  const res = await axios.get(`${VITE_REACT_API_URL}/users/total-quizMatrix?userid=${obj.userid}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}
