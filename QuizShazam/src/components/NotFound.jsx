import React from "react";
import "../css/NotFound.css";
import Lottie from "lottie-react";
import animatedata from "../assets/errorpage.json";
import { useNavigate } from "react-router-dom";
const NotFound = () => {
  const Navigate = useNavigate();
  return (
    <div className="content-center">
      <Lottie className="errorpage" animationData={animatedata} />
      <a
        className="btn-grad"
        style={{ cursor: "pointer" }}
        onClick={() => Navigate(-1)}
      >
        BACK TO HOME
      </a>
    </div>
  );
};

export default NotFound;
