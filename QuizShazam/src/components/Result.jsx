import React from "react";
import "../css/result.css";
import Cookies from "js-cookie";
import { useParams } from "react-router-dom";
import useAPI from "../Hooks/useAPI";
import Loader from "../shared/Loader";
const Result = () => {
  const { id } = useParams();
  const { token } = JSON.parse(Cookies.get("user"));
  const [data, error, loading] = useAPI(`/users/results/${id}`, token);
  if (!data) return <Loader />;
  const { answers, quiz, score } = data;
  // console.log("🚀 ~ Result ~ answers:", answers)
  return (
    <div className="quiz-results">
      <h1>{quiz.title}</h1>
      <p>Score {score}</p>
      {answers.map((answer, index) => (
        <div className="question" key={index}>
          <p>{answer.questionId.questionText}</p>
          <ul>
            {answer.questionId.options.map((option, optionIndex) => (
              <li
                key={optionIndex}
                className={
                  option.isCorrect
                    ? "correct"
                    : optionIndex === answer.selectedOption
                    ? "incorrect"
                    : ""
                }
              >
                {option.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Result;
