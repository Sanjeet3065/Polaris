import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { StationProvider } from "./context/StationContext";
import { DemoProvider } from "./context/DemoContext";
import { AppRoutes } from "./routes/AppRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StationProvider>
          <DemoProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </DemoProvider>
        </StationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
