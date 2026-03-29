import { useCallback, useMemo } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  GAMIFIED_SAVINGS_ADDRESS,
  GAMIFIED_SAVINGS_ABI,
  STREAK_RECOVERY_FEE,
  type Position,
  type UserStats,
  type BadgeInfo,
} from "@/lib/gamified-savings";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const CONTRACT_CONFIG = {
  address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
  abi: GAMIFIED_SAVINGS_ABI,
} as const;

function toBigInt(val: unknown): bigint {
  if (typeof val === "bigint") return val;
  if (typeof val === "number") return BigInt(Math.floor(val));
  if (typeof val === "string") return BigInt(val);
  return 0n;
}

function parsePosition(raw: unknown): Position {
  const r = raw as Record<string, unknown>;
  return {
    totalDeposited: toBigInt(r.totalDeposited ?? r[0]),
    claimed: toBigInt(r.claimed ?? r[1]),
    startTime: toBigInt(r.startTime ?? r[2]),
    durationDays: Number(r.durationDays ?? r[3]),
    dailyAmount: toBigInt(r.dailyAmount ?? r[4]),
    percentBps: Number(r.percentBps ?? r[5]),
    mode: Number(r.mode ?? r[6]),
    active: Boolean(r.active ?? r[7]),
  };
}

function parseUserStats(raw: unknown): UserStats {
  if (Array.isArray(raw)) {
    return {
      totalXP: toBigInt(raw[0]),
      streak: toBigInt(raw[1]),
      multiplier: toBigInt(raw[2]),
      lastCheckIn: toBigInt(raw[3]),
      usedEmergency: Boolean(raw[4]),
    };
  }
  const r = raw as Record<string, unknown>;
  return {
    totalXP: toBigInt(r.totalXP ?? r[0]),
    streak: toBigInt(r.streak ?? r[1]),
    multiplier: toBigInt(r.multiplier ?? r[2]),
    lastCheckIn: toBigInt(r.lastCheckIn ?? r[3]),
    usedEmergency: Boolean(r.usedEmergency ?? r[4]),
  };
}

function parseBadges(raw: unknown): BadgeInfo {
  if (Array.isArray(raw)) {
    return {
      hasTier1: Boolean(raw[0]),
      hasTier2: Boolean(raw[1]),
      hasTier3: Boolean(raw[2]),
      tier1TokenId: toBigInt(raw[3]),
      tier2TokenId: toBigInt(raw[4]),
      tier3TokenId: toBigInt(raw[5]),
    };
  }
  const r = raw as Record<string, unknown>;
  return {
    hasTier1: Boolean(r.hasTier1 ?? r[0]),
    hasTier2: Boolean(r.hasTier2 ?? r[1]),
    hasTier3: Boolean(r.hasTier3 ?? r[2]),
    tier1TokenId: toBigInt(r.tier1TokenId ?? r[3]),
    tier2TokenId: toBigInt(r.tier2TokenId ?? r[4]),
    tier3TokenId: toBigInt(r.tier3TokenId ?? r[5]),
  };
}

const DEFAULT_STATS: UserStats = {
  totalXP: 0n,
  streak: 0n,
  multiplier: 0n,
  lastCheckIn: 0n,
  usedEmergency: false,
};

const DEFAULT_BADGES: BadgeInfo = {
  hasTier1: false,
  hasTier2: false,
  hasTier3: false,
  tier1TokenId: 0n,
  tier2TokenId: 0n,
  tier3TokenId: 0n,
};

