import { useFormik } from "formik";
import { Link } from "react-router-dom";
import "../assets/css/login.css";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../auth/Firebase";
import Cookies from "js-cookie";
import { useMutation } from "react-query";
import { message } from "antd";
import Googlebutton from "../shared/Googlebutton";
import { googleLogin, userLogin } from "../func/apiCalls";
import { useState } from "react";
const Login = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isremember, setRemember] = useState(false);
  const { mutate, data, isLoading } = useMutation(
    async ({ values, method }) => {
      return method === "google"
        ? await googleLogin(values)
        : await userLogin(values);
    }
  );

  const formSubmit = async (values) => {
    mutate(
      { values, method: "login" },
      {
        onSuccess: (data) => {
          Cookies.set("user", JSON.stringify(data), {
            expires: isremember ? 30 : null,
          });
          window.location.href = "/dashboard";
        },
        onError: (error) => {
          messageApi.open({
            content: `${error.response.data.error}`,
            type: "error",
          });
        },
      }
    );
  };
  if (isLoading) {
    messageApi.open({
      content: "loading",
      type: "loading",
    });
  }
  const SignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      const values = {
        email: user.email,
        username: user.displayName,
        photoURL: user.photoURL,
      };
      mutate(
        { values, method: "google" },
        {
          onSuccess: (data) => {
            Cookies.set("user", JSON.stringify(data), {
              expires: isremember ? 30 : null,
            });
            window.location.href = "/dashboard";
          },
          onError: (error) => {
            messageApi.open({
              content: `${error.response.data.error}`,
              type: "error",
            });
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const { handleChange, values, handleSubmit } = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      formSubmit(values);
    },
  });

  return (
    <>
      {contextHolder}
      <div className="Login-container">
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>
          <div>
            <label htmlFor="email">email</label>
            <br />
            <input autoComplete="false"
              type="email"
              id="email"
              name="email"
              value={values.email}
              placeholder="Enter email"
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password">password</label>
            <br />
            <input autoComplete="false"
              type="password"
              id="password"
              name="password"
              value={values.password}
              placeholder="Enter password"
              onChange={handleChange}
              required
            />
          </div>
          <span>
            <input autoComplete="false"
              type="checkbox"
              id="checkbox"
              name="checkAccount"
              checked={isremember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="checkbox">Remember me</label>
          </span>
          <br />
          <button
            type="submit"
            className="signin-button"
            disabled={isLoading || data}
          >
            {isLoading ? "loading ..." : "LOG IN"}
          </button>
          <hr />
          <div className="account">
            <Link to="/register" className="signin-google">
              Register
            </Link>
            <Googlebutton
              handleClick={SignInWithGoogle}
              isLoading={isLoading || data}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
