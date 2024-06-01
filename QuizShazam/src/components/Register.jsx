import React, { useState } from "react";

const Register = () => {
  const [user, setUser] = useState({
    Username: "",
    Email: "",
    Password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(user);
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
        <h2>Register</h2>
        <div>
          <label htmlFor="Username">Username</label>
          <br />
          <input
            type="text"
            id="Username"
            name="Username"
            value={user.Username}
            placeholder="Enter Username"
            onChange={handleChange}
            required
          />
        </div>
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
        <button type="submit">REGISTER</button>
      </form>
    </div>
  );
};

export default Register;
