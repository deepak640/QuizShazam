import React from "react";
import "../css/NotFound.css";
import { useNavigate } from "react-router-dom";
const NotFound = () => {
  const Navigate = useNavigate();
  return (
    <div className="content-center">
      <h2 className="error">404</h2>
      <p>PAGE NOT FOUND</p>
      <p>It looks like nothing was found at this location.</p>
      <button onClick={() => Navigate(-1)}>BACK TO HOME</button>
    </div>
  );
};

export default NotFound;
