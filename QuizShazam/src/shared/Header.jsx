import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/header.css";
const Header = () => {
  const toggleNav = () => {
    const mobileNav = document.querySelector(".hamburger");
    const navbar = document.querySelector(".menubar");
    navbar.classList.toggle("active");
    mobileNav.classList.toggle("hamburger-active");
  };
  const [Log, setLog] = useState(false);
  useEffect(() => {
    setLog(localStorage.getItem("user"));
  }, []);

  return (
    <>
      <nav>
        <div className="logo">
          <img src="assets/Logo64x64.png" alt="logo" />
          <h1>QuizShazam</h1>
        </div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/services">Services</Link>
          </li>
          <li>
            <Link to="/contact">Contact Us</Link>
          </li>
          <li>
            {Log ? <Link to="/">Logout</Link> : <Link to="/login">Login</Link>}
          </li>
        </ul>
        <div className="hamburger" onClick={toggleNav}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
      </nav>
      <div className="menubar">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/services">Services</Link>
          </li>
          <li>
            <Link to="/contact">Contact Us</Link>
          </li>
          <li>
            <Link to="/Login">Log</Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Header;
