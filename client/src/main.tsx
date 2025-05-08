import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./hooks/use-auth";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vibe-theme">
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
