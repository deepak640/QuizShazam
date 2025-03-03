import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Protected from "../Protected";
import Login from "../components/Login";
import Register from "../components/Register";
import { Container, Dashboard, Home, Profile, Quiz, Result } from "../Exports";
import NotFound from "../components/NotFound";
import Loader from "../shared/Loader";
import UploadQuiz from "../components/Upload";
import ResetPassword from "../components/ResetPassword";
const Navigation = () => {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Container>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/negi" element={<Protected />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/upload" element={<UploadQuiz />} />
              <Route path="/dashboard">
                <Route index element={<Dashboard />} />
                <Route path="quiz/:id" element={<Quiz />} />
              </Route>
              <Route path="/profile">
                <Route index element={<Profile />} />
                <Route path="quiz/:id" element={<Result />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Routes>
          </Container>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

export default Navigation;
