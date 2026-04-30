"use client";
import { QueryClient, QueryClientProvider } from "react-query";
import { useState } from "react";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
