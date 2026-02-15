import "@fontsource/playfair-display";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import MaintainerSetup from "./pages/MaintainerSetup.tsx";
import Quiz from "./pages/Quiz.tsx";
import { ResponseReceived } from "./pages/ResponseReceived.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MaintainerSetup />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/received" element={<ResponseReceived />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
