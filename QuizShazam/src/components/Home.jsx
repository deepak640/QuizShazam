import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
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
        <Link className="btn-grad" to={"/quiz"}>
          Take a quiz
        </Link>
      </div>
      <hr className="style-eight" />
      <div className="featured">
        <div className="">
          <p>Featured Quizzes</p>
          <h1>Challenge yourself</h1>
          <p>
            Explore a wide range of quizzes on various topics and test your
            knowledge.
          </p>
        </div>
      </div>
    </>
  );
};

export default Home;
