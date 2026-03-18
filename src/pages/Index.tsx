import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { GlobalStatsBar } from "@/components/GlobalStatsBar";
import { AppHeader, AppFooter } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, List, BarChart3 } from "lucide-react";

const Index = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <GlobalStatsBar />

      {isConnected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-mono-display text-4xl text-foreground font-bold tracking-tighter mb-4">
              WELCOME<span className="text-primary">.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Create your first token stream or view existing streams to get started.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/app/create">
                <Button size="lg" className="bg-primary hover:bg-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Stream
                </Button>
              </Link>
              <Link to="/app/streams">
                <Button size="lg" variant="outline">
                  <List className="w-4 h-4 mr-2" />
                  My Streams
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-mono-display text-4xl text-foreground font-bold tracking-tighter mb-4">
              FLOW STATE<span className="text-primary">.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Connect your wallet to create and manage token streams.
            </p>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
};

export default Index;
