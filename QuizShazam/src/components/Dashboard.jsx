import React from "react";
import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";
import "../css/quiz.css"
const Dashboard = () => {
  return (
    <div>
      <div className="quiz-cards">
        {[...Array(5)].map((_, index) => {
          return (
            <div className="cards" key={index}>
              <h5>Driver Mechanical Transport</h5>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Repellendus neque repudiandae omnis?
              </p>
              <p>questions : 10</p>
              <div>
                <p>Author : Deepak</p>
                <Link to={`/dashboard/quiz/23`}>
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
