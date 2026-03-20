export const TOKEN_STREAM_ADDRESS = "0xd54B92983698Dbc3193a1E1D18DA68d5E6AD66a4";
export const USDC_ADDRESS = "0x0000000000000000000000000000000000000000";
export const USDC_DECIMALS = 18;
export const USDC_SYMBOL = "USDC";
export const USDC_LOGO = "/usdc-logo.png";

export const TOKEN_STREAM_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createStream",
    "inputs": [
      { "name": "beneficiary", "type": "address" },
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "duration", "type": "uint256" },
      { "name": "interval", "type": "uint256" }
    ],
    "outputs": [{ "name": "streamId", "type": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "createMultiStream",
    "inputs": [
      { "name": "beneficiaries", "type": "address[]" },
      { "name": "token", "type": "address" },
      { "name": "totalAmount", "type": "uint256" },
      { "name": "duration", "type": "uint256" },
      { "name": "interval", "type": "uint256" },
      { "name": "percentages", "type": "uint256[]" }
    ],
    "outputs": [{ "name": "streamIds", "type": "uint256[]" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "claim",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelStream",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "pauseStream",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "resumeStream",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "addToken",
    "inputs": [{ "name": "token", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeToken",
    "inputs": [{ "name": "token", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getStream",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "components": [
        { "name": "creator", "type": "address" },
        { "name": "totalAmount", "type": "uint96" },
        { "name": "beneficiary", "type": "address" },
        { "name": "claimed", "type": "uint96" },
        { "name": "token", "type": "address" },
        { "name": "startTime", "type": "uint32" },
        { "name": "duration", "type": "uint32" },
        { "name": "interval", "type": "uint32" },
        { "name": "status", "type": "uint8" },
        { "name": "pausedAt", "type": "uint128" },
        { "name": "accPausedDuration", "type": "uint128" },
        { "name": "streamId", "type": "uint256" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getClaimable",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStreamed",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRemaining",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProgress",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTimeRemaining",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStreamEndTime",
    "inputs": [{ "name": "streamId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorStreams",
    "inputs": [
      { "name": "creator", "type": "address" },
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [
      { "name": "page", "type": "uint256[]" },
      { "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorStreamCount",
    "inputs": [{ "name": "creator", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorStatusBreakdown",
    "inputs": [{ "name": "creator", "type": "address" }],
    "outputs": [
      { "name": "active", "type": "uint256" },
      { "name": "paused", "type": "uint256" },
      { "name": "completed", "type": "uint256" },
      { "name": "cancelled", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorStreamsByToken",
    "inputs": [
      { "name": "creator", "type": "address" },
      { "name": "token", "type": "address" },
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [
      { "name": "page", "type": "uint256[]" },
      { "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorStreamsByStatus",
    "inputs": [
      { "name": "creator", "type": "address" },
      { "name": "status", "type": "uint8" },
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [
      { "name": "page", "type": "uint256[]" },
      { "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorVolumeByToken",
    "inputs": [
      { "name": "creator", "type": "address" },
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "totalDeposited", "type": "uint256" },
      { "name": "netStreamed", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCreatorSummary",
    "inputs": [{ "name": "creator", "type": "address" }],
    "outputs": [
      { "name": "totalCreated", "type": "uint256" },
      { "name": "active", "type": "uint256" },
      { "name": "paused", "type": "uint256" },
      { "name": "completed", "type": "uint256" },
      { "name": "cancelled", "type": "uint256" },
      { "name": "oldestStreamId", "type": "uint256" },
      { "name": "newestStreamId", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserStreams",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [
      { "name": "page", "type": "uint256[]" },
      { "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserTotalClaimable",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "total", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBeneficiaryTokenBreakdown",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "claimed", "type": "uint256" },
      { "name": "pendingNow", "type": "uint256" },
      { "name": "stillLocked", "type": "uint256" },
      { "name": "totalExpected", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getExpiringStreams",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "withinSeconds", "type": "uint256" },
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [
      { "name": "page", "type": "uint256[]" },
      { "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBeneficiarySummary",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [
      { "name": "totalStreams", "type": "uint256" },
      { "name": "activeStreams", "type": "uint256" },
      { "name": "completedStreams", "type": "uint256" },
      { "name": "totalClaimableNow", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProtocolSummary",
    "inputs": [],
    "outputs": [
      { "name": "totalStreams", "type": "uint256" },
      { "name": "active", "type": "uint256" },
      { "name": "paused", "type": "uint256" },
      { "name": "completed", "type": "uint256" },
      { "name": "cancelled", "type": "uint256" },
      { "name": "uniqueCreators", "type": "uint256" },
      { "name": "uniqueBeneficiaries", "type": "uint256" },
      { "name": "tokensWhitelisted", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTokenStats",
    "inputs": [{ "name": "token", "type": "address" }],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "components": [
        { "name": "totalDeposited", "type": "uint256" },
        { "name": "totalClaimed", "type": "uint256" },
        { "name": "currentlyLocked", "type": "uint256" },
        { "name": "activeStreamCount", "type": "uint256" },
        { "name": "allTimeStreamCount", "type": "uint256" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDailyCreations",
    "inputs": [{ "name": "dayTimestamp", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getWeeklyCreations",
    "inputs": [{ "name": "weekTimestamp", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStreamsCreatedInRange",
    "inputs": [
      { "name": "from", "type": "uint256" },
      { "name": "to", "type": "uint256" }
    ],
    "outputs": [{ "name": "count", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "creatorTotalStreams",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "creatorActiveStreams",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "beneficiaryTotalClaimed",
    "inputs": [
      { "name": "", "type": "address" },
      { "name": "", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalStreamsAllTime",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "activeStreamCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "uniqueCreatorCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "uniqueBeneficiaryCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "StreamCreated",
    "inputs": [
      { "name": "streamId", "type": "uint256", "indexed": true },
      { "name": "creator", "type": "address", "indexed": true },
      { "name": "beneficiary", "type": "address", "indexed": true },
      { "name": "token", "type": "address", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "duration", "type": "uint256", "indexed": false },
      { "name": "interval", "type": "uint256", "indexed": false },
      { "name": "startTime", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Claimed",
    "inputs": [
      { "name": "streamId", "type": "uint256", "indexed": true },
      { "name": "beneficiary", "type": "address", "indexed": true },
      { "name": "token", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "totalClaimedSoFar", "type": "uint256", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "StreamCancelled",
    "inputs": [
      { "name": "streamId", "type": "uint256", "indexed": true },
      { "name": "creator", "type": "address", "indexed": true },
      { "name": "token", "type": "address", "indexed": false },
      { "name": "returnedToCreator", "type": "uint256", "indexed": false },
      { "name": "sentToBeneficiary", "type": "uint256", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "StreamPaused",
    "inputs": [
      { "name": "streamId", "type": "uint256", "indexed": true },
      { "name": "creator", "type": "address", "indexed": true },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "StreamResumed",
    "inputs": [
      { "name": "streamId", "type": "uint256", "indexed": true },
      { "name": "creator", "type": "address", "indexed": true },
      { "name": "resumedAt", "type": "uint256", "indexed": false },
      { "name": "totalPausedSeconds", "type": "uint256", "indexed": false }
    ]
  }
];

export const STATUS = {
  0: "Active",
  1: "Paused",
  2: "Completed",
  3: "Cancelled",
} as const;

export type StreamStatus = keyof typeof STATUS;

export const STATUS_COLORS: Record<number, string> = {
  0: "bg-green-600",
  1: "bg-yellow-600",
  2: "bg-gray-600",
  3: "bg-red-600",
};

export const STATUS_TEXT_COLORS: Record<number, string> = {
  0: "text-green-500",
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-red-500",
};

export function isStreamFinished(status: number, timeRemaining?: bigint): boolean {
  if (status === 2 || status === 3) return true;
  if (timeRemaining !== undefined && timeRemaining === 0n) return true;
  return false;
}

export interface Stream {
  creator: string;
  totalAmount: bigint;
  beneficiary: string;
  claimed: bigint;
  token: string;
  startTime: bigint;
  duration: bigint;
  interval: bigint;
  status: number;
  pausedAt: bigint;
  accPausedDuration: bigint;
  streamId: bigint;
}

export interface ProtocolSummary {
  totalStreams: bigint;
  active: bigint;
  paused: bigint;
  completed: bigint;
  cancelled: bigint;
  uniqueCreators: bigint;
  uniqueBeneficiaries: bigint;
  tokensWhitelisted: bigint;
}

export interface TokenStats {
  totalDeposited: bigint;
  totalClaimed: bigint;
  currentlyLocked: bigint;
  activeStreamCount: bigint;
  allTimeStreamCount: bigint;
}

export interface CreatorSummary {
  totalCreated: bigint;
  active: bigint;
  paused: bigint;
  completed: bigint;
  cancelled: bigint;
  oldestStreamId: bigint;
  newestStreamId: bigint;
}

export interface BeneficiarySummary {
  totalStreams: bigint;
  activeStreams: bigint;
  completedStreams: bigint;
  totalClaimableNow: bigint;
}

export interface BeneficiaryTokenBreakdown {
  claimed: bigint;
  pendingNow: bigint;
  stillLocked: bigint;
  totalExpected: bigint;
}

export const formatUSDC = (raw: bigint | string | number): string => {
  const num = typeof raw === "string" ? BigInt(raw) : raw;
  return (Number(num) / 1e18).toFixed(6);
};

export const formatUSDCCompact = (raw: bigint | string | number): string => {
  const num = typeof raw === "string" ? BigInt(raw) : raw;
  const formatted = Number(num) / 1e18;
  if (formatted >= 1000000) {
    return (formatted / 1000000).toFixed(2) + "M";
  }
  if (formatted >= 1000) {
    return (formatted / 1000).toFixed(2) + "K";
  }
  return formatted.toFixed(2);
};

export const parseUSDC = (display: string | number): bigint => {
  return BigInt(Math.floor(Number(display) * 1e18));
};

export const toDurationSeconds = (value: number, unit: "seconds" | "minutes" | "hours" | "days"): number => {
  const multipliers = { seconds: 1, minutes: 60, hours: 3600, days: 86400 };
  return Math.floor(value * multipliers[unit]);
};

export const formatTime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
};

export const formatDate = (timestamp: bigint | number): string => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const truncateAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const getExplorerUrl = (txHash: string): string => {
  return `https://testnet.arcscan.io/tx/${txHash}`;
};

export const getStreamUrl = (streamId: string | number): string => {
  return `/app/stream/${streamId}`;
};

export const INTERVAL_OPTIONS = [
  { label: "Every Second", value: 1 },
  { label: "Every Minute", value: 60 },
  { label: "Every Hour", value: 3600 },
  { label: "Every Day", value: 86400 },
];

export const getIntervalLabel = (interval: bigint | number): string => {
  const val = typeof interval === "bigint" ? Number(interval) : interval;
  if (val === 1) return "Every Second";
  if (val === 60) return "Every Minute";
  if (val === 3600) return "Every Hour";
  if (val === 86400) return "Every Day";
  return `Every ${val}s`;
};

export const getPerUnlockAmount = (totalAmount: bigint, duration: bigint, interval: bigint): bigint => {
  if (duration === 0n || interval === 0n) return 0n;
  const totalIntervals = duration / interval;
  if (totalIntervals === 0n) return 0n;
  return totalAmount / totalIntervals;
};

export const getNextUnlockIn = (startTime: bigint, interval: bigint): number => {
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - Number(startTime);
  const intervalNum = Number(interval);
  if (intervalNum === 0) return 0;
  const timeIntoInterval = elapsed % intervalNum;
  return intervalNum - timeIntoInterval;
};

export const getIntervalsCompleted = (startTime: bigint, interval: bigint): bigint => {
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - Number(startTime);
  const intervalNum = Number(interval);
  if (intervalNum === 0) return 0n;
  return BigInt(Math.floor(elapsed / intervalNum));
};

export const getTotalIntervals = (duration: bigint, interval: bigint): bigint => {
  if (interval === 0n) return 0n;
  return duration / interval;
};
