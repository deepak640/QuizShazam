import React, { useEffect, useState } from "react";
import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";
import axios from "axios";
import "../css/quiz.css";
const Dashboard = () => {
  const [quizzes, setquiz] = useState([]);
  useEffect(() => {
    const GetData = async () => {
      const res = await axios.get("http://localhost:3000/quizzes");
      setquiz(res.data);
    };
    return () => {
      GetData();
    };
  }, []);

  return (
    <div>
      <div className="quiz-cards">
        {quizzes.map((data, index) => {
          return (
            <div className="cards" key={index}>
              <h5>{data.title}</h5>
              <p>{data.description}</p>
              <p>questions : {data.questions.length}</p>
              <div>
                <p>Author : {data.author}</p>
                <Link to={`/dashboard/quiz/${data._id}`}>
                  <IoArrowForward />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