const POLL_INTERVAL = 15_000; // 15 seconds

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGamifiedSavings() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // =========================================================================
  // Batched reads via useReadContracts (polls every 15s)
  // =========================================================================

  const batchedReads = useReadContracts({
    contracts: [
      {
        ...CONTRACT_CONFIG,
        functionName: "getUserPositions",
        args: [address as `0x${string}`],
      },
      {
        ...CONTRACT_CONFIG,
        functionName: "getTotalClaimable",
        args: [address as `0x${string}`],
      },
      {
        ...CONTRACT_CONFIG,
        functionName: "getUserStats",
        args: [address as `0x${string}`],
      },
      {
        ...CONTRACT_CONFIG,
        functionName: "getBadges",
        args: [address as `0x${string}`],
      },
      {
        ...CONTRACT_CONFIG,
        functionName: "getLifetimeSaved",
        args: [address as `0x${string}`],
      },
      {
        ...CONTRACT_CONFIG,
        functionName: "getPositionCount",
        args: [address as `0x${string}`],
      },
    ],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: POLL_INTERVAL,
    },
  });

  // =========================================================================
  // Parse batched results
  // =========================================================================

  const positions: Position[] = useMemo(() => {
    const result = batchedReads.data?.[0];
    if (result?.status !== "success" || !result.result) return [];
    const rawArr = result.result as unknown[];
    if (!Array.isArray(rawArr)) return [];
    return rawArr.map(parsePosition);
  }, [batchedReads.data]);

  const totalClaimable: bigint = useMemo(() => {
    const result = batchedReads.data?.[1];
    if (result?.status !== "success") return 0n;
    return toBigInt(result.result);
  }, [batchedReads.data]);

  const userStats: UserStats = useMemo(() => {
    const result = batchedReads.data?.[2];
    if (result?.status !== "success" || !result.result) return DEFAULT_STATS;
    return parseUserStats(result.result);
  }, [batchedReads.data]);

  const badges: BadgeInfo = useMemo(() => {
    const result = batchedReads.data?.[3];
    if (result?.status !== "success" || !result.result) return DEFAULT_BADGES;
    return parseBadges(result.result);
  }, [batchedReads.data]);

  const lifetimeSaved: bigint = useMemo(() => {
    const result = batchedReads.data?.[4];
    if (result?.status !== "success") return 0n;
    return toBigInt(result.result);
  }, [batchedReads.data]);

  const positionCount: number = useMemo(() => {
    const result = batchedReads.data?.[5];
    if (result?.status !== "success") return 0;
    return Number(toBigInt(result.result));
  }, [batchedReads.data]);

  // =========================================================================
  // Per-position claimable (individual read)
  // =========================================================================

  const claimableResult = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: "getClaimable",
    args: [address as `0x${string}`, 0n],
    query: { enabled: false }, // manual fetch only
  });

  // Cache for per-position claimable values returned from the positions data
  // For a synchronous getter, we derive claimable from positions data.
  // For async per-position reads, consumers can use the dedicated hook below.
  const getClaimable = useCallback(
    (_positionId: number): bigint => {
      // Return 0n as a synchronous default.
      // Components needing real-time per-position claimable should use
      // usePositionClaimable(positionId) exported separately below.
      void claimableResult; // reference to suppress unused warning
      return 0n;
    },
    [claimableResult]
  );

  // =========================================================================
  // Write contract instance
  // =========================================================================

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Invalidate all queries on confirmed tx
  if (isConfirmed && txHash) {
    queryClient.invalidateQueries();
  }

  // =========================================================================
  // Write actions
  // =========================================================================

  const depositFixedDaily = useCallback(
    (dailyAmount: bigint, totalValue: bigint) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writeContract as any)({
        ...CONTRACT_CONFIG,
        functionName: "depositFixedDaily",
        args: [dailyAmount],
        value: totalValue,
      });
    },
    [writeContract]
  );

  const depositPercentage = useCallback(
    (percentBps: number, durationDays: number, totalValue: bigint) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writeContract as any)({
        ...CONTRACT_CONFIG,
        functionName: "depositPercentage",
        args: [percentBps, durationDays],
        value: totalValue,
      });
    },
    [writeContract]
  );

  const topUpFixedDaily = useCallback(
    (positionId: number, value: bigint) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writeContract as any)({
        ...CONTRACT_CONFIG,
        functionName: "topUpFixedDaily",
        args: [BigInt(positionId)],
        value,
      });
    },
    [writeContract]
  );

  const topUpPercentage = useCallback(
    (positionId: number, recalculate: boolean, value: bigint) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writeContract as any)({
        ...CONTRACT_CONFIG,
        functionName: "topUpPercentage",
        args: [BigInt(positionId), recalculate],
        value,
      });
    },
    [writeContract]
  );

  const claim = useCallback(
    (positionId: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writeContract as any)({
        ...CONTRACT_CONFIG,
        functionName: "claim",
        args: [BigInt(positionId)],
      });
    },
    [writeContract]
  );

  const claimAll = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      ...CONTRACT_CONFIG,
      functionName: "claimAll",
      args: [],
    });
  }, [writeContract]);

  const emergencyWithdraw = useCallback(
    (positionId: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (writeContract as any)({
        ...CONTRACT_CONFIG,
        functionName: "emergencyWithdraw",
        args: [BigInt(positionId)],
      });
    },
    [writeContract]
  );

  const checkIn = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      ...CONTRACT_CONFIG,
      functionName: "checkIn",
      args: [],
    });
  }, [writeContract]);

  const recoverStreak = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      ...CONTRACT_CONFIG,
      functionName: "recoverStreak",
      args: [],
      value: STREAK_RECOVERY_FEE,
    });
  }, [writeContract]);

  // =========================================================================
  // Refetch helper
  // =========================================================================

  const refetchAll = useCallback(() => {
    batchedReads.refetch();
  }, [batchedReads]);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // Read data
    positions,
    totalClaimable,
    userStats,
    badges,
    lifetimeSaved,
    positionCount,

    // Per-position claimable (synchronous default; see usePositionClaimable)
    getClaimable,

    // Write actions
    depositFixedDaily,
    depositPercentage,
    topUpFixedDaily,
    topUpPercentage,
    claim,
    claimAll,
    emergencyWithdraw,
    checkIn,
    recoverStreak,

    // Status
    isLoading: batchedReads.isLoading,
    isPending,
    isConfirming,
    isConfirmed,
    txHash,
    writeError,

    // Refetch
    refetchAll,
  };
}

// ---------------------------------------------------------------------------
// Standalone hook: per-position claimable (for components that need it)
// ---------------------------------------------------------------------------

export function usePositionClaimable(positionId: number) {
  const { address, isConnected } = useAccount();

  const result = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: "getClaimable",
    args: [address as `0x${string}`, BigInt(positionId)],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: POLL_INTERVAL,
    },
  });

  return {
    claimable: result.data ? toBigInt(result.data) : 0n,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}
