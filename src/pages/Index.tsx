import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { GlobalStatsBar } from "@/components/GlobalStatsBar";
import { Button } from "@/components/ui/button";
import { Plus, List, BarChart3 } from "lucide-react";

const Index = () => {
  const { isConnected } = useAccount();
  const location = useLocation();
  const isAppPage = location.pathname.startsWith("/app");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalStatsBar />
      
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-mono-display text-xl text-primary font-bold tracking-tighter">
              DRIP<span className="text-foreground">FLOW</span>
            </h1>
            <span className="label-micro mt-1">v1.0.0</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isConnected && (
              <nav className="flex items-center gap-1 mr-4">
                <NavLink to="/app/create" icon={<Plus className="w-4 h-4" />}>
                  Create
                </NavLink>
                <NavLink to="/app/streams" icon={<List className="w-4 h-4" />}>
                  My Streams
                </NavLink>
                <NavLink to="/app/protocol" icon={<BarChart3 className="w-4 h-4" />}>
                  Protocol
                </NavLink>
              </nav>
            )}
            <ConnectButton chainStatus="icon" accountStatus="avatar" />
          </div>
        </div>
      </header>

      {isConnected && (
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
      )}

      <footer className="border-t border-border mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <span className="label-micro">DRIPFLOW PROTOCOL</span>
          <Link 
            to="/app/protocol" 
            className="font-mono-display text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            VIEW PROTOCOL STATS →
          </Link>
        </div>
      </footer>
    </div>
  );
};

function NavLink({ 
  to, 
  children, 
  icon 
}: { 
  to: string; 
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to}>
      <Button 
        variant={isActive ? "secondary" : "ghost"} 
        size="sm"
        className="gap-1.5"
      >
        {icon}
        {children}
      </Button>
    </Link>
  );
}

export default Index;
