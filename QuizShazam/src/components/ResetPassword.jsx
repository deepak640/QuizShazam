import React from "react";
import "../assets/css/reset-password.css"; // Assuming this path for your CSS file
import { message } from "antd";
import { useParams } from "react-router-dom";
import { useMutation } from "react-query";
import { resetPassword } from "../func/apiCalls.service";
export default function ResetPassword() {

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const { token } = useParams();

  const { mutate } = useMutation(resetPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      messageApi.error("Passwords do not match!");
      return;
    }

    mutate({ values: { password }, token }, {
      onSuccess: (data) => {
        console.log(data)
        messageApi.success(data.message);
      },
      onError: ({ response }) => {
        messageApi.error(response.data.message);
      },
    });

    // Call the API to reset the password
  };


  return (
    <div className="reset-password-container">
      {contextHolder}
      <div className="reset-password-card">
        <h2>Reset Your Password</h2>
        <p>Enter your new password below to reset it.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              name="new-password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              placeholder="Enter new password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              name="confirm-password"
              placeholder="Confirm new password"
              required
            />
          </div>
          <button type="submit" className="reset-button">
            Reset Password
          </button>
        </form>
        <a href="/login" className="back-to-login">
          Back to Login
        </a>
      </div>
    </div>
  );
}
