import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/login.css";
import axios from "axios";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../auth/Firebase";
const Login = () => {
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const Navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/users/login", user);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (error) {
      console.log(error);
    }
  };
  const SignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      const res = await axios.post("http://localhost:3000/users/login", {
        email: user.email,
        username: user.displayName,
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      Navigate("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  return (
    <div className="Login-container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div>
          <label htmlFor="email">email</label>
          <br />
          <input
            type="email"
            id="email"
            name="email"
            value={user.email}
            placeholder="Enter email"
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">password</label>
          <br />
          <input
            type="password"
            id="password"
            name="password"
            value={user.password}
            placeholder="Enter password"
            onChange={handleChange}
            required
          />
        </div>
        <span>
          <input type="checkbox" id="checkbox" name="checkAccount" />
          <label htmlFor="checkbox">Remember me</label>
        </span>
        <br />
        <button type="submit" className="signin-button">
          LOG IN
        </button>
        <hr />
        <div className="account">
          <Link to="/register" className="signin-google">
            Register
          </Link>
          <button
            className="signin-google"
            type="button"
            onClick={SignInWithGoogle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid"
              viewBox="0 0 256 262"
            >
              <path
                fill="#4285F4"
                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
              ></path>
              <path
                fill="#34A853"
                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
              ></path>
              <path
                fill="#FBBC05"
                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
              ></path>
              <path
                fill="#EB4335"
                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
              ></path>
            </svg>
            Google
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
