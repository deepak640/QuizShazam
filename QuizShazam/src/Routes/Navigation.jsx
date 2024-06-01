import React from 'react'
import { BrowserRouter,Route,Routes } from "react-router-dom";
import Protected from "../Protected"
import Container from '../Container';
import Home from "../components/Home";
import Login from '../components/Login';
import Register from '../components/Register';
const Navigation = () => {
    const HeaderPaths = ["/", "/negi"];
  return (
    <>
      <BrowserRouter>
        <Container access={HeaderPaths}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/negi" element={<Protected />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Protected />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </>
  );
}

export default Navigation
