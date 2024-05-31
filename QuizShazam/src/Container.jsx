import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./shared/Header"
const Container = ({ children }) => {
  const location = useLocation();
  const [show, setshow] = useState(false);
  useEffect(() => {
    setshow(location.pathname !== "/negi");
  }, [location.pathname]);

  return <>{
    show && <Header/>
  }
  {children}
  </>;
};

export default Container;
