import { useEffect, useState, useRef } from "react";

interface StreamCounterProps {
  totalAmount: number;
  dripPerSecond: number;
  isActive: boolean;
  claimedAmount: number;
}

const StreamCounter = ({ totalAmount, dripPerSecond, isActive, claimedAmount }: StreamCounterProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [pulsing, setPulsing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const streamed = Math.min(elapsed * dripPerSecond, totalAmount);
  const available = streamed - claimedAmount;
  const remaining = totalAmount - streamed;

  useEffect(() => {
    if (isActive && dripPerSecond > 0) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next * dripPerSecond >= totalAmount) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return next;
        });
        setPulsing(true);
        setTimeout(() => setPulsing(false), 300);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, dripPerSecond, totalAmount]);

  const formatAmount = (val: number) => {
    const whole = Math.floor(val);
    const decimal = (val - whole).toFixed(6).slice(1);
    return { whole: whole.toString(), decimal };
  };

  const { whole, decimal } = formatAmount(available);

  return (
    <div className={`panel transition-all ${pulsing ? "pulse-border" : ""}`}>
      <div className="label-micro mb-4">[ STREAM_ACTIVE ] AVAILABLE TO CLAIM</div>

      <div className="flex items-baseline gap-1 mb-8">
        <span className="font-mono-display text-[4rem] leading-none text-primary tracking-tighter">
          {whole}
        </span>
        <span className="font-mono-display text-[2.5rem] leading-none text-primary/70 tracking-tighter">
          {decimal}
        </span>
        <span className="label-micro ml-3 self-end mb-2">USDC</span>
      </div>

      <div className="grid grid-cols-3 gap-0 border border-border">
        <div className="p-4 border-r border-border">
          <div className="label-micro mb-2">TOTAL_FUNDED</div>
          <div className="stream-value">{totalAmount.toLocaleString()}</div>
        </div>
        <div className="p-4 border-r border-border">
          <div className="label-micro mb-2">STREAMED</div>
          <div className="stream-value">{streamed.toFixed(6)}</div>
        </div>
        <div className="p-4">
          <div className="label-micro mb-2">REMAINING</div>
          <div className="stream-value">{remaining.toFixed(6)}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="label-micro">RATE:</div>
        <div className="font-mono-display text-sm text-accent">
          {dripPerSecond.toFixed(6)} USDC / SEC
        </div>
      </div>
    </div>
  );
};

export default StreamCounter;
