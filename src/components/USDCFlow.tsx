import { useEffect, useState } from "react";
import { USDC_LOGO } from "@/lib/contracts";

interface USDCFlowProps {
  progress: number;
  totalAmount: string;
}

export function USDCFlow({ progress, totalAmount }: USDCFlowProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (progress > 0 && progress < 100) {
        setParticles(prev => {
          const newParticle: Particle = {
            id: Date.now() + Math.random(),
            delay: Math.random() * 0.5,
            x: Math.random() * 60 + 20,
            size: Math.random() * 8 + 12,
          };
          return [...prev.slice(-5), newParticle];
        });
      }
    }, 800);

    return () => clearInterval(interval);
  }, [progress]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setParticles(prev => prev.filter(p => Date.now() - p.id < 2000));
    }, 500);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="relative w-full h-12 flex items-center justify-center">
      <div className="relative flex items-center justify-between w-full">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-[8px] text-muted-foreground mt-1">STREAM</span>
        </div>

        <div className="flex-1 mx-2 relative">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {particles.map((particle) => (
            <img
              key={particle.id}
              src={USDC_LOGO}
              alt="USDC"
              className="absolute rounded-full animate-flow opacity-80"
              style={{
                left: `${particle.x}%`,
                top: '-4px',
                width: particle.size,
                height: particle.size,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex gap-1">
              {[...Array(Math.floor(progress / 20))].map((_, i) => (
                <img
                  key={i}
                  src={USDC_LOGO}
                  alt="USDC"
                  className="w-3 h-3 rounded-full animate-bounce-subtle"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/40">
            <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  delay: number;
  x: number;
  size: number;
}
