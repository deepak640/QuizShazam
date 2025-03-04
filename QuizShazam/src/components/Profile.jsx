import React from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../shared/Loader";
import "../assets/css/profile.css";
import Cookies from "js-cookie";
import withAuth from "../auth/withAuth";
import { useMutation, useQuery } from "react-query";
import Barchart from "./BarChart";
import { message } from "antd";
import { getProfile, resetPassword } from "../func/apiCalls.service";
const Profile = () => {
  const { token } = JSON.parse(Cookies.get("user"));
  const Navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const { data, isLoading } = useQuery(["profile", { token }], getProfile);
  const { mutate } = useMutation(resetPassword);
  // console.log("🚀 ~ Profile ~ data:", data)
  if (isLoading) return <Loader />;
  const { profile, quizzes } = data;
  const sendMail = () => {
    mutate({ email: profile.email, token }, {
      onSuccess: (data) => {
        messageApi.success(data.message
        );
      },
      onError: (error) => {
        messageApi.error(error.response.data.error);
      }
    });
  }
  return (
    <div className="profile-section">
      {contextHolder}
      <div className="user-details">
        <div className="profile-field">
          <img src={profile.photoURL} alt="#" />
          <div>
            <h4>{profile.username}</h4>
            <p>{profile.email}</p>
          </div>
        </div>
        {
          !profile.password &&
          <div className="password-field">
            <button onClick={sendMail}>
              Set Password
            </button>
          </div>}
      </div>
      <div className="quiz-taken">
        <h3>Quiz taken</h3>
        {quizzes.length ? (
          quizzes.map((data, i) => {
            return (
              <div
                className="user-cards"
                key={i}
                onClick={() => Navigate(`quiz/${data._id}`)}
              >
                <h4>{data.title}</h4>
                <p>{data.description}</p>
              </div>
            );
          })
        ) : (
          <h1>quiz not taken yes</h1>
        )}
      </div>
      <div className="quiz-chart">
        <h1>Quiz stats</h1>
        <Barchart />
      </div>
    </div>
  );
};

export default withAuth(Profile);
