import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./shared/Header";
const Container = ({ children, access }) => {
  const location = useLocation();
  const [show, setshow] = useState(false);
  useEffect(() => {
    setshow(access.includes(location.pathname));
  }, [location.pathname, access]);
  return (
    <>
      {show && <Header />}
      {children}
    </>
  );
};

export default Container;
