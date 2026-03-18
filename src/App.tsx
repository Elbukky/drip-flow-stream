import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "./lib/providers";
import Landing from "./pages/Landing.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CreateStreamPage from "./pages/CreateStream.tsx";
import MyStreamsPage from "./pages/MyStreams.tsx";
import StreamDetailPage from "./pages/StreamDetail.tsx";
import ProtocolStatsPage from "./pages/ProtocolStats.tsx";

const queryClient = new QueryClient();

const App = () => (
  <Providers>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Index />} />
            <Route path="/app/create" element={<CreateStreamPage />} />
            <Route path="/app/streams" element={<MyStreamsPage />} />
            <Route path="/app/stream/:streamId" element={<StreamDetailPage />} />
            <Route path="/app/protocol" element={<ProtocolStatsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Providers>
);

export default App;
