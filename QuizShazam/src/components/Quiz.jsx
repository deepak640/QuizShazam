import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/quiz.css";
import { message } from "antd";
import axios from "axios";
import Loader from "../shared/Loader";
import useAPI from "../Hooks/useAPI";
const Quiz = () => {
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  // initialize answers state as an empty array
  const [selectedOptions, setSelectedOptions] = useState({}); // Initialize an empty object to store selected options

  const handleOptionClick = (questionId, optionIndex) => {
    setSelectedOptions((prevOptions) => ({
      ...prevOptions,
      [questionId]: optionIndex,
    }));
    const existingAnswer = answers.find(
      (answer) => answer.questionId === questionId
    );
    if (existingAnswer) {
      setAnswers(
        answers.map((answer) =>
          answer.questionId === questionId
            ? { ...answer, selectedOption: optionIndex }
            : answer
        )
      );
    } else {
      setAnswers([
        ...answers,
        { questionId: questionId, selectedOption: optionIndex },
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

  const handleSubmitClick = async () => {
    console.log(answers);
    if (answers.length === quizData.length) {
      try {
        const { token } = JSON.parse(localStorage.getItem("user"));
        const res = await axios.post(
          "http://localhost:3000/users/submit-quiz",
          {
            quizId: id,
            answers,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        messageApi.open({
          type: "success",
          content: "This is a success message",
          duration: 2.5,
          onClose: () => navigate("/"),
        });
      } catch (error) {
        messageApi.open({
          type: "error",
          content: error.message,
        });
      }
    } else {
      messageApi.open({
        type: "warning",
        content: "Finish Quiz",
      });
    }
  };

  const [quizData, error, loading] = useAPI(
    `http://localhost:3000/users/quiz/${id}/questions`
  );
  if (!quizData) {
    return <Loader />;
  }
  const { questionText, _id, options } = quizData[currentQuestionIndex];

  if (error) {
    return <h1>{error}</h1>;
  }

  if (!quizData.length) {
    return <h1>No quiz data available</h1>;
  }

  console.log("🚀 ~ Quiz ~ quizData:", quizData);
  return (
    <>
      {contextHolder}
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
                    selectedOptions[_id] === index ? "selected" : ""
                  }`}
                  onClick={() =>
                    handleOptionClick(quizData[currentQuestionIndex]._id, index)
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
      hello
    </>
  );
};

export default Quiz;
