import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";
import "../css/quiz.css";
import useAPI from "../Hooks/useAPI";
import withAuth from "../auth/withAuth"
import Loader from "../shared/Loader";
const Dashboard = () => {
  const [quizzes, error, loading] = useAPI("http://localhost:3000/quizzes");
  if (loading) return <Loader />;
  if (error) return <Loader />;
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
