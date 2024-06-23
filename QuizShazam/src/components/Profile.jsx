import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../shared/Loader";
import "../css/profile.css";
import Cookies from "js-cookie";
import withAuth from "../auth/withAuth";
import { useQuery } from "react-query";
import { getProfile } from "../func/apiCalls";
const Profile = () => {
  const { token } = JSON.parse(Cookies.get("user"));
  const Navigate = useNavigate();
  const { data, isLoading } = useQuery(["profile", { token }], getProfile);
  console.log("🚀 ~ Profile ~ data:", data)
  if (isLoading) return <Loader />;
  const { quizzes, profile } = data;
  return (
    <div className="profile-section">
      <div className="user-details">
        <div>
          <img src={profile.photoURL} alt="#" />
          <span>
            <h4>{profile.username}</h4>
            <p>{profile.email}</p>
          </span>
        </div>
        <span className="password-field">
          <label htmlFor="password">password</label>
          <br />
          <input type="password" id="password" name="password" />
        </span>
      </div>
      <div className="quiz-taken">
        <h3>quiz taken</h3>
        {quizzes &&
          quizzes.map((data, i) => {
            return (
              <div
                className="user-cards"
                key={i}
                onClick={() => Navigate(`quiz/${data._id}`)}
              >
                <h4>{data.title}</h4>
                <p>{data.description}</p>
                <p>timetaken : 15minutes</p>
              </div>
            );
          })}
        {/* {[...Array(5)].map((data, i) => {
            return (
              <div className="cards" key={i}>
                <h4>asdas</h4>
                <p>asds</p>
                <p>timetaken : 15minutes</p>
              </div>
            );
          })} */}
      </div>
    </div>
  );
};

export default withAuth(Profile);
