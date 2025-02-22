import React from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../shared/Loader";
import "../assets/css/profile.css";
import Cookies from "js-cookie";
import withAuth from "../auth/withAuth";
import { useQuery } from "react-query";
import LineChart from "./Linechart";
import { getProfile } from "../func/apiCalls.service";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
const Profile = () => {
  const { token } = JSON.parse(Cookies.get("user"));
  const Navigate = useNavigate();
  const { data, isLoading } = useQuery(["profile", { token }], getProfile);
  // console.log("🚀 ~ Profile ~ data:", data)
  if (isLoading) return <Loader />;
  const { profile, quizzes } = data;
  console.log("🚀 ~ Profile ~ quizzes:", quizzes);
  return (
    <div className="profile-section">
      <div className="user-details">
        <div className="profile-field">
          <img src={profile.photoURL} alt="#" />
          <div>
            <h4>{profile.username}</h4>
            <p>{profile.email}</p>
          </div>
        </div>
        <div className="password-field">
          <label htmlFor="password">password</label>
          <br />
          <input type="password" id="password" name="password" />
        </div>
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
        <LineChart />
      </div>
    </div>
  );
};

export default withAuth(Profile);
