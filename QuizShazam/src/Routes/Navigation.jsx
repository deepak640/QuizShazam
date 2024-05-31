import React from 'react'
import { BrowserRouter,Route,Routes } from "react-router-dom";
import Protected from "../Protected"
import Container from '../Container';
import Home from "../components/Home";
const Navigation = () => {
  return (
    <>
    <BrowserRouter>
        <Container>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/negi" element={<Protected/>}/>
          <Route path="*" element={<Protected/>}/>
        </Routes>
        </Container>
    </BrowserRouter>
    </>
  )
}

export default Navigation
