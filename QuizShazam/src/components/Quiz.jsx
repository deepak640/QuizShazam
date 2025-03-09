import React, { useState, useEffect } from "react";
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
  const [selectedOptions, setSelectedOptions] = useState({});
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds per question
  const { data: quizData, isLoading } = useQuery(["questions", { id }], getQuestions);

  const {
    mutate,
    data,
    isLoading: isPending,
  } = useMutation(async ({ values, token }) => {
    return submitQuiz({ values, token });
  });

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      // Set current question's answer to null if not already answered
      const currentQuestionId = quizData[currentQuestionIndex]._id;
      const existingAnswer = answers.find((answer) => answer.questionId === currentQuestionId);
      if (!existingAnswer) {
        setAnswers((prevAnswers) => [
          ...prevAnswers,
          { questionId: currentQuestionId, selectedOption: null },
        ]);
      }
      setSelectedOptions((prevOptions) => ({
        ...prevOptions,
        [currentQuestionId]: null,
      }));

      // Move to next question or submit if last question
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
        setTimeLeft(10); // Reset timer for next question
      } else {
        handleSubmitClick(); // Submit quiz if last question
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(timerId); // Cleanup on unmount
  }, [timeLeft, currentQuestionIndex, answers, quizData]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setTimeLeft(10); // Reset timer for next question
    } else {
      handleSubmitClick();
    }
  };

  const handleOptionClick = (questionId, optionIndex) => {
    setSelectedOptions((prevOptions) => ({
      ...prevOptions,
      [questionId]: optionIndex,
    }));
    const existingAnswer = answers.find((answer) => answer.questionId === questionId);
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

  const validate = () => {
    const selectedOption = selectedOptions[quizData[currentQuestionIndex]._id];
    if (selectedOption === undefined) {
      messageApi.open({
        type: "warning",
        content: "Please select an option",
      });
      return false;
    }
    return true;
  };

  const handleNextClick = () => {
    if (!validate()) return;
    handleNextQuestion();
  };

  const handlePreviousClick = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setTimeLeft(10); // Reset timer when going back
      const previousQuestionId = quizData[currentQuestionIndex - 1]._id;
      const previousAnswer = answers.find((answer) => answer.questionId === previousQuestionId);
      setSelectedOptions((prevOptions) => ({
        ...prevOptions,
        [previousQuestionId]: previousAnswer ? previousAnswer.selectedOption : null,
      }));
    }
  };

  const handleSubmitClick = async () => {
    // Ensure all questions have an answer (null for unanswered)
    const finalAnswers = quizData.map((question) => {
      const existingAnswer = answers.find((answer) => answer.questionId === question._id);
      return existingAnswer || { questionId: question._id, selectedOption: null };
    });
    console.log(finalAnswers, "finalAnswers");
    try {
      const { token } = JSON.parse(Cookies.get("user"));
      const values = {
        quizId: id,
        answers: finalAnswers,
      };
      mutate(
        { values, token},
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
              content: data.response.data.error,
            });
          },
        }
      );
    } catch (error) {
      messageApi.open({
        type: "error",
        content: error.response.data.error,
      });
    }
  };


  if (isLoading) return <Loader />;
  if (!quizData?.length) return <h1>No quiz data available</h1>;

  const { questionText, _id, options } = quizData[currentQuestionIndex];

  return (
    <>
      {contextHolder}
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
              .map((option, index) => (
                <div
                  key={index}
                  className="option"
                  id={`${selectedOptions[_id] === index ? "selected" : ""}`}
                  onClick={() => handleOptionClick(_id, index)}
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
              <button
                onClick={handleSubmitClick}
                disabled={isPending || data}
              >
                {isPending ? "Loading..." : "Submit"}
              </button>
            )}
          </div>
          <div className="timer">
            Time Left: {Math.floor(timeLeft / 60)}:{("0" + (timeLeft % 60)).slice(-2)}
          </div>
        </div>
      </section>
      {timeLeft <= 0 && (
        <Lottie animationData={dataNotFound} />
      )}
    </>
  );
};

export default withAuth(Quiz);
