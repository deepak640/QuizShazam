import { useFormik } from "formik";
import { Link } from "react-router-dom";
import "../css/login.css";
import axios from "axios";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../auth/Firebase";
import Cookies from "js-cookie";
import { useMutation } from "react-query";
import { message } from "antd";
import Googlebutton from "../shared/Googlebutton";
import { googleLogin, userLogin } from "../func/apiCalls";
const Login = () => {
  const { VITE_REACT_API_URL } = import.meta.env;
  const [messageApi, contextHolder] = message.useMessage();

  const { mutate, isLoading } = useMutation(async ({ values, method }) => {
    return method === "google"
      ? await googleLogin(values)
      : await userLogin(values);
  });

  const formSubmit = async (values) => {
    mutate(
      { values, method: "login" },
      {
        onSuccess: (data) => {
          Cookies.set("user", JSON.stringify(data), { expires: 1 });
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
            Cookies.set("user", JSON.stringify(data), { expires: 1 });
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
            <input
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
            <input
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
            <input type="checkbox" id="checkbox" name="checkAccount" />
            <label htmlFor="checkbox">Remember me</label>
          </span>
          <br />
          <button type="submit" className="signin-button" disabled={isLoading}>
            {isLoading ? "loading ..." : "LOG IN"}
          </button>
          <hr />
          <div className="account">
            <Link to="/register" className="signin-google">
              Register
            </Link>
            <Googlebutton
              handleClick={SignInWithGoogle}
              isLoading={isLoading}
            />
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
