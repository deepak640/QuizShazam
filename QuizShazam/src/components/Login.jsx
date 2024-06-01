import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/login.css";
const Login = () => {
  const [user, setUser] = useState({
    Email: "",
    Password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
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
          <label htmlFor="Email">Email</label>
          <br />
          <input
            type="email"
            id="Email"
            name="Email"
            value={user.Email}
            placeholder="Enter Email"
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="Password">Password</label>
          <br />
          <input
            type="password"
            id="Password"
            name="Password"
            value={user.Password}
            placeholder="Enter Password"
            onChange={handleChange}
            required
          />
        </div>
        <span>
          <input type="checkbox" id="checkbox" name="checkAccount" />
          <label htmlFor="checkbox">Remember me</label>
        </span>
        <br />
        <button type="submit">LOG IN</button>
        <hr />
        <Link to="/register">Register</Link>
      </form>
    </div>
  );
};

export default Login;
