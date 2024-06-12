import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/quiz.css";
import axios from "axios";
import Loader from "../shared/Loader";
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
    console.log(answers)
    if (answers.length === quizData.length) {
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
      console.log("🚀 ~ handleSubmitClick ~ res:", res);
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
    return <Loader/>;
  }

  if (error) {
    return <h1>{error}</h1>;
  }

  if (!quizData.length) {
    return <h1>No quiz data available</h1>;
  }

  const { questionText,_id, options } = quizData[currentQuestionIndex];

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
    </>
  );
};

export default Quiz;
