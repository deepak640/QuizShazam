import React from "react";
import "../css/result.css"

const Result = () => {
  const questions = [
    {
      question: "What is the capital of France?",
      options: ["Paris", "London", "Madrid", "Berlin"],
      correctAnswer: "Paris",
      userAnswer: "London",
    },
    {
      question: "What is the largest ocean in the world?",
      options: [
        "Atlantic Ocean",
        "Pacific Ocean",
        "Indian Ocean",
        "Arctic Ocean",
      ],
      correctAnswer: "Pacific Ocean",
      userAnswer: "Atlantic Ocean",
    },
  ];

  return (
    <div className="quiz-results">
      <h1>Quiz Results</h1>
      {questions.map((question, index) => (
        <div className="question" key={index}>
          <p>{question.question}</p>
          <ul>
            {question.options.map((option, optionIndex) => (
              <li key={optionIndex} className={option === question.correctAnswer? "correct" : option === question.userAnswer? "incorrect" : ""}>
                {option}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Result;
