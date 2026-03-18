import { useEffect, useState, useRef } from "react";
import { USDC_LOGO } from "@/lib/contracts";

interface USDCFlowProps {
  progress: number;
  totalAmount: string;
}

export function USDCFlow({ progress, totalAmount }: USDCFlowProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (progress <= 0 || progress >= 100) return;
    
    const addParticle = () => {
      const newParticle: Particle = {
        id: Date.now() + Math.random(),
        startX: 20,
        delay: Math.random() * 0.3,
        speed: 1.5 + Math.random() * 1,
        size: 14 + Math.random() * 6,
      };
      setParticles(prev => [...prev.slice(-8), newParticle]);
    };

    const interval = setInterval(addParticle, 400);
    return () => clearInterval(interval);
  }, [progress]);

  useEffect(() => {
    if (progress >= 100) {
      setParticles([]);
    }
  }, [progress]);

  const getFlowPosition = (p: Particle) => {
    const elapsed = (Date.now() - p.id) / 1000 - p.delay;
    if (elapsed < 0) return -10;
    const travelDistance = elapsed * p.speed * 50;
    const endX = 80;
    return Math.min(20 + travelDistance, endX);
  };

  return (
    <div className="relative w-full h-16 flex items-center justify-center">
      <div className="relative flex items-center w-full" ref={containerRef}>
        <div className="flex flex-col items-center z-10">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40 animate-pulse-glow">
            <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-[8px] text-muted-foreground mt-1 font-bold">STREAM</span>
        </div>

        <div className="flex-1 mx-3 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="h-2 w-full bg-gradient-to-r from-primary/30 via-primary/50 to-green-500/50 rounded-full relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center overflow-hidden">
            {particles.map((p) => {
              const x = getFlowPosition(p);
              if (x > 85) return null;
              return (
                <img
                  key={p.id}
                  src={USDC_LOGO}
                  alt="USDC"
                  className="absolute rounded-full shadow-lg animate-flow"
                  style={{
                    left: `${x}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: p.size,
                    height: p.size,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center z-10">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/40">
            {progress > 0 && progress < 100 ? (
              <div className="relative">
                <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
              </div>
            ) : (
              <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            )}
          </div>
          <span className="text-[8px] text-muted-foreground mt-1 font-bold">WALLET</span>
        </div>
      </div>
    </div>
  );
}

interface Particle {
  id: number;
  startX: number;
  delay: number;
  speed: number;
  size: number;
}
