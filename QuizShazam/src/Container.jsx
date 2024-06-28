import { useLocation } from "react-router-dom";
import Header from "./shared/Header";
import { useEffect, useState } from "react";
const Container = ({ children }) => {
  const { pathname } = useLocation();
  const [Visible, setVisible] = useState(null);
  const headers = ["quiz", "login", "register"];

  useEffect(() => {
    setVisible(true);
    headers.map((x) => {
      if (pathname.includes(x)) {
        setVisible(false);
      }
    });
  });
  return (
    <>
      {Visible && <Header />}
      {children}
    </>
  );
};

export default Container;
