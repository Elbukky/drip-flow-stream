import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";
import WalletConnect from "@/components/WalletConnect";
import StreamCounter from "@/components/StreamCounter";
import PayerDashboard from "@/components/PayerDashboard";
import ActiveStreams, { type Stream } from "@/components/ActiveStreams";
import VaultProgress from "@/components/VaultProgress";
import TransactionLog, { type Transaction } from "@/components/TransactionLog";

interface StreamConfig {
  id: string;
  amount: number;
  interval: "second" | "minute";
  duration: number;
  dripPerSecond: number;
  receiver: string;
  sender: string;
  startTime: number;
}

const Index = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [streamConfigs, setStreamConfigs] = useState<StreamConfig[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [claimedByStream, setClaimedByStream] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connected = isConnected;
  const walletAddress = address ?? "";

  const isActive = streamConfigs.length > 0;
  const latestConfig = streamConfigs[streamConfigs.length - 1] ?? null;

  const streamed = latestConfig
    ? Math.min(elapsed * latestConfig.dripPerSecond, latestConfig.amount)
    : 0;
  const totalClaimed = Object.values(claimedByStream).reduce((a, b) => a + b, 0);
  const available = streamed - totalClaimed;

  useEffect(() => {
    if (isActive && latestConfig) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next * latestConfig.dripPerSecond >= latestConfig.amount) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, latestConfig]);

  const handleInitialize = (config: { amount: number; interval: "second" | "minute"; duration: number; receiver: string }) => {
    const totalSeconds = config.duration * 86400;
    const dripPerSecond = config.interval === "second"
      ? config.amount / totalSeconds
      : config.amount / (config.duration * 1440);

    const streamId = crypto.randomUUID();
    const newConfig: StreamConfig = {
      id: streamId,
      ...config,
      dripPerSecond,
      sender: walletAddress,
      startTime: Date.now(),
    };

    setStreamConfigs((prev) => [...prev, newConfig]);
    setElapsed(0);

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
    setTransactions((prev) => [fundTx, tx, ...prev]);
  };

  const handleClaimStream = useCallback((streamId: string) => {
    const config = streamConfigs.find((s) => s.id === streamId);
    if (!config) return;

    const elapsedSec = Math.floor((Date.now() - config.startTime) / 1000);
    const totalStreamed = Math.min(elapsedSec * config.dripPerSecond, config.amount);
    const alreadyClaimed = claimedByStream[streamId] ?? 0;
    const claimable = totalStreamed - alreadyClaimed;

    if (claimable > 0) {
      setClaimedByStream((prev) => ({
        ...prev,
        [streamId]: (prev[streamId] ?? 0) + claimable,
      }));
      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: "CLAIM",
        amount: claimable,
        timestamp: new Date(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }
  }, [streamConfigs, claimedByStream]);

  // Build active streams for receiver view
  const activeStreams: Stream[] = streamConfigs.map((config) => {
    const elapsedSec = Math.floor((Date.now() - config.startTime) / 1000);
    const totalStreamedForThis = Math.min(elapsedSec * config.dripPerSecond, config.amount);
    const claimed = claimedByStream[config.id] ?? 0;
    return {
      id: config.id,
      sender: config.sender,
      totalAmount: config.amount,
      dripPerSecond: config.dripPerSecond,
      interval: config.interval,
      availableToClaim: totalStreamedForThis - claimed,
      totalStreamed: totalStreamedForThis,
      totalClaimed: claimed,
      isActive: totalStreamedForThis < config.amount,
    };
  });

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
          <WalletConnect />
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
          {isActive && latestConfig && (
            <div className="mb-6">
              <StreamCounter
                totalAmount={latestConfig.amount}
                dripPerSecond={latestConfig.dripPerSecond}
                isActive={isActive}
                claimedAmount={totalClaimed}
              />
            </div>
          )}

          {/* Panels grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-border">
            {/* Payer panel */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-border">
              <div className="p-0">
                <PayerDashboard onInitialize={handleInitialize} isActive={false} />
              </div>
            </div>

            {/* Receiver panel - Active Streams */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-border">
              <div className="p-0">
                <ActiveStreams streams={activeStreams} onClaim={handleClaimStream} />
              </div>
            </div>

            {/* Vault + Ledger */}
            <div className="lg:col-span-4">
              <div className="h-64 border-b border-border">
                <VaultProgress
                  total={latestConfig?.amount ?? 0}
                  streamed={streamed}
                  claimed={totalClaimed}
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
