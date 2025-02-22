import React, { useState } from "react";
import Lottie from "lottie-react";
import dataNotFound from "../assets/dataNotFound.json";
import { useNavigate, useParams } from "react-router-dom";
import "../assets/css/quiz.css";
import { message } from "antd";
import Loader from "../shared/Loader";
import Cookies from "js-cookie";
import { useMutation, useQuery } from "react-query";
import withAuth from "../auth/withAuth";
import { getQuestions, submitQuiz } from "../func/apiCalls.service";
const Quiz = () => {
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  // initialize answers state as an empty array
  const [selectedOptions, setSelectedOptions] = useState({}); // Initialize an empty object to store selected options
  const {
    mutate,
    data,
    isLoading: ispending,
  } = useMutation(async ({ values, config }) => {
    return submitQuiz({ values, config });
  });
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
    // console.log(answers);
    if (answers.length === quizData.length) {
      try {
        const { token } = JSON.parse(Cookies.get("user"));
        const values = {
          quizId: id,
          answers,
        };
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        mutate(
          { values, config },
          {
            onSuccess: (data) => {
              messageApi.open({
                type: "success",
                content: data.message,
                onClose: () => navigate("/"),
              });
            },
            onError: (data) => {
              messageApi.open({
                type: "error",
                content: data.message,
              });
            },
          }
        );
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

  const { data: quizData, isLoading } = useQuery(
    ["questions", { id }],
    getQuestions
  );
  if (isLoading) return <Loader />;
  const { questionText, _id, options } = quizData[currentQuestionIndex];

  if (!quizData.length) return <h1>No quiz data available</h1>;

  // console.log("🚀 ~ Quiz ~ quizData:", quizData);
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
              {options
                .filter((opt) => opt !== null)
                .map((option, index) => {
                  return (
                    <div
                      key={index}
                      className="option"
                      id={`${selectedOptions[_id] === index ? "selected" : ""}`}
                      onClick={() =>
                        handleOptionClick(
                          quizData[currentQuestionIndex]._id,
                          index
                        )
                      }
                    >
                      {option.text}
                    </div>
                  );
                })}
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
                <button
                  onClick={handleSubmitClick}
                  disabled={ispending || data}
                >
                  {ispending ? "loading ... " : "Submit"}
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          <Lottie animationData={dataNotFound} />
        </>
      )}
    </>
  );
};

export default withAuth(Quiz);
