import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/css/header.css";
import Cookies from "js-cookie";
import { Modal } from 'antd';
import Chatbot from "../components/Chatbot";
const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [navActive, setNavActive] = useState(false);
  const navigate = useNavigate();
  const userData = Cookies.get("user");
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleLogout = () => {
    Cookies.remove("user");
    setIsLoggedIn(false);
    setNavActive(false);
    navigate("/");
  };

  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <nav>
      <Modal title="Basic Modal" centered width={900} footer={null} open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <div>
          <Chatbot />
        </div>
      </Modal>
      <div className="logo" onClick={() => navigate("/")}>
        <h1>QuizShazam</h1>
      </div>
      {isLoggedIn ? (
        <div className="profile" onClick={() => setNavActive(!navActive)}>
          <div className="img-box">
            <img src={user.photoURL} alt="some user image" />
          </div>
          <div className={`menu ${navActive && "profile-active"}`}>
            <ul>
              <li>
                <a href="/profile">
                  <i className="ph-bold ph-user"></i>Profile
                </a>
              </li>
              <li>
                <a onClick={showModal}>
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
        </div>
      ) : (
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
          <div
            className={`hamburger ${navActive && "hamburger-active"}`}
            onClick={() => setNavActive(!navActive)}
          >
            <span className="line"></span>
            <span className="line"></span>
            <span className="line"></span>
          </div>
          <div className={`menubar ${navActive && "active"}`}>
            <ul>
              <li>
                <Link onClick={() => setNavActive(false)} to="/">
                  Home
                </Link>
              </li>
              <li>
                <Link onClick={() => setNavActive(false)} to="/services">
                  Services
                </Link>
              </li>
              <li>
                <Link onClick={() => setNavActive(false)} to="/contact">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link onClick={() => setNavActive(false)} to="/login">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}
    </nav>
  );
};

export default Header;
