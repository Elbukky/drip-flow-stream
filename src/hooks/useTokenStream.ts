import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawStream = streamResult.data as any;
  const stream: Stream | undefined = rawStream ? {
    creator: rawStream.creator,
    totalAmount: BigInt(rawStream.totalAmount),
    beneficiary: rawStream.beneficiary,
    claimed: BigInt(rawStream.claimed),
    token: rawStream.token,
    startTime: BigInt(rawStream.startTime),
    duration: BigInt(rawStream.duration),
    status: Number(rawStream.status),
    pausedAt: BigInt(rawStream.pausedAt),
    accPausedDuration: BigInt(rawStream.accPausedDuration),
    streamId: BigInt(rawStream.streamId),
  } : undefined;

  return {
    stream,
    claimable: claimableResult.data as bigint | undefined,
    streamed: streamedResult.data as bigint | undefined,
    remaining: remainingResult.data as bigint | undefined,
    progress: progressResult.data as bigint | undefined,
    timeRemaining: timeRemainingResult.data as bigint | undefined,
    endTime: endTimeResult.data as bigint | undefined,
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

  return {
    data: result.data as unknown as { totalStreams: bigint; active: bigint; paused: bigint; completed: bigint; cancelled: bigint; uniqueCreators: bigint; uniqueBeneficiaries: bigint; tokensWhitelisted: bigint } | undefined,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = result.data as any;
  return {
    data: rawData ? {
      totalDeposited: BigInt(rawData.totalDeposited),
      totalClaimed: BigInt(rawData.totalClaimed),
      currentlyLocked: BigInt(rawData.currentlyLocked),
      activeStreamCount: BigInt(rawData.activeStreamCount),
      allTimeStreamCount: BigInt(rawData.allTimeStreamCount),
    } : undefined,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useCreatorSummary(creator: `0x${string}` | undefined) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: "getCreatorSummary",
    args: [creator as `0x${string}`],
    query: { enabled: !!creator },
  });

  return {
    data: result.data as unknown as [bigint, bigint, bigint, bigint, bigint, bigint, bigint] | undefined,
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

  return {
    data: result.data as unknown as [bigint, bigint, bigint, bigint] | undefined,
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

  return {
    data: result.data as unknown as [bigint, bigint] | undefined,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

export function useCreatorStreams(creator: `0x${string}` | undefined, offset: number, limit: number, statusFilter?: number) {
  const result = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: TOKEN_STREAM_ABI,
    functionName: statusFilter !== undefined ? "getCreatorStreamsByStatus" : "getCreatorStreams",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: statusFilter !== undefined 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? [creator as `0x${string}`, BigInt(statusFilter), BigInt(offset), BigInt(limit)] as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : [creator as `0x${string}`, BigInt(offset), BigInt(limit)] as any,
    query: { enabled: !!creator },
  });

  return {
    data: result.data as unknown as [bigint[], bigint] | undefined,
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

  return {
    data: result.data as unknown as [bigint, bigint, bigint, bigint] | undefined,
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

  return {
    data: result.data as unknown as [bigint, bigint, bigint, bigint] | undefined,
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

  return {
    data: result.data as unknown as [bigint[], bigint] | undefined,
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

  return {
    data: result.data as unknown as [bigint[], bigint] | undefined,
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
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const cancelStream = (streamId: bigint) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (writeContract as any)({
      address: CONTRACT_CONFIG.address,
      abi: TOKEN_STREAM_ABI,
      functionName: "cancelStream",
      args: [streamId],
    });
  };

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
    data: result.data as bigint | undefined,
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
    data: result.data as bigint | undefined,
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
    data: result.data as bigint | undefined,
    isLoading: result.isLoading,
  };
}
