// ============================================================================
// GamifiedSavings Contract - ABI, Types, Constants & Helpers
// Contract: 0xf2066620D9A0EfB1f5504222E9d569eBB83adcf0
// Chain: Arc Testnet (5042002)
// ============================================================================

export const GAMIFIED_SAVINGS_ADDRESS = "0xf2066620D9A0EfB1f5504222E9d569eBB83adcf0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UnlockFrequency = 0 | 1 | 2 | 3;

export const FREQUENCY_LABELS: Record<UnlockFrequency, string> = {
  0: "Daily",
  1: "Weekly",
  2: "Monthly",
  3: "Yearly",
};

export const FREQUENCY_SECONDS: Record<UnlockFrequency, number> = {
  0: 86400,
  1: 604800,
  2: 2592000,
  3: 31536000,
};

export interface Position {
  totalDeposited: bigint;
  claimed: bigint;
  startTime: bigint;
  durationDays: number;
  dailyAmount: bigint;
  percentBps: number;
  mode: number; // 0 = FixedDaily, 1 = Percentage
  active: boolean;
  frequency: number;
}

export interface UserStats {
  totalXP: bigint;
  streak: bigint;
  multiplier: bigint;
  lastCheckIn: bigint;
  usedEmergency: boolean;
}

export interface BadgeInfo {
  hasTier1: boolean;
  hasTier2: boolean;
  hasTier3: boolean;
  tier1TokenId: bigint;
  tier2TokenId: bigint;
  tier3TokenId: bigint;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EMERGENCY_FEE_BPS = 200;
export const STREAK_RECOVERY_FEE = BigInt("10000000000000000"); // 0.01 ether (18 decimals)
export const MIN_LOCKED_FOR_XP = BigInt("1000000000000000000"); // 1 ether
export const MIN_LOCKED_MULT = BigInt("10000000000000000000"); // 10 ether

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a raw 18-decimal bigint to a human-readable "X.XXXX" string.
 */
export const formatUSDCValue = (raw: bigint): string => {
  const num = Number(raw) / 1e18;
  return num.toFixed(4);
};

// ---------------------------------------------------------------------------
// ABI
// ---------------------------------------------------------------------------

export const GAMIFIED_SAVINGS_ABI = [
  // ==========================================================================
  // Write Functions
  // ==========================================================================
  {
    "type": "function",
    "name": "depositFixedDaily",
    "inputs": [
      { "name": "amountPerPeriod", "type": "uint128" },
      { "name": "frequency", "type": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "depositPercentage",
    "inputs": [
      { "name": "percentBps", "type": "uint16" },
      { "name": "durationPeriods", "type": "uint32" },
      { "name": "frequency", "type": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "topUpFixedDaily",
    "inputs": [
      { "name": "positionId", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "topUpPercentage",
    "inputs": [
      { "name": "positionId", "type": "uint256" },
      { "name": "recalculate", "type": "bool" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "claim",
    "inputs": [
      { "name": "positionId", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimAll",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "emergencyWithdraw",
    "inputs": [
      { "name": "positionId", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkIn",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recoverStreak",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },

  // ==========================================================================
  // View Functions
  // ==========================================================================
  {
    "type": "function",
    "name": "getUserPositions",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          { "name": "totalDeposited", "type": "uint128" },
          { "name": "claimed", "type": "uint128" },
          { "name": "startTime", "type": "uint64" },
          { "name": "durationDays", "type": "uint32" },
          { "name": "dailyAmount", "type": "uint128" },
          { "name": "percentBps", "type": "uint16" },
          { "name": "mode", "type": "uint8" },
          { "name": "active", "type": "bool" },
          { "name": "frequency", "type": "uint8" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getClaimable",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "positionId", "type": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalClaimable",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalLocked",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserStats",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "totalXP", "type": "uint256" },
      { "name": "streak", "type": "uint256" },
      { "name": "multiplier", "type": "uint256" },
      { "name": "lastCheckIn", "type": "uint256" },
      { "name": "usedEmergency", "type": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBadges",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "hasTier1", "type": "bool" },
      { "name": "hasTier2", "type": "bool" },
      { "name": "hasTier3", "type": "bool" },
      { "name": "tier1TokenId", "type": "uint256" },
      { "name": "tier2TokenId", "type": "uint256" },
      { "name": "tier3TokenId", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLifetimeSaved",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPositionCount",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [
      { "name": "tokenId", "type": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "string" }
    ],
    "stateMutability": "view"
  },

  // ==========================================================================
  // Events
  // ==========================================================================
  {
    "type": "event",
    "name": "Deposit",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "positionId", "type": "uint256", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "mode", "type": "uint8", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "TopUp",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "positionId", "type": "uint256", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "recalculate", "type": "bool", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Claim",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "positionId", "type": "uint256", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "EmergencyWithdraw",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "positionId", "type": "uint256", "indexed": true },
      { "name": "amountAfterFee", "type": "uint256", "indexed": false },
      { "name": "fee", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "CheckIn",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "xpEarned", "type": "uint256", "indexed": false },
      { "name": "newStreak", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "BadgeMinted",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "tokenId", "type": "uint256", "indexed": true },
      { "name": "tier", "type": "uint8", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "StreakRecovered",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "feePaid", "type": "uint256", "indexed": false }
    ]
  },

  // ==========================================================================
  // Custom Errors
  // ==========================================================================
  { "type": "error", "name": "AlreadyCheckedInToday", "inputs": [] },
  { "type": "error", "name": "InsufficientLockedForXP", "inputs": [] },
  { "type": "error", "name": "NoActivePositions", "inputs": [] },
  { "type": "error", "name": "PositionNotActive", "inputs": [] },
  { "type": "error", "name": "NothingToClaim", "inputs": [] },
  { "type": "error", "name": "ZeroAmount", "inputs": [] },
  { "type": "error", "name": "StreakNotRecoverable", "inputs": [] },
  { "type": "error", "name": "IncorrectRecoveryFee", "inputs": [] }
] as const;
