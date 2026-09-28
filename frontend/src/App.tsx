import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { ArchitectureOverviewPage } from "./pages/ArchitectureOverviewPage";
import { StationCode } from "./types";
import { useHealthCheck } from "./hooks/useHealthCheck";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false
    }
  }
});

const AppContent: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<StationCode>("BHARATI");
  const { data: health, isSuccess } = useHealthCheck();

  return (
    <div className="min-h-screen bg-polar-950 flex flex-col justify-between">
      <Header
        selectedStation={selectedStation}
        onSelectStation={setSelectedStation}
        backendHealthy={isSuccess && health?.status === "healthy"}
      />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <ArchitectureOverviewPage
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
        />
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
