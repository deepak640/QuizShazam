import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Protected from "../Protected";
import Container from "../Container";
import Home from "../components/Home";
import Login from "../components/Login";
import Register from "../components/Register";
import Dashboard from "../components/Dashboard";
import Quiz from "../components/Quiz";
import NotFound from "../components/NotFound";
import Profile from "../components/Profile";
import Result from "../components/Result";
const Navigation = () => {
  return (
    <>
      <BrowserRouter>
        <Container>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/negi" element={<Protected />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/quiz/:id" element={<Quiz />} />
            <Route path="/profile">
              <Route index element={<Profile />} />
              <Route path="quiz/:id" element={<Result />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </>
  );
};

export default Navigation;
