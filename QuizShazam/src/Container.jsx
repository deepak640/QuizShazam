import Header from "./shared/Header";
const Container = ({ children }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default Container;
