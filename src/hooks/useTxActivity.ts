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
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
}

export function useTxActivity() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<TxEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || !publicClient) return;

    let cancelled = false;

    async function fetchEvents() {
      setIsLoading(true);
      try {
        const currentBlock = await publicClient!.getBlockNumber();
        const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

        const [depositLogs, topUpLogs, claimLogs, emergencyLogs] =
          await Promise.all([
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "Deposit",
              args: { user: address as `0x${string}` },
              fromBlock,
            }),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "TopUp",
              args: { user: address as `0x${string}` },
              fromBlock,
            }),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "Claim",
              args: { user: address as `0x${string}` },
              fromBlock,
            }),
            publicClient!.getContractEvents({
              address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
              abi: GAMIFIED_SAVINGS_ABI,
              eventName: "EmergencyWithdraw",
              args: { user: address as `0x${string}` },
              fromBlock,
            }),
          ]);

        const blockCache = new Map<bigint, number>();

        async function getBlockTimestamp(blockNumber: bigint): Promise<number> {
          if (blockCache.has(blockNumber)) return blockCache.get(blockNumber)!;
          const block = await publicClient!.getBlock({ blockNumber });
          const ts = Number(block.timestamp);
          blockCache.set(blockNumber, ts);
          return ts;
        }

        const allRaw = [
          ...depositLogs.map((l) => ({ ...l, eventName: "Deposit" as const })),
          ...topUpLogs.map((l) => ({ ...l, eventName: "TopUp" as const })),
          ...claimLogs.map((l) => ({ ...l, eventName: "Claim" as const })),
          ...emergencyLogs.map((l) => ({ ...l, eventName: "EmergencyWithdraw" as const })),
        ];

        if (allRaw.length === 0) {
          if (!cancelled) setEvents([]);
          return;
        }

        const uniqueBlocks = [...new Set(allRaw.map((l) => l.blockNumber))];
        await Promise.all(uniqueBlocks.map((b) => getBlockTimestamp(b)));

        const parsed: TxEvent[] = allRaw.map((log) => {
          const args = log.args as Record<string, unknown>;
          const blockTs = blockCache.get(log.blockNumber!) ?? 0;

          switch (log.eventName) {
            case "Deposit":
              return {
                type: "DEPOSIT",
                time: formatTimeAgo(blockTs),
                amount: `+$${formatUSDCValue(args.amount as bigint)}`,
                positive: true,
                timestamp: blockTs,
              };
            case "TopUp":
              return {
                type: "TOP UP",
                time: formatTimeAgo(blockTs),
                amount: `+$${formatUSDCValue(args.amount as bigint)}`,
                positive: true,
                timestamp: blockTs,
              };
            case "Claim":
              return {
                type: "CLAIM",
                time: formatTimeAgo(blockTs),
                amount: `+$${formatUSDCValue(args.amount as bigint)}`,
                positive: true,
                timestamp: blockTs,
              };
            case "EmergencyWithdraw":
              return {
                type: "EMERGENCY",
                time: formatTimeAgo(blockTs),
                amount: `+$${formatUSDCValue(args.amountAfterFee as bigint)}`,
                positive: false,
                timestamp: blockTs,
              };
            default:
              return {
                type: log.eventName,
                time: formatTimeAgo(blockTs),
                amount: "—",
                positive: true,
                timestamp: blockTs,
              };
          }
        });

        parsed.sort((a, b) => b.timestamp - a.timestamp);
        if (!cancelled) setEvents(parsed.slice(0, 50));
      } catch (err) {
        console.error("Failed to fetch tx events:", err);
        if (!cancelled) setEvents([]);
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

  return { events, isLoading };
}
