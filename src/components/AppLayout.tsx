import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Plus, List, BarChart3, Menu, X, FileText } from "lucide-react";
import { WalletDisplay } from "@/components/WalletDisplay";

const LOGO = "/logo.png";

export function AppHeader() {
  const { isConnected } = useAccount();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <>
      <header className="border-b border-border sticky top-0 z-10 bg-background">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <img src={LOGO} alt="DripFlow" className="w-7 h-7 sm:w-8 sm:h-8" />
              <h1 className="font-mono-display text-lg sm:text-xl text-primary font-bold tracking-tighter">
                DRIP<span className="text-foreground">FLOW</span>
              </h1>
            </Link>
            <span className="label-micro mt-1 hidden sm:block">v1.0.0</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {isConnected && (
              <>
                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-1">
                  <NavLink to="/app/create" icon={<Plus className="w-4 h-4" />}>
                    Create
                  </NavLink>
                  <NavLink to="/app/streams" icon={<List className="w-4 h-4" />}>
                    My Streams
                  </NavLink>
                  <NavLink to="/app/protocol" icon={<BarChart3 className="w-4 h-4" />}>
                    Protocol
                  </NavLink>
                  <NavLink to="/docs" icon={<FileText className="w-4 h-4" />}>
                    Docs
                  </NavLink>
                </nav>

                {/* Mobile hamburger */}
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-2 hover:bg-muted rounded"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
            <WalletDisplay />
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border p-6 pt-20">
            <nav className="flex flex-col gap-2">
              <MobileNavLink 
                to="/app/create" 
                icon={<Plus className="w-5 h-5" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Stream
              </MobileNavLink>
              <MobileNavLink 
                to="/app/streams" 
                icon={<List className="w-5 h-5" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Streams
              </MobileNavLink>
              <MobileNavLink 
                to="/app/protocol" 
                icon={<BarChart3 className="w-5 h-5" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                Protocol
              </MobileNavLink>
              <MobileNavLink 
                to="/docs" 
                icon={<FileText className="w-5 h-5" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </MobileNavLink>
            </nav>
          </div>
        </div>
      )}
    </>
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
  icon,
  onClick
}: { 
  to: string; 
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} onClick={onClick}>
      <Button 
        variant={isActive ? "secondary" : "ghost"} 
        size="lg"
        className="w-full justify-start gap-3"
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
