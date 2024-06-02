import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/quiz.css";
import axios from "axios";
// const quizData = [
//   {
//     question: "What is the capital of France?",
//     options: ["Berlin", "Madrid", "Paris", "Rome"],
//     answer: "Paris",
//   },
//   {
//     question: "What is the largest planet in our solar system?",
//     options: ["Earth", "Jupiter", "Mars", "Saturn"],
//     answer: "Jupiter",
//   },
//   {
//     question: "Who wrote 'Hamlet'?",
//     options: [
//       "Charles Dickens",
//       "William Shakespeare",
//       "Mark Twain",
//       "Leo Tolstoy",
//     ],
//     answer: "William Shakespeare",
//   },
//   {
//     question: "What is the boiling point of water?",
//     options: ["90°C", "100°C", "110°C", "120°C"],
//     answer: "100°C",
//   },
//   {
//     question: "What is the speed of light?",
//     options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
//     answer: "300,000 km/s",
//   },
// ];
const Quiz = () => {
  const { id } = useParams();
  const [quizData, setquizData] = useState();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]);
  // initialize answers state as an empty array
  const [selectedOptions, setSelectedOptions] = useState({}); // Initialize an empty object to store selected options

  const handleOptionClick = (questionId, optionIndex) => {
    setSelectedOptions((prevOptions) => ({
      ...prevOptions,
      [questionId]: optionIndex,
    }));
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
  useEffect(() => {
    const getData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/users/quiz/${id}/questions`
        );
        setquizData(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        setError("Error fetching quiz data");
        setLoading(false);
      }
    };
    getData();
  }, [id]);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <h1>{error}</h1>;
  }

  if (!quizData.length) {
    return <h1>No quiz data available</h1>;
  }

  const { questionText, options } = quizData[currentQuestionIndex];

  return (
    <>
      {quizData ? (
        <section className="quiz-main">
          <div className="quiz-container">
            <button className="back-button" onClick={handleBackClick}>
              Back
            </button>
            <h2>Question {currentQuestionIndex + 1}</h2>
            <p className="question">{questionText}</p>
            <div className="options">
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`option ${
                    selectedOptions[questionText] === index ? "selected" : ""
                  }`}
                  onClick={() =>
                    handleOptionClick(
                      quizData[currentQuestionIndex].questionText,
                      index
                    )
                  }
                >
                  {option.text}
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
      ) : (
        <h1>not found</h1>
      )}
    </>
  );
};

export default Quiz;
