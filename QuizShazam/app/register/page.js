"use client";
import { useState } from "react";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useFormik } from "formik";
import { message, Modal, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import GoogleButton from "@/components/GoogleButton";
import { userRegister } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { IoEyeOutline, IoEyeOffOutline, IoRocketOutline } from "react-icons/io5";

export default function Register() {
  const [messageApi, contextHolder] = message.useMessage();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [file, setFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { mutate, isPending: isLoading, data } = useMutation({ mutationFn: userRegister });

  const onSuccess = (data) => {
    Cookies.set("user", JSON.stringify(data), { expires: 1 });
    window.location.href = "/dashboard";
  };
  const onError = (error) => messageApi.error(error.response?.data?.error || "Registration failed");

  const submitWithFile = (values) => {
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("email", values.email);
    formData.append("password", values.password);
    if (file) formData.append("file", file);
    mutate(formData, { onSuccess, onError });
  };

  const handleModalClose = () => {
    setModalOpen(false);
    submitWithFile(pendingValues);
  };

  const SignInWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      mutate({ username: user.displayName, email: user.email, photoURL: user.photoURL }, { onSuccess, onError });
    } catch {}
  };

  const { handleChange, values, handleSubmit } = useFormik({
    initialValues: { username: "", email: "", password: "" },
    onSubmit: (vals) => { setPendingValues(vals); setModalOpen(true); },
  });

  const fields = [
    { name: "username", label: "Username", type: "text", placeholder: "Your display name" },
    { name: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
    { name: "password", label: "Password", type: showPassword ? "text" : "password", placeholder: "Min. 8 characters" },
  ];

  return (
    <div className="min-h-[90vh] flex">
      {contextHolder}

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 to-violet-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <IoRocketOutline className="text-white" size={24} />
            <span className="text-white font-bold text-xl">QuizShazam</span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Join the<br />Quiz Revolution!
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed">
            Create your free account and start challenging yourself across hundreds of topics today.
          </p>
          <div className="mt-8 space-y-3">
            {["✓ Free forever", "✓ Instant access to all quizzes", "✓ Track your progress"].map((item) => (
              <p key={item} className="text-sm text-indigo-100 font-medium">{item}</p>
            ))}
          </div>
        </div>
        <p className="text-indigo-300 text-xs relative z-10">© 2025 QuizShazam</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md fade-up">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-1">Create Account</h2>
            <p className="text-slate-500 text-sm">It's free and takes less than a minute</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{field.label}</label>
                <div className="relative">
                  <input
                    type={field.type} name={field.name} value={values[field.name]}
                    onChange={handleChange} required placeholder={field.placeholder} autoComplete="off"
                    className="w-full border-2 border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-300 focus:border-violet-300 focus:bg-white transition"
                  />
                  {field.name === "password" && (
                    <button
                      type="button" onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit" disabled={isLoading || !!data}
              className="w-full bg-gradient-to-r from-violet-700 to-indigo-500 text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-violet-200 text-sm"
            >
              {isLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">or sign up with</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <GoogleButton handleClick={SignInWithGoogle} isLoading={isLoading || !!data} />
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-700 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Profile photo modal */}
      <Modal title={null} centered footer={null} width={380} open={modalOpen} onCancel={handleModalClose} className="rounded-2xl overflow-hidden">
        <div className="text-center pt-4 pb-2">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Add a profile photo</h3>
          <p className="text-sm text-slate-500 mb-6">Optional — you can always add one later</p>
          <div className="flex justify-center mb-6">
            <Upload
              listType="picture-circle"
              fileList={fileList}
              onChange={({ fileList: newList }) => {
                setFileList(newList.slice(-1));
                if (newList[0]?.originFileObj) setFile(newList[0].originFileObj);
              }}
              onRemove={() => setFileList([])}
              beforeUpload={() => false}
            >
              {fileList.length >= 1 ? null : (
                <button style={{ border: 0, background: "none" }} type="button">
                  <PlusOutlined />
                  <div style={{ marginTop: 8, fontSize: 12 }}>Upload</div>
                </button>
              )}
            </Upload>
          </div>
          <button
            onClick={handleModalClose}
            className="w-full bg-gradient-to-r from-violet-700 to-indigo-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition text-sm"
          >
            Continue →
          </button>
          <button onClick={handleModalClose} className="mt-3 text-sm text-slate-400 hover:text-slate-600 transition w-full">
            Skip for now
          </button>
        </div>
      </Modal>
    </div>
  );
}
