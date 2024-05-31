import React from 'react'

const Header = () => {
  const toggleNav = () => {
    const mobileNav = document.querySelector(".hamburger");
    const navbar = document.querySelector(".menubar");
    navbar.classList.toggle("active");
    mobileNav.classList.toggle("hamburger-active");
  };
  return (
    <>
      <nav>
        <div className="logo">
          <img src="assets/Logo64x64.png" alt="logo" />
          <h1>QuizShazam</h1>
        </div>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/services">Services</a>
          </li>
          <li>
            <a href="/blog">Blog</a>
          </li>
          <li>
            <a href="/blog">Contact Us</a>
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
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/services">Services</a>
          </li>
          <li>
            <a href="/blog">Blog</a>
          </li>
          <li>
            <a href="/contact">Contact Us</a>
          </li>
        </ul>
      </div>
    </>
  );
}

export default Header
