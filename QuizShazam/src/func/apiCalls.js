import axios from "axios";
const { VITE_REACT_API_URL, VITE_REACT_APP_ORIGIN } = import.meta.env;

export const getQuizzes = async ({ queryKey }) => {
  const [key, { token }] = queryKey;
  const res = await axios.get(`${VITE_REACT_API_URL}/quizzes`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: VITE_REACT_APP_ORIGIN,
    },
  });
  return res.data;
};

export const getQuestions = async ({ queryKey }) => {
  const [key, { id }] = queryKey;
  const res = await axios.get(
    `${VITE_REACT_API_URL}/users/quiz/${id}/questions`,
    {
      headers: {
        Origin: VITE_REACT_APP_ORIGIN,
      },
    }
  );
  return res.data;
};

export const getResult = async ({ queryKey }) => {
  const [key, { id, token }] = queryKey;
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: VITE_REACT_APP_ORIGIN,
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
      Origin: VITE_REACT_APP_ORIGIN,
    },
  };
  const res = await axios.get(`${VITE_REACT_API_URL}/users/profile`, config);
  return res.data;
};

export const uploadData = async (values) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/create-quiz`, values, {
    headers: {
      Origin: VITE_REACT_APP_ORIGIN,
    },
  });
  return values;
};

export const googleLogin = async (values) => {
  const res = await axios.post(
    `${VITE_REACT_API_URL}/users/login/google`,
    values,
    {
      headers: {
        Origin: VITE_REACT_APP_ORIGIN,
      },
    }
  );
  return res.data;
};

export const userLogin = async (values) => {
  const res = await axios.post(`${VITE_REACT_API_URL}/users/login`, values, {
    headers: {
      Origin: VITE_REACT_APP_ORIGIN,
    },
  });
  return res.data;
};

export const userRegister = async (values) => {
  const res = await axios.post(
    `${VITE_REACT_API_URL}/users/register`,
    values,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Origin: VITE_REACT_APP_ORIGIN,
      },
    }
  );
  return res.data;
};

export const submitQuiz = async ({ values, config }) => {
  const res = await axios.post(
    `${VITE_REACT_API_URL}/users/submit-quiz`,
    values,
    {
      ...config,
      headers: {
        ...config.headers,
        Origin: VITE_REACT_APP_ORIGIN,
      },
    }
  );
  return res.data;
};
