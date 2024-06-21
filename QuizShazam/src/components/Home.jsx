import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SlBadge } from "react-icons/sl";
import { message } from "antd";
import useAPI from "../Hooks/useAPI"
const Home = () => {
  const { state } = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  useAPI("/")
  useEffect(() => {
    state &&
      messageApi.open({
        type: "warning",
        content: "You are not logged in",
      });
  }, []);

  return (
    <>
      {contextHolder}
      <div className="hero-section">
        <h1>
          "Test Your Knowledge, Track Your Progress, and Become a Quiz Master"
        </h1>
        <p>
          "Join QuizShazam today and dive into a world of exciting quizzes on
          various topics. Whether you're a trivia buff or just looking to learn
          something new, we've got quizzes that will challenge your mind and
          expand your horizons. Track your progress, see detailed results, and
          compare your performance over time with your personal dashboard. Ready
          to get started?"
        </p>
        <Link className="btn-grad" to={"/dashboard"}>
          Take a quiz
        </Link>
      </div>
      <hr className="style-eight" />
      <div className="featured">
        <div className="featured-info">
          <p>Featured Quizzes</p>
          <h1>Challenge yourself</h1>
          <p className="featured-desc">
            Explore a wide range of quizzes on various topics and test your
            knowledge.
          </p>
          <div className="featured-cards">
            <div>
              <h4>Quiz</h4>
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Eligendi, aperiam.
              </p>
              <p>
                <SlBadge />
                Top score: 95
              </p>
            </div>
            <div>
              <h4>Quiz</h4>
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Eligendi, aperiam.
              </p>
              <p>
                <SlBadge />
                Top score: 95
              </p>
            </div>
            <div>
              <h4>Quiz</h4>
              <p>
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Eligendi, aperiam.
              </p>
              <p>
                <SlBadge />
                Top score: 95
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
