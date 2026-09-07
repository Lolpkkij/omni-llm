import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import ApiKeys from "./pages/ApiKeys";
import LocalHub from "./pages/LocalHub";
import Dashboard from "./pages/Dashboard";
import Providers from "./pages/Providers";
import Playground from "./pages/Playground";
import PromptLibrary from "./pages/PromptLibrary";
import DeveloperGateway from "./pages/DeveloperGateway";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import AccountRecovery from "./components/AccountRecovery";
import { useUnifiedKeyStore } from "@/store/useUnifiedKeyStore";
import { useProviderStore } from "@/store/useProviderStore";

const queryClient = new QueryClient();

const App = () => {
  const { loadKey } = useUnifiedKeyStore();
  const { load: loadProviders } = useProviderStore();

  useEffect(() => {
    loadKey();
    loadProviders();
  }, []);

  return (
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
                <Route path="/playground" element={<Playground />} />
                <Route path="/prompts" element={<PromptLibrary />} />
                <Route path="/api-keys" element={<ApiKeys />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/providers" element={<Providers />} />
                <Route path="/developer" element={<DeveloperGateway />} />
                <Route path="/local-hub" element={<LocalHub />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/auth/forgot-password" element={<AccountRecovery mode="forgot" />} />
                <Route path="/auth/reset-password" element={<AccountRecovery mode="reset" />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;