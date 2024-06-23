import React from "react";
import Navigation from "./Routes/Navigation";
import "./App.css";
import { QueryClient, QueryClientProvider } from "react-query";
const App = () => {
  const Client = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Disable refetch on window focus globally
      },
    },
  });
  return (
    <QueryClientProvider client={Client}>
      <Navigation />
    </QueryClientProvider>
  );
};

export default App;
