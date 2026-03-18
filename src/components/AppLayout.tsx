import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Plus, List, BarChart3 } from "lucide-react";
import { WalletDisplay } from "@/components/WalletDisplay";

export function AppHeader() {
  const { isConnected } = useAccount();
  const location = useLocation();

  return (
    <header className="border-b border-border sticky top-0 z-40 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app">
            <h1 className="font-mono-display text-xl text-primary font-bold tracking-tighter">
              DRIP<span className="text-foreground">FLOW</span>
            </h1>
          </Link>
          <span className="label-micro mt-1 hidden sm:block">v1.0.0</span>
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected && (
            <nav className="hidden md:flex items-center gap-1 mr-4">
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
          <WalletDisplay />
        </div>
      </div>
      
      {isConnected && (
        <div className="md:hidden border-t border-border px-6 py-2 flex gap-2 overflow-x-auto">
          <MobileNavLink to="/app/create" icon={<Plus className="w-4 h-4" />}>
            Create
          </MobileNavLink>
          <MobileNavLink to="/app/streams" icon={<List className="w-4 h-4" />}>
            Streams
          </MobileNavLink>
          <MobileNavLink to="/app/protocol" icon={<BarChart3 className="w-4 h-4" />}>
            Protocol
          </MobileNavLink>
        </div>
      )}
    </header>
  );
}

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

function MobileNavLink({ 
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
        className="gap-1.5 whitespace-nowrap"
      >
        {icon}
        {children}
      </Button>
    </Link>
  );
}

export function AppFooter() {
  return (
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
  );
}
