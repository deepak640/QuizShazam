import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Protected from "../Protected";
import Container from "../Container";
import Home from "../components/Home";
import Login from "../components/Login";
import Register from "../components/Register";
import Dashboard from "../components/Dashboard";
import Quiz from "../components/Quiz";
const Navigation = () => {
  const HeaderPaths = ["/", "/dashboard"];
  return (
    <>
      <BrowserRouter>
        <Container access={HeaderPaths}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/negi" element={<Protected />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/quiz/:id" element={<Quiz />} />
            <Route path="*" element={<Protected />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </>
  );
};

export default Navigation;
