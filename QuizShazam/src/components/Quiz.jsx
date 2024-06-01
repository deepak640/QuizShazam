import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/quiz.css";

const quizData = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    answer: "Paris",
  },
  {
    question: "What is the largest planet in our solar system?",
    options: ["Earth", "Jupiter", "Mars", "Saturn"],
    answer: "Jupiter",
  },
  {
    question: "Who wrote 'Hamlet'?",
    options: [
      "Charles Dickens",
      "William Shakespeare",
      "Mark Twain",
      "Leo Tolstoy",
    ],
    answer: "William Shakespeare",
  },
  {
    question: "What is the boiling point of water?",
    options: ["90°C", "100°C", "110°C", "120°C"],
    answer: "100°C",
  },
  {
    question: "What is the speed of light?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
    answer: "300,000 km/s",
  },
];
const Quiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // initialize answers state as an empty array
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  //...

  const handleOptionClick = (questionId, optionIndex) => {
     setSelectedOptionIndex(optionIndex);
    const existingAnswer = answers.find(
      (answer) => answer.question === questionId
    );
    if (existingAnswer) {
      setAnswers(
        answers.map((answer) =>
          answer.question === questionId
            ? { ...answer, selectedOption: optionIndex }
            : answer
        )
      );
    } else {
      setAnswers([
        ...answers,
        { question: questionId, selectedOption: optionIndex },
      ]);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleNextClick = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousClick = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitClick = () => {
    if (answers.length === quizData.length) {
      alert("submited");
    } else {
      alert("please finish");
    }
  };

  const { question, options } = quizData[currentQuestionIndex];

  return (
    <section className="quiz-main">
      <div className="quiz-container">
        <button className="back-button" onClick={handleBackClick}>
          Back
        </button>
        <h2>Question {currentQuestionIndex + 1}</h2>
        <p className="question">{question}</p>
        <div className="options">
          {options.map((option, index) => (
            <div
              key={index}
              className={`option ${
                index === selectedOptionIndex ? "selected" : ""
              }`}
              onClick={() =>
                handleOptionClick(
                  quizData[currentQuestionIndex].question,
                  index
                )
              }
            >
              {option}
            </div>
          ))}
        </div>
        <div className="navigation">
          <button
            onClick={handlePreviousClick}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          {currentQuestionIndex < quizData.length - 1 ? (
            <button onClick={handleNextClick}>Next</button>
          ) : (
            <button onClick={handleSubmitClick}>Submit</button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Quiz;
