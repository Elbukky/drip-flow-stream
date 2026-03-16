import { useState, useEffect, useRef, useCallback } from "react";
import WalletConnect from "@/components/WalletConnect";
import StreamCounter from "@/components/StreamCounter";
import PayerDashboard from "@/components/PayerDashboard";
import ReceiverDashboard from "@/components/ReceiverDashboard";
import VaultProgress from "@/components/VaultProgress";
import TransactionLog, { type Transaction } from "@/components/TransactionLog";

interface StreamConfig {
  amount: number;
  interval: "second" | "minute";
  duration: number;
  dripPerSecond: number;
}

const Index = () => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [claimed, setClaimed] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const streamed = streamConfig
    ? Math.min(elapsed * streamConfig.dripPerSecond, streamConfig.amount)
    : 0;
  const available = streamed - claimed;

  useEffect(() => {
    if (isActive && streamConfig) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next * streamConfig.dripPerSecond >= streamConfig.amount) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, streamConfig]);

  const handleConnect = (addr: string) => {
    setAddress(addr);
    setConnected(true);
  };

  const handleInitialize = (config: { amount: number; interval: "second" | "minute"; duration: number }) => {
    const totalSeconds = config.duration * 86400;
    const dripPerSecond = config.interval === "second"
      ? config.amount / totalSeconds
      : config.amount / (config.duration * 1440);

    setStreamConfig({
      ...config,
      dripPerSecond,
    });
    setIsActive(true);
    setElapsed(0);
    setClaimed(0);

    const tx: Transaction = {
      id: crypto.randomUUID(),
      type: "INIT",
      amount: config.amount,
      timestamp: new Date(),
    };
    const fundTx: Transaction = {
      id: crypto.randomUUID(),
      type: "FUND",
      amount: config.amount,
      timestamp: new Date(),
    };
    setTransactions([fundTx, tx]);
  };

  const handleClaim = useCallback(() => {
    if (available > 0) {
      const claimAmount = available;
      setClaimed((prev) => prev + claimAmount);
      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: "CLAIM",
        amount: claimAmount,
        timestamp: new Date(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }
  }, [available]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-mono-display text-xl text-primary font-bold tracking-tighter">
              DRIP<span className="text-foreground">FLOW</span>
            </h1>
            <span className="label-micro mt-1">v1.0.0</span>
          </div>
          <WalletConnect onConnect={handleConnect} connected={connected} address={address} />
        </div>
      </header>

      {/* Hero */}
      {!connected && (
        <div className="border-b border-border">
          <div className="max-w-[1400px] mx-auto px-6 py-20">
            <div className="max-w-2xl">
              <h2 className="font-mono-display text-5xl text-foreground font-bold tracking-tighter leading-none mb-4">
                FLOW STATE<span className="text-primary">.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Real-time capital distribution. No delays. No intermediaries. 
                Fund a vault, set the drip rate, and let the blockchain handle the rest.
              </p>
              <div className="mt-8 font-mono-display text-sm text-primary">
                4.829301 USDC / SEC
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {connected && (
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          {/* Stream counter - full width */}
          {isActive && streamConfig && (
            <div className="mb-6">
              <StreamCounter
                totalAmount={streamConfig.amount}
                dripPerSecond={streamConfig.dripPerSecond}
                isActive={isActive}
                claimedAmount={claimed}
              />
            </div>
          )}

          {/* Panels grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-border">
            {/* Payer panel */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-border">
              <div className="p-0">
                <PayerDashboard onInitialize={handleInitialize} isActive={isActive} />
              </div>
            </div>

            {/* Receiver panel */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-border">
              <div className="p-0">
                <ReceiverDashboard
                  availableToClaim={available}
                  totalStreamed={streamed}
                  totalClaimed={claimed}
                  dripRate={streamConfig?.dripPerSecond ?? 0}
                  interval={streamConfig?.interval ?? "second"}
                  isActive={isActive}
                  onClaim={handleClaim}
                />
              </div>
            </div>

            {/* Vault + Ledger */}
            <div className="lg:col-span-4">
              <div className="h-64 border-b border-border">
                <VaultProgress
                  total={streamConfig?.amount ?? 0}
                  streamed={streamed}
                  claimed={claimed}
                />
              </div>
              <TransactionLog transactions={transactions} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <span className="label-micro">DRIPFLOW PROTOCOL</span>
          <span className="font-mono-display text-xs text-muted-foreground">
            {isActive ? "STATUS: STREAMING" : "STATUS: IDLE"}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
