import { useEffect, useState } from "react";
import { USDC_LOGO } from "@/lib/contracts";

interface USDCFlowProps {
  progress: number;
  totalAmount: string;
}

export function USDCFlow({ progress, totalAmount }: USDCFlowProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    if (progress <= 0 || progress >= 100) {
      setParticles([]);
      return;
    }

    const createParticle = () => {
      const newParticle: Particle = {
        id: Date.now() + Math.random(),
        startTime: Date.now(),
        duration: 2000 + Math.random() * 500,
      };
      setParticles(prev => [...prev.slice(-10), newParticle]);
    };

    createParticle();
    const interval = setInterval(createParticle, 600);
    return () => clearInterval(interval);
  }, [progress]);

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-[8px] text-muted-foreground mt-1">STREAM</span>
        </div>

        <div className="flex-1 mx-3 relative">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
              <img
                key={p.id}
                src={USDC_LOGO}
                alt="USDC"
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                style={{
                  left: '0%',
                  animationName: 'flowToWallet',
                  animationDuration: `${p.duration}ms`,
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/40">
            <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <span className="text-[8px] text-muted-foreground mt-1">WALLET</span>
        </div>
      </div>
    </div>
  );
}

interface Particle {
  id: number;
  startTime: number;
  duration: number;
}
