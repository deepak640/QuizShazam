import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent, { loginPath = "/login" } = {}) => {
  const AuthComponent = (props) => {
    const Navigate = useNavigate();

    useEffect(() => {
      // Check authentication status when component mounts
      checkAuth();
    }, []);

    const isAuthenticated = Cookies.get("user"); // Replace 'authToken' with your cookie name
    const checkAuth = () => {
      // Example: Check if user is authenticated using cookies

      if (!isAuthenticated) {
        return Navigate("/", { state: true });
      }
    };

    // Render the wrapped component if authenticated
    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };

  return AuthComponent;
};

export default withAuth;
