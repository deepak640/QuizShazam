import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";
import "../css/quiz.css";
import withAuth from "../auth/withAuth";
import Loader from "../shared/Loader";
import Cookie from "js-cookie";
import { useQuery } from "react-query";
import Lottie from "lottie-react";
import dataNotFound from "../assets/dataNotFound.json";
import { getQuizzes } from "../func/apiCalls";
const Dashboard = () => {
  const { token } = JSON.parse(Cookie.get("user"));
  const { data, isLoading } = useQuery(["quizzes", { token }], getQuizzes);
  if (isLoading) return <Loader />;
  const { quizzes, quizzesTaken } = data;
  if (quizzes.length == 0) return <Lottie animationData={dataNotFound} id="lottie-center" />;
  return (
    <div>
      <div className="quiz-cards">
        {quizzes &&
          quizzes.map((data, index) => {
            const isTaken = quizzesTaken.quizzesTaken.includes(data._id);
            return (
              <div
                className="cards"
                {...(isTaken && { id: "taken" })}
                key={index}
              >
                <h5>
                  {data.title} {isTaken && "(Already taken)"}
                </h5>
                <p>{data.description}</p>
                <p>questions : {data.questions.length}</p>
                <div>
                  <p>Author: {data.author ? data.author : "unknown"}</p>
                  {!isTaken && (
                    <Link to={`/dashboard/quiz/${data._id}`}>
                      <IoArrowForward />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default withAuth(Dashboard);
