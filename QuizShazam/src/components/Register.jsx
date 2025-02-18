import { Link } from "react-router-dom";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../auth/Firebase";
import { useFormik } from "formik";
import { message } from "antd";
import Cookies from "js-cookie";
import Googlebutton from "../shared/Googlebutton";
import { userRegister } from "../func/apiCalls";
import { useMutation } from "react-query";
import { useState } from "react";
import { Modal, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const Register = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState({ open: false, values: {} });
  const [fileList, setFileList] = useState([]);
  const [file, setFile] = useState(null);

  const uploadButton = (
    <button
      style={{ border: 0, background: "none" }}
      type="button"
    >
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const { mutate, isLoading, data } = useMutation(async (values) => {
    return await userRegister(values);
  });

  const formSubmit = async (values) => {
    setIsModalOpen({ open: true, values });
  };

  const handleUploadCancel = () => {
    setIsModalOpen((prev) => ({ ...prev, open: false }));
    let values = isModalOpen.values;
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("file", file);
    mutate(formData, {
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

  const handleUpload = async ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1)); // Keep only the latest file
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      setFile(newFileList[0].originFileObj);
    }
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
          <input autoComplete="false"
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
          <input autoComplete="false" type="checkbox" id="checkbox" name="checkAccount" />
          <label htmlFor="checkbox">Remember me</label>
        </span>
        <br />
        <button
          type="submit"
          className="signin-button"
          disabled={isLoading || data}
        >
          {isLoading ? "loading ..." : "REGISTER"}
        </button>
        <hr />
        <div className="account">
          <Link to="/login" className="signin-google">
            login
          </Link>
          <Googlebutton
            handleClick={SignInWithGoogle}
            isloading={isLoading || data}
          />
          <Modal
            title="Upload Files"
            centered
            footer={null}
            width={500}
            open={isModalOpen.open}
            onOk={handleUploadCancel}
            onCancel={handleUploadCancel}
          >
            <div className="upload-div">
              <Upload
                listType="picture-circle"
                fileList={fileList}
                onChange={handleUpload}
                onRemove={() => setFileList([])}
                beforeUpload={() => false} // Prevent automatic upload
              >
                {fileList.length >= 1 ? null : uploadButton}
              </Upload>
            </div>
          </Modal>
        </div>
      </form>
    </div>
  );
};

export default Register;
