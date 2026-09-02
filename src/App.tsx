import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import ApiKeys from "./pages/ApiKeys";
import LocalHub from "./pages/LocalHub";
import Dashboard from "./pages/Dashboard";
import Providers from "./pages/Providers";
import Sidebar from "./components/Sidebar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen bg-[#0a0b2e] text-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/local-hub" element={<LocalHub />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;