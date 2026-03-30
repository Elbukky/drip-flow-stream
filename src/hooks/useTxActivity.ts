import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import {
  GAMIFIED_SAVINGS_ADDRESS,
  GAMIFIED_SAVINGS_ABI,
  formatUSDCValue,
} from "@/lib/gamified-savings";

export interface TxEvent {
  type: string;
  time: string;
  amount: string;
  positive: boolean;
  timestamp: number;
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 0) return "just now";
  if (diff < 60) return "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} min${m > 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} hr${h > 1 ? "s" : ""} ago`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return `${d} day${d > 1 ? "s" : ""} ago`;
  }
  const w = Math.floor(diff / 604800);
  return `${w} week${w > 1 ? "s" : ""} ago`;
}

export function useTxActivity() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<TxEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address || !publicClient) return;

    let cancelled = false;

    async function fetchEvents() {
      setIsLoading(true);
      setError(null);
      try {
        const currentBlock = await publicClient!.getBlockNumber();
        // Look back ~50k blocks for history
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        // Event names match the ABI in gamified-savings.ts:
        // "Deposit", "TopUp", "Claim", "EmergencyWithdraw", "CheckIn", "BadgeMinted"
        const [depositLogs, topUpLogs, claimLogs, emergencyLogs, checkInLogs, badgeLogs] =
          await Promise.all([
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "Deposit",
              args: { user: address as `0x${string}` },
              fromBlock,
            }).catch(() => []),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "TopUp",
              args: { user: address as `0x${string}` },
              fromBlock,
            }).catch(() => []),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "Claim",
              args: { user: address as `0x${string}` },
              fromBlock,
            }).catch(() => []),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "EmergencyWithdraw",
              args: { user: address as `0x${string}` },
              fromBlock,
            }).catch(() => []),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "CheckIn",
              args: { user: address as `0x${string}` },
              fromBlock,
            }).catch(() => []),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "BadgeMinted",
              args: { user: address as `0x${string}` },
              fromBlock,
            }).catch(() => []),
          ]);

        // Cache block timestamps to avoid duplicate fetches
        const blockCache = new Map<bigint, number>();

        async function getBlockTimestamp(blockNumber: bigint): Promise<number> {
          if (blockCache.has(blockNumber)) return blockCache.get(blockNumber)!;
          try {
            const block = await publicClient!.getBlock({ blockNumber });
            const ts = Number(block.timestamp);
            blockCache.set(blockNumber, ts);
            return ts;
          } catch {
            return Math.floor(Date.now() / 1000);
          }
        }

        // Combine all logs with their event type
        const allRaw = [
          ...depositLogs.map((l) => ({ ...l, _eventType: "Deposit" as const })),
          ...topUpLogs.map((l) => ({ ...l, _eventType: "TopUp" as const })),
          ...claimLogs.map((l) => ({ ...l, _eventType: "Claim" as const })),
          ...emergencyLogs.map((l) => ({ ...l, _eventType: "EmergencyWithdraw" as const })),
          ...checkInLogs.map((l) => ({ ...l, _eventType: "CheckIn" as const })),
          ...badgeLogs.map((l) => ({ ...l, _eventType: "BadgeMinted" as const })),
        ];

        if (allRaw.length === 0) {
          if (!cancelled) setEvents([]);
          return;
        }

        // Pre-fetch all unique block timestamps in parallel
        const uniqueBlocks = [...new Set(allRaw.map((l) => l.blockNumber).filter((b): b is bigint => b != null))];
        await Promise.all(uniqueBlocks.map((b) => getBlockTimestamp(b)));

        // Parse each log into a TxEvent
        const parsed: TxEvent[] = allRaw.map((log) => {
          const args = log.args as Record<string, unknown>;
          const blockTs = log.blockNumber != null ? (blockCache.get(log.blockNumber) ?? 0) : 0;

          switch (log._eventType) {
            case "Deposit":
              return {
                type: "Deposit",
                time: formatTimeAgo(blockTs),
                amount: `+$${formatUSDCValue(args.amount as bigint)}`,
                positive: true,
                timestamp: blockTs,
              };
            case "TopUp":
              return {
                type: "Top Up",
                time: formatTimeAgo(blockTs),
                amount: `+$${formatUSDCValue(args.amount as bigint)}`,
                positive: true,
                timestamp: blockTs,
              };
            case "Claim":
              return {
                type: "Claim",
                time: formatTimeAgo(blockTs),
                amount: `+$${formatUSDCValue(args.amount as bigint)}`,
                positive: true,
                timestamp: blockTs,
              };
            case "EmergencyWithdraw":
              return {
                type: "Emergency",
                time: formatTimeAgo(blockTs),
                amount: `-$${formatUSDCValue(args.fee as bigint)} fee`,
                positive: false,
                timestamp: blockTs,
              };
            case "CheckIn":
              return {
                type: "Check-In",
                time: formatTimeAgo(blockTs),
                amount: `+${args.xpEarned ? formatUSDCValue(args.xpEarned as bigint) : "0"} XP`,
                positive: true,
                timestamp: blockTs,
              };
            case "BadgeMinted":
              return {
                type: "Badge Earned",
                time: formatTimeAgo(blockTs),
                amount: `Tier ${args.tier ?? "?"}`,
                positive: true,
                timestamp: blockTs,
              };
            default:
              return {
                type: "Unknown",
                time: formatTimeAgo(blockTs),
                amount: "--",
                positive: true,
                timestamp: blockTs,
              };
          }
        });

        // Sort newest first
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        if (!cancelled) setEvents(parsed.slice(0, 50));
      } catch (err) {
        console.error("Failed to fetch tx events:", err);
        if (!cancelled) {
          setEvents([]);
          setError("Could not load activity");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, isConnected, publicClient]);

  return { events, isLoading, error };
}
