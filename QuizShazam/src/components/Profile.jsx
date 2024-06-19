import React from "react";
import Loader from "../shared/Loader";
import useAPI from "../Hooks/useAPI";
const Profile = () => {
  const { token } = JSON.parse(localStorage.getItem("user"));
  const [data, error, loading] = useAPI(
    "http://localhost:3000/users/profile",
    token
  );
  if (!data) return <Loader />;
  const { quizzes, profile } = data;

  return (
    <div>
      <div className="user-details">
        <div>
          <img src={profile.photoURL} alt="#" />
          <h4>{profile.username}</h4>
          <p>{profile.email}</p>
        </div>
        <label htmlFor="password">password</label>
        <input type="password" name="password" />
      </div>
      <div className="quiz-taken">
        <h3>quiz taken</h3>
        {quizzes &&
          quizzes.map((data, i) => {
            return (
              <div className="cards" key={i}>
                <h4>{data.title}</h4>
                <p>{data.description}</p>
                <p>timetaken : 15minutes</p>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Profile;
