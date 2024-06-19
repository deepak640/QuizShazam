import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/header.css";
const Header = () => {
  const [Log, setLog] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const Navigate = useNavigate();
  const photoURL = user ? user.photoURL : "X";
  const [active, setActive] = useState(false);
  const toggleNav = () => {
    const mobileNav = document.querySelector(".hamburger");
    const navbar = document.querySelector(".menubar");
    navbar.classList.toggle("active");
    mobileNav.classList.toggle("hamburger-active");
  };
  const handleLogout = () => {
    localStorage.clear();
    setActive(false);
    setLog(false); // Force a re-render to update the login status
    Navigate("/")
  };
  useEffect(() => {
    setLog(localStorage.getItem("user"));
  }, []);
  return (
    <>
      <nav>
        <div className="logo">
          <h1>QuizShazam</h1>
        </div>
        {!Log && (
          <>
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
                <Link to="/login">Login</Link>
              </li>
            </ul>
            <div className="hamburger" onClick={toggleNav}>
              <span className="line"></span>
              <span className="line"></span>
              <span className="line"></span>
            </div>
          </>
        )}
        {Log && (
          <>
            <div
              className="profile"
              onClick={() => (active ? setActive(false) : setActive(true))}
            >
              <div className="img-box">
                <img src={photoURL} alt="some user image" />
              </div>
            </div>
            <div className={`menu ${active && "active"}`}>
              <ul>
                <li>
                  <a href="/profile">
                    <i className="ph-bold ph-user"></i>Profile
                  </a>
                </li>
                <li>
                  <a href="/contact">
                    <i className="ph-bold ph-question"></i>Help
                  </a>
                </li>
                <li>
                  <a onClick={handleLogout}>
                    <i className="ph-bold ph-sign-out"></i>Log Out
                  </a>
                </li>
              </ul>
            </div>
          </>
        )}
      </nav>
      {!Log && (
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
              <Link to="/login">Login</Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default Header;
