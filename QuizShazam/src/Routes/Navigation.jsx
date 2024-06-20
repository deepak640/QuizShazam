import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Protected from "../Protected";
import Login from "../components/Login";
import Register from "../components/Register";
import { Container, Dashboard, Home, Profile, Quiz, Result } from "../Exports";
import NotFound from "../components/NotFound";
import Loader from "../shared/Loader";
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/quiz/:id" element={<Quiz />} />
              <Route path="/profile">
                <Route index element={<Profile />} /> 
                <Route path="quiz/:id" element={<Result />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Container>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

export default Navigation;
