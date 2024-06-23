import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";
import "../css/quiz.css";
import withAuth from "../auth/withAuth";
import Loader from "../shared/Loader";
import { useQuery } from "react-query";
import { getQuizzes } from "../func/apiCalls";
const Dashboard = () => {
  const { data: quizzes, isLoading } = useQuery("quizzes", getQuizzes);
  // console.log("🚀 ~ Dashboard ~ quizzes:", quizzes);
  if (isLoading) return <Loader />;
  if (quizzes.length == 0) return <h1 style={{textAlign:'center'}}>no data</h1>;
  return (
    <div>
      <div className="quiz-cards">
        {quizzes &&
          quizzes.map((data, index) => {
            return (
              <div className="cards" key={index}>
                <h5>{data.title}</h5>
                <p>{data.description}</p>
                <p>questions : {data.questions.length}</p>
                <div>
                  <p>Author : {data.author}</p>
                  <Link to={`/dashboard/quiz/${data._id}`}>
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

export default withAuth(Dashboard);
