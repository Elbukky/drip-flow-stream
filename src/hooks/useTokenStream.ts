import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  TOKEN_STREAM_ADDRESS,
  USDC_ADDRESS,
  parseUSDC,
  type Stream,
} from "@/lib/contracts";

const CONTRACT_CONFIG = {
  address: TOKEN_STREAM_ADDRESS as `0x${string}`,
};

const TOKEN_STREAM_ABI = [
  {
    type: "function" as const,
    name: "createStream",
    inputs: [
      { name: "beneficiary", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "duration", type: "uint256" }
    ],
    outputs: [{ name: "streamId", type: "uint256" }],
    stateMutability: "payable" as const,
  },
  {
    type: "function" as const,
    name: "createMultiStream",
    inputs: [
      { name: "beneficiaries", type: "address[]" },
      { name: "token", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "percentages", type: "uint256[]" }
    ],
    outputs: [{ name: "streamIds", type: "uint256[]" }],
    stateMutability: "payable" as const,
  },
  {
    type: "function" as const,
    name: "claim",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
  {
    type: "function" as const,
    name: "cancelStream",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
  {
    type: "function" as const,
    name: "pauseStream",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
  {
    type: "function" as const,
    name: "resumeStream",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable" as const,
  },
  {
    type: "function" as const,
    name: "getStream",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{
      name: "",
      type: "tuple" as const,
      components: [
        { name: "creator", type: "address" },
        { name: "totalAmount", type: "uint96" },
        { name: "beneficiary", type: "address" },
        { name: "claimed", type: "uint96" },
        { name: "token", type: "address" },
        { name: "startTime", type: "uint32" },
        { name: "duration", type: "uint32" },
        { name: "status", type: "uint8" },
        { name: "pausedAt", type: "uint128" },
        { name: "accPausedDuration", type: "uint128" },
        { name: "streamId", type: "uint256" }
      ]
    }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getClaimable",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getStreamed",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getRemaining",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getProgress",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getTimeRemaining",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getStreamEndTime",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getCreatorStreams",
    inputs: [
      { name: "creator", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" }
    ],
    outputs: [
      { name: "page", type: "uint256[]" },
      { name: "total", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getCreatorStreamsByStatus",
    inputs: [
      { name: "creator", type: "address" },
      { name: "status", type: "uint8" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" }
    ],
    outputs: [
      { name: "page", type: "uint256[]" },
      { name: "total", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getCreatorSummary",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      { name: "totalCreated", type: "uint256" },
      { name: "active", type: "uint256" },
      { name: "paused", type: "uint256" },
      { name: "completed", type: "uint256" },
      { name: "cancelled", type: "uint256" },
      { name: "oldestStreamId", type: "uint256" },
      { name: "newestStreamId", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getCreatorStatusBreakdown",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      { name: "active", type: "uint256" },
      { name: "paused", type: "uint256" },
      { name: "completed", type: "uint256" },
      { name: "cancelled", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getCreatorVolumeByToken",
    inputs: [
      { name: "creator", type: "address" },
      { name: "token", type: "address" }
    ],
    outputs: [
      { name: "totalDeposited", type: "uint256" },
      { name: "netStreamed", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getUserStreams",
    inputs: [
      { name: "user", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" }
    ],
    outputs: [
      { name: "page", type: "uint256[]" },
      { name: "total", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getBeneficiarySummary",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "totalStreams", type: "uint256" },
      { name: "activeStreams", type: "uint256" },
      { name: "completedStreams", type: "uint256" },
      { name: "totalClaimableNow", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getBeneficiaryTokenBreakdown",
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" }
    ],
    outputs: [
      { name: "claimed", type: "uint256" },
      { name: "pendingNow", type: "uint256" },
      { name: "stillLocked", type: "uint256" },
      { name: "totalExpected", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getExpiringStreams",
    inputs: [
      { name: "user", type: "address" },
      { name: "withinSeconds", type: "uint256" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" }
    ],
    outputs: [
      { name: "page", type: "uint256[]" },
      { name: "total", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getProtocolSummary",
    inputs: [],
    outputs: [
      { name: "totalStreams", type: "uint256" },
      { name: "active", type: "uint256" },
      { name: "paused", type: "uint256" },
      { name: "completed", type: "uint256" },
      { name: "cancelled", type: "uint256" },
      { name: "uniqueCreators", type: "uint256" },
      { name: "uniqueBeneficiaries", type: "uint256" },
      { name: "tokensWhitelisted", type: "uint256" }
    ],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getTokenStats",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{
      name: "",
      type: "tuple" as const,
      components: [
        { name: "totalDeposited", type: "uint256" },
        { name: "totalClaimed", type: "uint256" },
        { name: "currentlyLocked", type: "uint256" },
        { name: "activeStreamCount", type: "uint256" },
        { name: "allTimeStreamCount", type: "uint256" }
      ]
    }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getDailyCreations",
    inputs: [{ name: "dayTimestamp", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getWeeklyCreations",
    inputs: [{ name: "weekTimestamp", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getStreamsCreatedInRange",
    inputs: [
      { name: "from", type: "uint256" },
      { name: "to", type: "uint256" }
    ],
    outputs: [{ name: "count", type: "uint256" }],
    stateMutability: "view" as const,
  },
] as const;

export function useStream(streamId: bigint | number) {
  const streamIdBigInt = BigInt(streamId);
  
  const streamResult = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getStream",
    args: [streamIdBigInt],
  });

  const claimableResult = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getClaimable",
    args: [streamIdBigInt],
  });

  const streamedResult = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getStreamed",
    args: [streamIdBigInt],
  });

  const remainingResult = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getRemaining",
    args: [streamIdBigInt],
  });

  const progressResult = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getProgress",
    args: [streamIdBigInt],
  });

  const timeRemainingResult = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getTimeRemaining",
    args: [streamIdBigInt],
  });

  const endTimeResult = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getStreamEndTime",
    args: [streamIdBigInt],
  });

  const rawStream = streamResult.data;
  
  let stream: Stream | undefined;
  if (rawStream && typeof rawStream === 'object') {
    const r = rawStream as any;
    stream = {
      creator: r.creator,
      totalAmount: BigInt(r.totalAmount.toString()),
      beneficiary: r.beneficiary,
      claimed: BigInt(r.claimed.toString()),
      token: r.token,
      startTime: BigInt(r.startTime.toString()),
      duration: BigInt(r.duration.toString()),
      status: Number(r.status),
      pausedAt: BigInt(r.pausedAt.toString()),
      accPausedDuration: BigInt(r.accPausedDuration.toString()),
      streamId: BigInt(r.streamId.toString()),
    };
  }

  const toBigInt = (val: unknown): bigint => {
    if (typeof val === 'bigint') return val;
    if (typeof val === 'number') return BigInt(Math.floor(val));
    if (typeof val === 'string') return BigInt(val);
    return 0n;
  };

  return {
    stream,
    claimable: claimableResult.data ? toBigInt(claimableResult.data) : undefined,
    streamed: streamedResult.data ? toBigInt(streamedResult.data) : undefined,
    remaining: remainingResult.data ? toBigInt(remainingResult.data) : undefined,
    progress: progressResult.data ? toBigInt(progressResult.data) : undefined,
    timeRemaining: timeRemainingResult.data ? toBigInt(timeRemainingResult.data) : undefined,
    endTime: endTimeResult.data ? toBigInt(endTimeResult.data) : undefined,
    isLoading: streamResult.isLoading || claimableResult.isLoading,
    refetch: () => {
      streamResult.refetch();
      claimableResult.refetch();
      streamedResult.refetch();
      remainingResult.refetch();
      progressResult.refetch();
      timeRemainingResult.refetch();
      endTimeResult.refetch();
    },
  };
}

export function useProtocolSummary() {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getProtocolSummary",
    args: [],
  });

  const rawData = result.data;
  
  let data: {
    totalStreams: bigint;
    active: bigint;
    paused: bigint;
    completed: bigint;
    cancelled: bigint;
    uniqueCreators: bigint;
    uniqueBeneficiaries: bigint;
    tokensWhitelisted: bigint;
  } | undefined;

  if (rawData) {
    if (Array.isArray(rawData)) {
      data = {
        totalStreams: toBigInt(rawData[0]),
        active: toBigInt(rawData[1]),
        paused: toBigInt(rawData[2]),
        completed: toBigInt(rawData[3]),
        cancelled: toBigInt(rawData[4]),
        uniqueCreators: toBigInt(rawData[5]),
        uniqueBeneficiaries: toBigInt(rawData[6]),
        tokensWhitelisted: toBigInt(rawData[7]),
      };
    } else {
      const r = rawData as unknown as Record<string, unknown>;
      data = {
        totalStreams: toBigInt(r.totalStreams ?? r[0]),
        active: toBigInt(r.active ?? r[1]),
        paused: toBigInt(r.paused ?? r[2]),
        completed: toBigInt(r.completed ?? r[3]),
        cancelled: toBigInt(r.cancelled ?? r[4]),
        uniqueCreators: toBigInt(r.uniqueCreators ?? r[5]),
        uniqueBeneficiaries: toBigInt(r.uniqueBeneficiaries ?? r[6]),
        tokensWhitelisted: toBigInt(r.tokensWhitelisted ?? r[7]),
      };
    }
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useTokenStats(token?: string) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getTokenStats",
    args: [(token || USDC_ADDRESS) as `0x${string}`],
  });

  const rawData = result.data;
  
  let data: {
    totalDeposited: bigint;
    totalClaimed: bigint;
    currentlyLocked: bigint;
    activeStreamCount: bigint;
    allTimeStreamCount: bigint;
  } | undefined;

  if (rawData) {
    if (typeof rawData === 'object') {
      if (Array.isArray(rawData)) {
        data = {
          totalDeposited: toBigInt(rawData[0]),
          totalClaimed: toBigInt(rawData[1]),
          currentlyLocked: toBigInt(rawData[2]),
          activeStreamCount: toBigInt(rawData[3]),
          allTimeStreamCount: toBigInt(rawData[4]),
        };
      } else {
        const r = rawData as Record<string, unknown>;
        data = {
          totalDeposited: toBigInt(r.totalDeposited ?? r[0]),
          totalClaimed: toBigInt(r.totalClaimed ?? r[1]),
          currentlyLocked: toBigInt(r.currentlyLocked ?? r[2]),
          activeStreamCount: toBigInt(r.activeStreamCount ?? r[3]),
          allTimeStreamCount: toBigInt(r.allTimeStreamCount ?? r[4]),
        };
      }
    }
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

function toBigInt(val: unknown): bigint {
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number') return BigInt(Math.floor(val));
  if (typeof val === 'string') return BigInt(val);
  return 0n;
}

export function useCreatorSummary(creator: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getCreatorSummary",
    args: [creator as `0x${string}`],
    query: { enabled: !!creator },
  });

  const rawData = result.data;
  
  let data: [bigint, bigint, bigint, bigint, bigint, bigint, bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    data = [
      toBigInt(rawData[0]),
      toBigInt(rawData[1]),
      toBigInt(rawData[2]),
      toBigInt(rawData[3]),
      toBigInt(rawData[4]),
      toBigInt(rawData[5]),
      toBigInt(rawData[6]),
    ];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useCreatorStatusBreakdown(creator: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getCreatorStatusBreakdown",
    args: [creator as `0x${string}`],
    query: { enabled: !!creator },
  });

  const rawData = result.data;
  
  let data: [bigint, bigint, bigint, bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    data = [
      toBigInt(rawData[0]),
      toBigInt(rawData[1]),
      toBigInt(rawData[2]),
      toBigInt(rawData[3]),
    ];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useCreatorVolumeByToken(creator: `0x${string}` | undefined, token?: string) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getCreatorVolumeByToken",
    args: [creator as `0x${string}`, (token || USDC_ADDRESS) as `0x${string}`],
    query: { enabled: !!creator },
  });

  const rawData = result.data;
  
  let data: [bigint, bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    data = [toBigInt(rawData[0]), toBigInt(rawData[1])];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useCreatorStreams(creator: `0x${string}` | undefined, offset: number, limit: number, statusFilter?: number) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: statusFilter !== undefined ? "getCreatorStreamsByStatus" : "getCreatorStreams",
    args: statusFilter !== undefined 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? [creator as `0x${string}`, BigInt(statusFilter), BigInt(offset), BigInt(limit)] as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : [creator as `0x${string}`, BigInt(offset), BigInt(limit)] as any,
    query: { enabled: !!creator },
  });

  const rawData = result.data;
  
  let data: [bigint[], bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    const pageArray = rawData[0] as unknown[];
    const page = Array.isArray(pageArray) ? pageArray.map(toBigInt) : [];
    data = [page, toBigInt(rawData[1])];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useBeneficiarySummary(user: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getBeneficiarySummary",
    args: [user as `0x${string}`],
    query: { enabled: !!user },
  });

  const rawData = result.data;
  
  let data: [bigint, bigint, bigint, bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    data = [
      toBigInt(rawData[0]),
      toBigInt(rawData[1]),
      toBigInt(rawData[2]),
      toBigInt(rawData[3]),
    ];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useBeneficiaryTokenBreakdown(user: `0x${string}` | undefined, token?: string) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getBeneficiaryTokenBreakdown",
    args: [user as `0x${string}`, (token || USDC_ADDRESS) as `0x${string}`],
    query: { enabled: !!user },
  });

  const rawData = result.data;
  
  let data: [bigint, bigint, bigint, bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    data = [
      toBigInt(rawData[0]),
      toBigInt(rawData[1]),
      toBigInt(rawData[2]),
      toBigInt(rawData[3]),
    ];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useUserStreams(user: `0x${string}` | undefined, offset: number, limit: number) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getUserStreams",
    args: [user as `0x${string}`, BigInt(offset), BigInt(limit)],
    query: { enabled: !!user },
  });

  const rawData = result.data;
  
  let data: [bigint[], bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    const page = Array.isArray(rawData[0]) ? rawData[0].map(toBigInt) : [];
    data = [page, toBigInt(rawData[1])];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useExpiringStreams(user: `0x${string}` | undefined, withinSeconds: number, offset: number, limit: number) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getExpiringStreams",
    args: [user as `0x${string}`, BigInt(withinSeconds), BigInt(offset), BigInt(limit)],
    query: { enabled: !!user },
  });

  const rawData = result.data;
  
  let data: [bigint[], bigint] | undefined;
  if (rawData && Array.isArray(rawData)) {
    const page = Array.isArray(rawData[0]) ? rawData[0].map(toBigInt) : [];
    data = [page, toBigInt(rawData[1])];
  }

  return {
    data,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useCreateStream() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const createStream = (beneficiary: `0x${string}`, amount: string, duration: bigint) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      address: CONTRACT_CONFIG.address,
      abi: TOKEN_STREAM_ABI,
      functionName: "createStream",
      args: [beneficiary, USDC_ADDRESS, parseUSDC(amount), duration],
      value: parseUSDC(amount),
    });
  };

  return {
    createStream,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useCreateMultiStream() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const createMultiStream = (beneficiaries: `0x${string}`[], totalAmount: string, duration: bigint, percentages: bigint[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      address: CONTRACT_CONFIG.address,
      abi: TOKEN_STREAM_ABI,
      functionName: "createMultiStream",
      args: [beneficiaries, USDC_ADDRESS, parseUSDC(totalAmount), duration, percentages],
      value: parseUSDC(totalAmount),
    });
  };

  return {
    createMultiStream,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useClaim() {
  const queryClient = useQueryClient();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const claim = (streamId: bigint) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      address: CONTRACT_CONFIG.address,
      abi: TOKEN_STREAM_ABI,
      functionName: "claim",
      args: [streamId],
    });
  };

  if (isConfirmed && txHash) {
    queryClient.invalidateQueries();
  }

  return {
    claim,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function usePauseStream() {
  const queryClient = useQueryClient();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const pauseStream = (streamId: bigint) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      address: CONTRACT_CONFIG.address,
      abi: TOKEN_STREAM_ABI,
      functionName: "pauseStream",
      args: [streamId],
    });
  };

  if (isConfirmed && txHash) {
    queryClient.invalidateQueries();
  }

  return {
    pauseStream,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useResumeStream() {
  const queryClient = useQueryClient();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const resumeStream = (streamId: bigint) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      address: CONTRACT_CONFIG.address,
      abi: TOKEN_STREAM_ABI,
      functionName: "resumeStream",
      args: [streamId],
    });
  };

  if (isConfirmed && txHash) {
    queryClient.invalidateQueries();
  }

  return {
    resumeStream,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useCancelStream() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const cancelStream = (streamId: bigint) => {
    if (!address) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeContract({
      address: CONTRACT_CONFIG.address,
      abi: TOKEN_STREAM_ABI as any,
      functionName: "cancelStream",
      args: [streamId],
      account: address,
      chain: undefined,
    } as any);
  };

  if (isConfirmed && txHash) {
    queryClient.invalidateQueries();
  }

  return {
    cancelStream,
    txHash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useDailyCreations() {
  const now = Math.floor(Date.now() / 1000);
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getDailyCreations",
    args: [BigInt(now)],
  });

  return {
    data: result.data ? toBigInt(result.data) : undefined,
    isLoading: result.isLoading,
  };
}

export function useWeeklyCreations() {
  const now = Math.floor(Date.now() / 1000);
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getWeeklyCreations",
    args: [BigInt(now)],
  });

  return {
    data: result.data ? toBigInt(result.data) : undefined,
    isLoading: result.isLoading,
  };
}

export function useStreamsCreatedInRange(from: number, to: number) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getStreamsCreatedInRange",
    args: [BigInt(from), BigInt(to)],
  });

  return {
    data: result.data ? toBigInt(result.data) : undefined,
    isLoading: result.isLoading,
  };
}
