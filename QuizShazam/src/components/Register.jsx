import axios from "axios";
import { Link } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../auth/Firebase";
import { useFormik } from "formik";
import { message } from "antd";
import Cookies from "js-cookie";
import Googlebutton from "../shared/Googlebutton";
import { userRegister } from "../func/apiCalls";
import { useMutation } from "react-query";
const Register = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const { mutate, isLoading, error } = useMutation(async (values) => {
    return await userRegister(values);
  });

  const formSubmit = async (values) => {
    mutate(values, {
      onSuccess: (data) => {
        console.log("🚀 ~ formSubmit ~ data:", data);
        Cookies.set("user", JSON.stringify(data), { expires: 1 });
        window.location.href = "/dashboard";
      },
      onError: (error) => {
        console.log(error.response.data.error);
        messageApi.open({
          content: `${error.response.data.error}`,
          type: "error",
        });
      },
    });
  };

  const SignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const { user } = await signInWithPopup(auth, provider);
      const values = {
        username: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      mutate(values, {
        onSuccess: (data) => {
          console.log("🚀 ~ SignInWithGoogle ~ data:", data);
          Cookies.set("user", JSON.stringify(data), { expires: 1 / 24 });
          window.location.href = "/dashboard";
        },
        onError: (error) => {
          // console.log(error.response.data.error);
          messageApi.open({
            content: `${error.response.data.error}`,
            type: "error",
          });
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const { handleChange, values, handleSubmit } = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      formSubmit(values);
    },
  });
  if (isLoading) {
    messageApi.open({
      content: "loading",
      type: "loading",
    });
  }
  return (
    <div className="Login-container">
      {contextHolder}
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div>
          <label htmlFor="username">username</label>
          <br />
          <input
            type="text"
            id="username"
            name="username"
            value={values.username}
            placeholder="Enter username"
            onChange={handleChange}
            required
          />
        </div>
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
          {isLoading ? "loading ..." : "REGISTER"}
        </button>
        <hr />
        <div className="account">
          <Link to="/login" className="signin-google">
            login
          </Link>
          <Googlebutton handleClick={SignInWithGoogle} isloading={isLoading} />
        </div>
      </form>
    </div>
  );
};

export default Register;
