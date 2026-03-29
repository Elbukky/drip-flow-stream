import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader, AppFooter } from "@/components/AppLayout";
import { useGamifiedSavings } from "@/hooks/useGamifiedSavings";
import { formatUSDCValue, EMERGENCY_FEE_BPS } from "@/lib/gamified-savings";
import type { Position } from "@/lib/gamified-savings";
import { parseEther } from "viem";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lock,
  Unlock,
  AlertTriangle,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
  Shield,
  Zap,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTxActivity } from "@/hooks/useTxActivity";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Navigation tabs (shared across Streams / Allowance / Progress)
// ---------------------------------------------------------------------------

const NAV_TABS = [
  { label: "STREAMS", to: "/app/streams" },
  { label: "DRIP ALLOWANCE", to: "/app/allowance" },
  { label: "FLOW PROGRESS", to: "/app/progress" },
] as const;

function PageTabs() {
  const location = useLocation();
  return (
    <div className="flex items-center gap-6 border-b border-border mb-6">
      {NAV_TABS.map((tab) => {
        const isActive = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`pb-3 text-xs font-bold tracking-[0.15em] uppercase transition-colors ${
              isActive
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for the chart
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border p-3 rounded-sm text-xs">
      <p className="text-muted-foreground mb-1 font-mono-display">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="font-mono-display" style={{ color: entry.color }}>
          {entry.name}: ${entry.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function DripAllowancePage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 w-full">
          <PageTabs />
          <div className="panel flex items-center justify-center py-16">
            <p className="text-muted-foreground">Connect your wallet to view your drip allowance</p>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 w-full">
        <PageTabs />
        <DripAllowanceContent />
      </div>
      <AppFooter />
    </div>
  );
}

function DripAllowanceContent() {
  const savings = useGamifiedSavings();

  // Derived values
  const totalDeposited = useMemo(() => {
    return savings.positions.reduce((sum, p) => sum + p.totalDeposited, 0n);
  }, [savings.positions]);

  const totalClaimed = useMemo(() => {
    return savings.positions.reduce((sum, p) => sum + p.claimed, 0n);
  }, [savings.positions]);

  const locked = useMemo(() => {
    const val = totalDeposited - totalClaimed - savings.totalClaimable;
    return val > 0n ? val : 0n;
  }, [totalDeposited, totalClaimed, savings.totalClaimable]);

  const unlockPercent = useMemo(() => {
    if (totalDeposited === 0n) return 0;
    // unlocked = totalClaimed + totalClaimable
    const unlocked = totalClaimed + savings.totalClaimable;
    return Number((unlocked * 10000n) / totalDeposited) / 100;
  }, [totalDeposited, totalClaimed, savings.totalClaimable]);

  // Calculate daily unlock rate from active positions
  const dailyUnlockRate = useMemo(() => {
    return savings.positions
      .filter((p) => p.active)
      .reduce((sum, p) => {
        if (p.mode === 0) {
          // FixedDaily
          return sum + p.dailyAmount;
        } else {
          // Percentage: percentBps / 10000 * remaining balance per day
          const remaining = p.totalDeposited - p.claimed;
          return sum + (remaining * BigInt(p.percentBps)) / 10000n;
        }
      }, 0n);
  }, [savings.positions]);

  const yearlyRate = useMemo(() => {
    return dailyUnlockRate * 365n;
  }, [dailyUnlockRate]);

  const activePositions = useMemo(() => {
    return savings.positions
      .map((p, i) => ({ ...p, id: i }))
      .filter((p) => p.active);
  }, [savings.positions]);

  if (savings.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Balance Overview + Allowance Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BalanceOverviewCard
          totalDeposited={totalDeposited}
          available={savings.totalClaimable}
          locked={locked}
          unlockPercent={unlockPercent}
          yearlyRate={yearlyRate}
        />
        <AllowanceStreamCard
          positions={activePositions}
          savings={savings}
        />
      </div>

      {/* Row 2: Spending Power + TX Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingPowerCard
          totalClaimable={savings.totalClaimable}
          positions={activePositions}
          savings={savings}
        />
        <TxActivityCard />
      </div>

      {/* Row 3: Allowance Analytics (full width) */}
      <AllowanceAnalyticsCard positions={activePositions} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// BALANCE_OVERVIEW Card
// ---------------------------------------------------------------------------

function BalanceOverviewCard({
  totalDeposited,
  available,
  locked,
  unlockPercent,
  yearlyRate,
}: {
  totalDeposited: bigint;
  available: bigint;
  locked: bigint;
  unlockPercent: number;
  yearlyRate: bigint;
}) {
  return (
    <div className="panel group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-4">
      {/* Subtle gradient glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <span className="label-micro">BALANCE_OVERVIEW</span>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">TOTAL BALANCE</p>
        <motion.p
          className="stream-value text-foreground text-3xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          ${formatUSDCValue(totalDeposited)}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">AVAILABLE</p>
          <motion.p
            className="font-mono-display text-lg text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            ${formatUSDCValue(available)}
          </motion.p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">LOCKED</p>
          <motion.p
            className="font-mono-display text-lg text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            ${formatUSDCValue(locked)}
          </motion.p>
        </div>
      </div>

      {/* Glowing progress bar */}
      <div className="space-y-2">
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(unlockPercent, 100)}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">
            <Unlock className="w-3 h-3 inline mr-1" />
            UNLOCKED {unlockPercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Streaming +${formatUSDCValue(yearlyRate)}/year
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ALLOWANCE_STREAM Card
// ---------------------------------------------------------------------------

type AllowanceSubTab = "create" | "topup";
type DepositMode = "fixed" | "percentage";

function AllowanceStreamCard({
  positions,
  savings,
}: {
  positions: (Position & { id: number })[];
  savings: ReturnType<typeof useGamifiedSavings>;
}) {
  const [subTab, setSubTab] = useState<AllowanceSubTab>("create");

  return (
    <div className="panel group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-4">
      {/* Subtle gradient glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <span className="label-micro">ALLOWANCE_STREAM</span>
      </div>

      {/* Sub-tab toggle */}
      <div className="flex gap-0 border border-border">
        <button
          onClick={() => setSubTab("create")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
            subTab === "create"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          CREATE NEW
        </button>
        <button
          onClick={() => setSubTab("topup")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
            subTab === "topup"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          TOP UP
        </button>
      </div>

      {subTab === "create" ? (
        <CreateNewForm savings={savings} />
      ) : (
        <TopUpForm positions={positions} savings={savings} />
      )}
    </div>
  );
}

function CreateNewForm({
  savings,
}: {
  savings: ReturnType<typeof useGamifiedSavings>;
}) {
  const [mode, setMode] = useState<DepositMode>("fixed");
  const [dailyAmount, setDailyAmount] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // Calculated duration for fixed daily mode
  const calcDuration = useMemo(() => {
    if (mode !== "fixed" || !dailyAmount || !depositAmount) return null;
    const daily = parseFloat(dailyAmount);
    const deposit = parseFloat(depositAmount);
    if (daily <= 0 || deposit <= 0) return null;
    return Math.floor(deposit / daily);
  }, [mode, dailyAmount, depositAmount]);

  const handleLockFunds = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Enter a deposit amount");
      return;
    }

    try {
      const value = parseEther(depositAmount);

      if (mode === "fixed") {
        if (!dailyAmount || parseFloat(dailyAmount) <= 0) {
          toast.error("Enter a daily allowance amount");
          return;
        }
        const daily = parseEther(dailyAmount);
        savings.depositFixedDaily(daily, value);
        toast.info("Confirm the transaction in your wallet...");
      } else {
        if (!durationDays || parseInt(durationDays) <= 0) {
          toast.error("Enter duration in days");
          return;
        }
        const days = parseInt(durationDays);
        const calcBps = Math.min(10000, Math.max(1, Math.floor(10000 / days)));
        savings.depositPercentage(calcBps, days, value);
        toast.info("Confirm the transaction in your wallet...");
      }
    } catch {
      toast.error("Invalid amount");
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-0 border border-border">
        <button
          onClick={() => setMode("fixed")}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            mode === "fixed"
              ? "bg-muted text-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          FIXED DAILY
        </button>
        <button
          onClick={() => setMode("percentage")}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            mode === "percentage"
              ? "bg-muted text-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          PERCENTAGE
        </button>
      </div>

      {mode === "fixed" ? (
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Daily Allowance Amount (USDC)</label>
          <Input
            type="number"
            placeholder="5.00"
            value={dailyAmount}
            onChange={(e) => setDailyAmount(e.target.value)}
            className="bg-secondary border-border font-mono-display focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          {calcDuration !== null && (
            <p className="text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Duration: ~{calcDuration} days
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Duration (days)</label>
          <Input
            type="number"
            placeholder="30"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="bg-secondary border-border font-mono-display focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          {durationDays && parseInt(durationDays) > 0 && depositAmount && parseFloat(depositAmount) > 0 && (
            <p className="text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Daily unlock: ~${(parseFloat(depositAmount) / parseInt(durationDays)).toFixed(4)}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Deposit Amount (USDC)</label>
        <Input
          type="number"
          placeholder="100.00"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="bg-secondary border-border font-mono-display focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      <motion.button
        onClick={handleLockFunds}
        disabled={savings.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        <span className="relative flex items-center gap-2">
          {savings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          LOCK FUNDS
        </span>
      </motion.button>
    </div>
  );
}

function TopUpForm({
  positions,
  savings,
}: {
  positions: (Position & { id: number })[];
  savings: ReturnType<typeof useGamifiedSavings>;
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [recalculate, setRecalculate] = useState(false);

  const selectedPosition = useMemo(() => {
    if (!selectedId) return null;
    return positions.find((p) => p.id === parseInt(selectedId)) ?? null;
  }, [selectedId, positions]);

  const handleTopUp = () => {
    if (!selectedId) {
      toast.error("Select a position");
      return;
    }
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast.error("Enter a top-up amount");
      return;
    }

    try {
      const value = parseEther(topUpAmount);
      const posId = parseInt(selectedId);

      if (selectedPosition?.mode === 0) {
        savings.topUpFixedDaily(posId, value);
      } else {
        savings.topUpPercentage(posId, recalculate, value);
      }
      toast.info("Confirm the transaction in your wallet...");
    } catch {
      toast.error("Invalid amount");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Select Position</label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="bg-secondary border-border font-mono-display focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200">
            <SelectValue placeholder="Select position..." />
          </SelectTrigger>
          <SelectContent>
            {positions.length === 0 ? (
              <SelectItem value="-1" disabled>No active positions</SelectItem>
            ) : (
              positions.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  #{p.id} - {p.mode === 0 ? "Fixed Daily" : "Percentage"} - ${formatUSDCValue(p.totalDeposited - p.claimed)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedPosition && (
        <div className="bg-secondary p-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode</span>
            <span className="font-mono-display">{selectedPosition.mode === 0 ? "Fixed Daily" : "Percentage"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {selectedPosition.mode === 0 ? "Daily Amount" : "Daily Unlock"}
            </span>
            <span className="font-mono-display">
              {selectedPosition.mode === 0
                ? `$${formatUSDCValue(selectedPosition.dailyAmount)}`
                : `~$${formatUSDCValue(
                  (selectedPosition.totalDeposited - selectedPosition.claimed) * BigInt(selectedPosition.percentBps) / 10000n
                )}/day`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining</span>
            <span className="font-mono-display">
              ${formatUSDCValue(selectedPosition.totalDeposited - selectedPosition.claimed)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Top-Up Amount (USDC)</label>
        <Input
          type="number"
          placeholder="50.00"
          value={topUpAmount}
          onChange={(e) => setTopUpAmount(e.target.value)}
          className="bg-secondary border-border font-mono-display focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      {selectedPosition?.mode === 1 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={recalculate}
            onCheckedChange={(checked) => setRecalculate(checked === true)}
          />
          <label className="text-xs text-muted-foreground">Recalculate percentage?</label>
        </div>
      )}

      <motion.button
        onClick={handleTopUp}
        disabled={savings.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        <span className="relative flex items-center gap-2">
          {savings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          TOP UP FUNDS
        </span>
      </motion.button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SPENDING_POWER Card
// ---------------------------------------------------------------------------

function SpendingPowerCard({
  totalClaimable,
  positions,
  savings,
}: {
  totalClaimable: bigint;
  positions: (Position & { id: number })[];
  savings: ReturnType<typeof useGamifiedSavings>;
}) {
  const [claimPosId, setClaimPosId] = useState<string>("");
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyPosId, setEmergencyPosId] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClaim = () => {
    if (!claimPosId) {
      toast.error("Select a position to claim");
      return;
    }
    savings.claim(parseInt(claimPosId));
    toast.info("Confirm the claim transaction...");
  };

  const handleClaimAll = () => {
    savings.claimAll();
    toast.info("Confirm the claim-all transaction...");
  };

  const handleEmergencyClick = () => {
    if (!emergencyMode) {
      setEmergencyMode(true);
      return;
    }
    if (!emergencyPosId) {
      toast.error("Select a position for emergency withdrawal");
      return;
    }
    setShowConfirm(true);
  };

  const confirmEmergency = () => {
    savings.emergencyWithdraw(parseInt(emergencyPosId));
    toast.info("Confirm emergency withdrawal...");
    setShowConfirm(false);
    setEmergencyMode(false);
  };

  return (
    <div className="panel group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-4">
      {/* Subtle gradient glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <span className="label-micro">SPENDING_POWER</span>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Available to Spend</p>
        <motion.p
          className="stream-value text-foreground text-3xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          ${formatUSDCValue(totalClaimable)}
        </motion.p>
      </div>

      {/* Claim controls */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={claimPosId} onValueChange={setClaimPosId}>
            <SelectTrigger className="bg-secondary border-border font-mono-display flex-1 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200">
              <SelectValue placeholder="Position..." />
            </SelectTrigger>
            <SelectContent>
              {positions.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  #{p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <motion.button
            onClick={handleClaim}
            disabled={savings.isPending || !claimPosId}
            className="btn-secondary flex items-center gap-1 disabled:opacity-50 relative overflow-hidden"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="relative flex items-center gap-1">
              {savings.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3" />}
              CLAIM
            </span>
          </motion.button>
        </div>
        <motion.button
          onClick={handleClaimAll}
          disabled={savings.isPending || totalClaimable === 0n}
          className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />
          <span className="relative flex items-center gap-2">
            {savings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
            CLAIM ALL
          </span>
        </motion.button>
      </div>

      {/* Emergency controls */}
      {emergencyMode && (
        <div className="space-y-2">
          <Select value={emergencyPosId} onValueChange={setEmergencyPosId}>
            <SelectTrigger className="bg-secondary border-border font-mono-display focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200">
              <SelectValue placeholder="Select position..." />
            </SelectTrigger>
            <SelectContent>
              {positions.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  #{p.id} - ${formatUSDCValue(p.totalDeposited - p.claimed)} remaining
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-destructive">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Emergency fee: {EMERGENCY_FEE_BPS / 100}% of remaining balance
          </p>
        </div>
      )}

      <button
        onClick={handleEmergencyClick}
        disabled={savings.isPending}
        className="w-full py-3 px-6 font-bold uppercase text-xs tracking-widest transition-all duration-150 bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ boxShadow: "0 0 15px rgba(255, 51, 51, 0.3)" }}
      >
        <AlertTriangle className="w-4 h-4" />
        EMERGENCY UNLOCK
      </button>

      {emergencyMode && !showConfirm && (
        <button
          onClick={() => setEmergencyMode(false)}
          className="w-full text-[10px] text-muted-foreground hover:text-foreground text-center py-1"
        >
          Cancel
        </button>
      )}

      {/* Emergency confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
            <motion.div
              className="bg-card border border-destructive/30 p-6 max-w-sm w-full rounded-sm"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-mono-display text-lg text-destructive font-bold mb-3">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                EMERGENCY WITHDRAWAL
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will withdraw position #{emergencyPosId} with a <strong className="text-destructive">{EMERGENCY_FEE_BPS / 100}% fee</strong> on the remaining balance. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirm(false); setEmergencyMode(false); }}
                  className="btn-secondary flex-1"
                >
                  CANCEL
                </button>
                <button
                  onClick={confirmEmergency}
                  className="flex-1 py-3 px-6 font-bold uppercase text-xs tracking-widest bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  CONFIRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TX_ACTIVITY Card
// ---------------------------------------------------------------------------

function TxActivityCard() {
  const { events, isLoading } = useTxActivity();
  return (
    <div className="panel group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-4">
      {/* Subtle gradient glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <span className="label-micro">TX_ACTIVITY</span>
      </div>

      <div className="space-y-0 max-h-[280px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          events.map((tx, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground w-28">
                  {tx.type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {tx.time}
                </span>
              </div>
              <span
                className={`font-mono-display text-sm ${
                  tx.positive ? "text-primary" : "text-destructive"
                }`}
              >
                {tx.amount}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ALLOWANCE_ANALYTICS Card
// ---------------------------------------------------------------------------

function AllowanceAnalyticsCard({ positions }: { positions: (Position & { id: number })[] }) {
  const analyticsData = useMemo(() => {
    const data: { time: string; unlocked: number; spent: number; allowance: number }[] = [];
    if (positions.length === 0) return data;

    const nowSec = Math.floor(Date.now() / 1000);
    const points = 30;

    for (let i = points - 1; i >= 0; i--) {
      const t = new Date(Date.now() - i * 30 * 60 * 1000);
      const hours = t.getHours().toString().padStart(2, "0");
      const mins = t.getMinutes().toString().padStart(2, "0");
      const label = hours + ":" + mins;

      let totalUnlocked = 0;
      let totalDeposited = 0;

      for (const p of positions) {
        const startSec = Number(p.startTime);
        const elapsedDays = Math.max(0, (nowSec - startSec) / 86400);
        const deposited = Number(p.totalDeposited) / 1e18;
        const claimed = Number(p.claimed) / 1e18;
        totalDeposited += deposited;

        if (p.mode === 0) {
          const dailyAmt = Number(p.dailyAmount) / 1e18;
          const unlocked = Math.min(deposited, dailyAmt * elapsedDays);
          totalUnlocked += unlocked;
        } else {
          const r = p.percentBps / 10000;
          const remaining = deposited - claimed;
          const unlocked = deposited * (1 - Math.pow(1 - r, elapsedDays));
          totalUnlocked += Math.min(deposited, unlocked);
        }
      }

      const elapsedFraction = (points - i) / points;
      const unlocked = totalUnlocked * elapsedFraction;
      const spent = unlocked * 0.3;

      data.push({
        time: label,
        unlocked: +unlocked.toFixed(4),
        spent: +spent.toFixed(4),
        allowance: +totalDeposited.toFixed(4),
      });
    }
    return data;
  }, [positions]);
  return (
    <div className="panel group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-4">
      {/* Subtle gradient glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <span className="label-micro">ALLOWANCE_ANALYTICS</span>
      </div>

      <motion.div
        className="h-[250px] w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analyticsData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradUnlocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#666666" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#666666" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              interval={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              width={35}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="allowance"
              name="Allowance"
              stroke="#ffffff"
              strokeWidth={1.5}
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: "#ffffff", stroke: "#ffffff" }}
            />
            <Area
              type="monotone"
              dataKey="unlocked"
              name="Unlocked"
              stroke="hsl(24, 100%, 50%)"
              strokeWidth={2}
              fill="url(#gradUnlocked)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(24, 100%, 50%)", stroke: "hsl(24, 100%, 50%)" }}
            />
            <Area
              type="monotone"
              dataKey="spent"
              name="Spent"
              stroke="#666666"
              strokeWidth={1.5}
              fill="url(#gradSpent)"
              dot={false}
              activeDot={{ r: 4, fill: "#666666", stroke: "#666666" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-primary" />
          <span className="text-muted-foreground">UNLOCKED</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#666666]" />
          <span className="text-muted-foreground">SPENT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-white" />
          <span className="text-muted-foreground">ALLOWANCE</span>
        </div>
      </div>
    </div>
  );
}
