import { useEffect, useState } from "react";
import { USDC_LOGO, formatUSDC, getPerUnlockAmount } from "@/lib/contracts";

interface USDCFlowProps {
  progress: number;
  totalAmount: bigint | string;
  paused?: boolean;
  duration?: bigint;
  interval?: bigint;
}

export function USDCFlow({ progress, totalAmount, paused = false, duration, interval }: USDCFlowProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [nextUnlockIn, setNextUnlockIn] = useState(0);
  
  const intervalSeconds = interval ? Number(interval) : 60;
  const perUnlock = duration && interval ? getPerUnlockAmount(BigInt(totalAmount.toString()), duration, interval) : null;
  
  useEffect(() => {
    if (paused || progress <= 0 || progress >= 100) {
      setParticles([]);
      setNextUnlockIn(0);
      return;
    }

    const updateNextUnlock = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsSinceStart = now % intervalSeconds;
      const secondsUntilNext = intervalSeconds - secondsSinceStart;
      setNextUnlockIn(secondsUntilNext);
    };

    updateNextUnlock();
    const countdownInterval = setInterval(updateNextUnlock, 1000);

    const createParticleBurst = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 3; i++) {
        newParticles.push({
          id: Date.now() + Math.random() + i,
          startTime: Date.now(),
          duration: 1500 + Math.random() * 300,
        });
      }
      setParticles(prev => [...prev.slice(-15), ...newParticles]);
    };

    createParticleBurst();
    const burstInterval = setInterval(createParticleBurst, intervalSeconds * 1000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(burstInterval);
    };
  }, [progress, paused, intervalSeconds]);

  useEffect(() => {
    if (nextUnlockIn === 1 && !paused) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 5; i++) {
        newParticles.push({
          id: Date.now() + Math.random() + i,
          startTime: Date.now(),
          duration: 1500 + Math.random() * 300,
        });
      }
      setParticles(prev => [...prev.slice(-15), ...newParticles]);
    }
  }, [nextUnlockIn, paused]);

  const formatCountdown = (seconds: number) => {
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            paused ? 'border-yellow-500/40 bg-yellow-500/20' : 'border-primary/40 bg-primary/20'
          }`}>
            {paused ? (
              <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )}
          </div>
          <span className="text-[8px] text-muted-foreground mt-1">{paused ? 'PAUSED' : 'STREAM'}</span>
        </div>

        <div className="flex-1 mx-3 relative">
          <div className={`h-2 rounded-full overflow-hidden ${paused ? 'bg-yellow-500/30' : 'bg-muted'}`}>
            <div 
              className={`h-full transition-all duration-300 ${
                paused ? 'bg-yellow-500' : 'bg-gradient-to-r from-primary to-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {!paused && (
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
          )}

          {interval && !paused && progress < 100 && (
            <div className="absolute -bottom-5 left-0 right-0 flex justify-center">
              <span className="text-[9px] text-muted-foreground bg-background px-1">
                NEXT: {formatCountdown(nextUnlockIn)}
                {perUnlock && <span className="ml-1 text-primary">(+{formatUSDC(perUnlock)} USDC)</span>}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            paused ? 'border-yellow-500/40 bg-yellow-500/20' : 'border-green-500/40 bg-green-500/20'
          }`}>
            <svg className={`w-5 h-5 ${paused ? 'text-yellow-500' : 'text-green-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
