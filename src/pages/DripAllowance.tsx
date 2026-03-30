import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader, AppFooter } from "@/components/AppLayout";
import { useGamifiedSavings } from "@/hooks/useGamifiedSavings";
import { formatUSDCValue, EMERGENCY_FEE_BPS, FREQUENCY_LABELS, FREQUENCY_SECONDS } from "@/lib/gamified-savings";
import type { Position, UnlockFrequency } from "@/lib/gamified-savings";
import { parseEther } from "viem";
import { Input } from "@/components/ui/input";
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
  PiggyBank,
  Activity,
  BarChart3,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTxActivity } from "@/hooks/useTxActivity";
import type { TxEvent } from "@/hooks/useTxActivity";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Stagger animation variants
// ---------------------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

// ---------------------------------------------------------------------------
// CountUp animation component
// ---------------------------------------------------------------------------

function CountUpValue({ value, prefix = "$", className = "" }: { value: string; prefix?: string; className?: string }) {
  const [displayed, setDisplayed] = useState("0.00");
  const targetRef = useRef(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    targetRef.current = value;
    if (hasAnimated.current) {
      setDisplayed(value);
      return;
    }
    hasAnimated.current = true;
    const target = parseFloat(value.replace(/,/g, ""));
    if (isNaN(target) || target === 0) {
      setDisplayed(value);
      return;
    }
    const duration = 800;
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setDisplayed(current.toFixed(2));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayed(value);
      }
    }, stepTime);
    return () => clearInterval(interval);
  }, [value]);

  return <span className={className}>{prefix}{displayed}</span>;
}

// ---------------------------------------------------------------------------
// Compute per-position claimable client-side
// ---------------------------------------------------------------------------

function computePositionClaimable(p: Position): bigint {
  const now = Math.floor(Date.now() / 1000);
  const startSec = Number(p.startTime);
  const freqSecs = FREQUENCY_SECONDS[(p.frequency ?? 0) as UnlockFrequency] || 86400;
  const elapsed = now - startSec;
  if (elapsed <= 0) return 0n;
  const elapsedPeriods = Math.floor(elapsed / freqSecs);
  if (elapsedPeriods <= 0) return 0n;

  let totalReleased: bigint;
  if (p.mode === 0) {
    // Fixed mode: dailyAmount * periods, capped at totalDeposited
    totalReleased = p.dailyAmount * BigInt(elapsedPeriods);
    if (totalReleased > p.totalDeposited) totalReleased = p.totalDeposited;
  } else {
    // Percentage mode: totalDeposited * (1 - (1 - bps/10000)^periods)
    const r = p.percentBps / 10000;
    const remaining = Math.pow(1 - r, elapsedPeriods);
    const deposited = Number(p.totalDeposited);
    totalReleased = BigInt(Math.floor(deposited * (1 - remaining)));
    if (totalReleased > p.totalDeposited) totalReleased = p.totalDeposited;
  }
  const claimable = totalReleased - p.claimed;
  return claimable > 0n ? claimable : 0n;
}

// ---------------------------------------------------------------------------
// Navigation tabs
// ---------------------------------------------------------------------------

const NAV_TABS = [
  { label: "STREAMS", to: "/app/streams" },
  { label: "DRIP ALLOWANCE", to: "/app/allowance" },
  { label: "FLOW PROGRESS", to: "/app/progress" },
] as const;

function PageTabs() {
  const location = useLocation();
  return (
    <div className="flex items-center gap-4 sm:gap-6 border-b border-border mb-6 overflow-x-auto">
      {NAV_TABS.map((tab) => {
        const isActive = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`pb-3 text-xs font-bold tracking-[0.15em] uppercase transition-colors whitespace-nowrap ${
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
// Card header component for consistent styling
// ---------------------------------------------------------------------------

function CardHeader({ icon: Icon, title, subtitle, className = "" }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom chart tooltip
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border p-3 rounded-lg text-xs shadow-xl">
      <p className="text-muted-foreground mb-1.5 font-semibold">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.name} className="font-mono-display" style={{ color: entry.color }}>
          {entry.name}: ${Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NextUnlockTimer Component
// ---------------------------------------------------------------------------

function NextUnlockTimer({ position }: { position: Position }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = Math.floor(Date.now() / 1000);
      const start = Number(position.startTime);
      const freqSecs = FREQUENCY_SECONDS[(position.frequency ?? 0) as UnlockFrequency] || 86400;
      const elapsed = now - start;
      const elapsedPeriods = Math.floor(elapsed / freqSecs);
      const nextUnlock = start + (elapsedPeriods + 1) * freqSecs;
      const remaining = nextUnlock - now;

      if (remaining <= 0) {
        setTimeLeft("Now!");
      } else {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      }
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [position]);

  return <span className="font-mono-display text-primary">{timeLeft}</span>;
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
        <div className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col">
          <PageTabs />
          <motion.div
            className="panel flex flex-col items-center justify-center py-16 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Wallet className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Connect your wallet to view your drip allowance</p>
          </motion.div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 w-full flex flex-col flex-1">
        <PageTabs />
        <DripAllowanceContent />
      </div>
      <AppFooter />
    </div>
  );
}

function DripAllowanceContent() {
  const savings = useGamifiedSavings();

  const totalDeposited = useMemo(() => {
    return savings.positions.reduce((sum, p) => sum + p.totalDeposited, 0n);
  }, [savings.positions]);

  const totalClaimed = useMemo(() => {
    return savings.positions.reduce((sum, p) => sum + p.claimed, 0n);
  }, [savings.positions]);

  const unlockPercent = useMemo(() => {
    if (totalDeposited === 0n) return 0;
    const unlocked = totalClaimed + savings.totalClaimable;
    return Number((unlocked * 10000n) / totalDeposited) / 100;
  }, [totalDeposited, totalClaimed, savings.totalClaimable]);

  const dailyUnlockRate = useMemo(() => {
    return savings.positions
      .filter((p) => p.active)
      .reduce((sum, p) => {
        const freqSecs = FREQUENCY_SECONDS[(p.frequency ?? 0) as UnlockFrequency] || 86400;
        if (p.mode === 0) {
          return sum + (p.dailyAmount * 86400n) / BigInt(freqSecs);
        } else {
          const remaining = p.totalDeposited - p.claimed;
          const perPeriod = (remaining * BigInt(p.percentBps)) / 10000n;
          return sum + (perPeriod * 86400n) / BigInt(freqSecs);
        }
      }, 0n);
  }, [savings.positions]);

  const yearlyRate = useMemo(() => dailyUnlockRate * 365n, [dailyUnlockRate]);

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
    <div className="flex-1">
      <div className="masonry">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <BalanceOverviewCard
            totalDeposited={totalDeposited}
            available={savings.totalClaimable}
            locked={savings.totalLocked}
            unlockPercent={unlockPercent}
            yearlyRate={yearlyRate}
          />
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <AllowanceStreamCard positions={activePositions} savings={savings} />
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <SpendingPowerCard
            totalClaimable={savings.totalClaimable}
            positions={activePositions}
            savings={savings}
          />
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <TxActivityCard savings={savings} />
        </motion.div>
      </div>
      <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="mt-4">
        <SavingsProjectionCard positions={activePositions} />
      </motion.div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Balance Overview Card
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
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader icon={Shield} title="Balance Overview" subtitle="Your total savings at a glance" />

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Total Balance</p>
        <motion.p
          className="font-mono-display text-foreground text-3xl sm:text-4xl font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CountUpValue value={formatUSDCValue(totalDeposited)} />
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Available</p>
          <motion.p
            className="font-mono-display text-lg text-primary font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CountUpValue value={formatUSDCValue(available)} />
          </motion.p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Secured</p>
          <motion.p
            className="font-mono-display text-lg text-foreground font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CountUpValue value={formatUSDCValue(locked)} />
          </motion.p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(unlockPercent, 100)}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <Unlock className="w-3 h-3" />
            Released {unlockPercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +${formatUSDCValue(yearlyRate)}/year
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manage Allowance Card (Create / Top Up)
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
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader icon={Zap} title="Manage Allowance" subtitle="Create new savings or top up existing ones" />

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="flex gap-0 border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setSubTab("create")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            subTab === "create"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Create New
        </button>
        <button
          onClick={() => setSubTab("topup")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            subTab === "topup"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Top Up
        </button>
      </div>
      <AnimatePresence mode="wait">
        {subTab === "create" ? (
          <motion.div key="create" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
            <CreateNewForm savings={savings} />
          </motion.div>
        ) : (
          <motion.div key="topup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <TopUpForm positions={positions} savings={savings} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateNewForm({ savings }: { savings: ReturnType<typeof useGamifiedSavings> }) {
  const [mode, setMode] = useState<DepositMode>("fixed");
  const [frequency, setFrequency] = useState<number>(0);
  const [dailyAmount, setDailyAmount] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

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
          toast.error("Enter an allowance amount");
          return;
        }
        const daily = parseEther(dailyAmount);
        savings.depositFixedDaily(daily, frequency, value);
        toast.info("Confirm the transaction in your wallet...");
      } else {
        if (!durationDays || parseInt(durationDays) <= 0) {
          toast.error("Enter duration in periods");
          return;
        }
        const days = parseInt(durationDays);
        const calcBps = Math.min(10000, Math.max(1, Math.floor(10000 / days)));
        savings.depositPercentage(calcBps, days, frequency, value);
        toast.info("Confirm the transaction in your wallet...");
      }
    } catch {
      toast.error("Invalid amount");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Unlock Frequency</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([0, 1, 2, 3] as const).map((freq) => (
            <button
              key={freq}
              onClick={() => setFrequency(freq)}
              className={`p-3 rounded-lg border text-center transition-all duration-200 min-h-[44px] ${
                frequency === freq
                  ? "border-primary bg-primary/10 text-foreground shadow-[0_0_10px_rgba(255,107,0,0.15)]"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <p className="text-xs font-bold uppercase">{FREQUENCY_LABELS[freq as UnlockFrequency]}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {freq === 0 ? "Every day" : freq === 1 ? "Every 7 days" : freq === 2 ? "Every 30 days" : "Every 365 days"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-0 border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setMode("fixed")}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
            mode === "fixed" ? "bg-muted text-foreground" : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Fixed {FREQUENCY_LABELS[frequency as UnlockFrequency]}
        </button>
        <button
          onClick={() => setMode("percentage")}
          className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
            mode === "percentage" ? "bg-muted text-foreground" : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Percentage
        </button>
      </div>

      {mode === "fixed" ? (
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            {FREQUENCY_LABELS[frequency as UnlockFrequency]} Allowance (USDC)
          </label>
          <Input
            type="number"
            placeholder="5.00"
            value={dailyAmount}
            onChange={(e) => setDailyAmount(e.target.value)}
            className="bg-secondary border-border font-mono-display h-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          {calcDuration !== null && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Duration: ~{calcDuration} {FREQUENCY_LABELS[frequency as UnlockFrequency].toLowerCase()} periods
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Duration ({FREQUENCY_LABELS[frequency as UnlockFrequency].toLowerCase()} periods)
          </label>
          <Input
            type="number"
            placeholder="30"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="bg-secondary border-border font-mono-display h-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          {durationDays && parseInt(durationDays) > 0 && depositAmount && parseFloat(depositAmount) > 0 && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {FREQUENCY_LABELS[frequency as UnlockFrequency]} unlock: ~${(parseFloat(depositAmount) / parseInt(durationDays)).toFixed(4)}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Deposit Amount (USDC)</label>
        <Input
          type="number"
          placeholder="100.00"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="bg-secondary border-border font-mono-display h-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      <motion.button
        onClick={handleLockFunds}
        disabled={savings.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden min-h-[44px]"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        <span className="relative flex items-center gap-2">
          {savings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Lock Funds
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

  // ---------------------------------------------------------------------------
  // Compute preview values for the top-up impact summary
  // ---------------------------------------------------------------------------
  const topUpPreview = useMemo(() => {
    if (!selectedPosition || !topUpAmount || parseFloat(topUpAmount) <= 0) return null;

    const pos = selectedPosition;
    const freqSecs = FREQUENCY_SECONDS[(pos.frequency ?? 0) as UnlockFrequency] || 86400;
    const freqLabel = FREQUENCY_LABELS[(pos.frequency ?? 0) as UnlockFrequency].toLowerCase();
    const topUpVal = parseFloat(topUpAmount);
    const nowSec = Math.floor(Date.now() / 1000);
    const startSec = Number(pos.startTime);
    const elapsed = Math.max(0, nowSec - startSec);
    const elapsedPeriods = Math.floor(elapsed / freqSecs);
    const totalPeriods = pos.durationDays; // durationDays is actually period count
    const remainingPeriods = Math.max(0, totalPeriods - elapsedPeriods);
    const currentBalance = Number(pos.totalDeposited - pos.claimed) / 1e18;

    if (pos.mode === 0) {
      // Fixed mode: always extends duration, no toggle
      const periodAmount = Number(pos.dailyAmount) / 1e18;
      const extraPeriods = periodAmount > 0 ? Math.floor(topUpVal / periodAmount) : 0;
      const newTotalPeriods = remainingPeriods + extraPeriods;

      return {
        mode: "fixed" as const,
        adding: topUpVal,
        freqLabel,
        periodAmount,
        currentPeriods: remainingPeriods,
        extraPeriods,
        newTotalPeriods,
      };
    } else {
      // Percentage mode: two strategies
      const currentPct = pos.percentBps / 100; // e.g. 10 for 10%
      const currentBps = pos.percentBps;

      if (!recalculate) {
        // Extend Duration: same % rate, add more periods proportionally
        const oldRemaining = currentBalance;
        const extraPeriods = oldRemaining > 0
          ? Math.max(1, Math.floor((remainingPeriods * topUpVal) / oldRemaining))
          : remainingPeriods;
        const newTotalPeriods = remainingPeriods + extraPeriods;

        return {
          mode: "percentage_extend" as const,
          adding: topUpVal,
          freqLabel,
          currentPct,
          currentBps,
          currentPeriods: remainingPeriods,
          extraPeriods,
          newTotalPeriods,
        };
      } else {
        // Increase Rate: recalculate % to release more per period over remaining time
        const newBps = remainingPeriods > 0 ? Math.min(10000, Math.max(1, Math.floor(10000 / remainingPeriods))) : currentBps;
        const newPct = newBps / 100;
        const newBalance = currentBalance + topUpVal;
        const newPerPeriod = (newBalance * newBps) / 10000;

        return {
          mode: "percentage_increase" as const,
          adding: topUpVal,
          freqLabel,
          currentPct,
          currentBps,
          newPct,
          newBps,
          remainingPeriods,
          newPerPeriod,
        };
      }
    }
  }, [selectedPosition, topUpAmount, recalculate]);

  const handleTopUp = () => {
    if (!selectedId) { toast.error("Select a position"); return; }
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) { toast.error("Enter a top-up amount"); return; }
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
    <div className="space-y-4">
      {/* Position selector */}
      <div className="space-y-1">
        <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Select Position</label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="bg-secondary border-border font-mono-display h-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200">
            <SelectValue placeholder="Select position..." />
          </SelectTrigger>
          <SelectContent>
            {positions.length === 0 ? (
              <SelectItem value="-1" disabled>No active positions</SelectItem>
            ) : (
              positions.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  #{p.id} - {p.mode === 0 ? "Fixed" : "%"} - {FREQUENCY_LABELS[(p.frequency ?? 0) as UnlockFrequency]} - ${formatUSDCValue(p.totalDeposited - p.claimed)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Position details */}
      {selectedPosition && (
        <motion.div
          className="bg-secondary/50 rounded-lg p-3.5 space-y-1.5 text-xs border border-border/50"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode</span>
            <span className="font-mono-display font-medium">{selectedPosition.mode === 0 ? "Fixed" : "Percentage"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frequency</span>
            <span className="font-mono-display font-medium">{FREQUENCY_LABELS[(selectedPosition.frequency ?? 0) as UnlockFrequency]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{selectedPosition.mode === 0 ? "Period Amount" : "Period Release"}</span>
            <span className="font-mono-display font-medium">
              {selectedPosition.mode === 0
                ? `$${formatUSDCValue(selectedPosition.dailyAmount)}`
                : `${(selectedPosition.percentBps / 100).toFixed(2)}% (~$${formatUSDCValue((selectedPosition.totalDeposited - selectedPosition.claimed) * BigInt(selectedPosition.percentBps) / 10000n)}/period)`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Secured</span>
            <span className="font-mono-display font-medium">${formatUSDCValue(selectedPosition.totalDeposited - selectedPosition.claimed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next Unlock</span>
            <NextUnlockTimer position={selectedPosition} />
          </div>
        </motion.div>
      )}

      {/* Top-up amount input */}
      <div className="space-y-1">
        <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Top-Up Amount (USDC)</label>
        <Input
          type="number"
          placeholder="50.00"
          value={topUpAmount}
          onChange={(e) => setTopUpAmount(e.target.value)}
          className="bg-secondary border-border font-mono-display h-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
        />
      </div>

      {/* ================================================================= */}
      {/* CHANGE 1: Percentage mode - two descriptive strategy cards          */}
      {/* ================================================================= */}
      {selectedPosition?.mode === 1 && (
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Top-Up Strategy</label>
          <div className="space-y-2">
            {/* Option A: Extend Duration (recalculate = false) - DEFAULT */}
            <button
              onClick={() => setRecalculate(false)}
              className={`w-full p-3.5 rounded-lg text-left transition-all duration-200 ${
                !recalculate
                  ? "border-l-[3px] border-l-primary border border-primary/30 bg-primary/5"
                  : "border border-border bg-secondary/30 opacity-60 hover:opacity-80 hover:border-border/80"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-xs font-bold text-foreground">Extend Duration</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed ml-[22px]">
                Same % rate per period. Your extra funds add more periods.
              </p>
              {topUpPreview && topUpPreview.mode === "percentage_extend" && !recalculate && (
                <p className="text-[10px] text-primary/80 mt-1.5 ml-[22px] font-mono-display">
                  Current: {topUpPreview.currentPct.toFixed(2)}% every {topUpPreview.freqLabel}.
                  Adding ${topUpPreview.adding.toFixed(2)} adds ~{topUpPreview.extraPeriods} more period{topUpPreview.extraPeriods !== 1 ? "s" : ""}.
                </p>
              )}
            </button>

            {/* Option B: Increase Rate (recalculate = true) */}
            <button
              onClick={() => setRecalculate(true)}
              className={`w-full p-3.5 rounded-lg text-left transition-all duration-200 ${
                recalculate
                  ? "border-l-[3px] border-l-primary border border-primary/30 bg-primary/5"
                  : "border border-border bg-secondary/30 opacity-60 hover:opacity-80 hover:border-border/80"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-xs font-bold text-foreground">Increase Rate</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed ml-[22px]">
                Recalculates your % to release more per period over remaining time.
              </p>
              {topUpPreview && topUpPreview.mode === "percentage_increase" && recalculate && (
                <p className="text-[10px] text-primary/80 mt-1.5 ml-[22px] font-mono-display">
                  New rate: ~{topUpPreview.newPct.toFixed(2)}% every {topUpPreview.freqLabel} for remaining {topUpPreview.remainingPeriods} period{topUpPreview.remainingPeriods !== 1 ? "s" : ""}.
                </p>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CHANGE 2: Fixed mode - single clear explanation (no toggle)        */}
      {/* ================================================================= */}
      {selectedPosition?.mode === 0 && topUpAmount && parseFloat(topUpAmount) > 0 && (
        <motion.div
          className="bg-secondary/50 rounded-lg p-3.5 border border-border/50"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <p className="text-xs font-bold text-foreground">Adds More Periods</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed ml-[22px]">
            Your extra funds will add more {FREQUENCY_LABELS[(selectedPosition.frequency ?? 0) as UnlockFrequency].toLowerCase()} periods
            at the same rate of <span className="font-mono-display text-foreground">${formatUSDCValue(selectedPosition.dailyAmount)}</span> per {FREQUENCY_LABELS[(selectedPosition.frequency ?? 0) as UnlockFrequency].toLowerCase()} period.
          </p>
          {topUpPreview && topUpPreview.mode === "fixed" && (
            <p className="text-[10px] text-primary/80 mt-1.5 ml-[22px] font-mono-display">
              Adding ${topUpPreview.adding.toFixed(2)} adds ~{topUpPreview.extraPeriods} more {topUpPreview.freqLabel} period{topUpPreview.extraPeriods !== 1 ? "s" : ""}.
            </p>
          )}
        </motion.div>
      )}

      {/* ================================================================= */}
      {/* CHANGE 3: Impact preview summary box                               */}
      {/* ================================================================= */}
      {topUpPreview && (
        <motion.div
          className="bg-card border border-primary/20 rounded-xl p-4 space-y-3"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Top-Up Summary</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adding</span>
              <span className="font-mono-display font-semibold text-foreground">${topUpPreview.adding.toFixed(4)} USDC</span>
            </div>

            {topUpPreview.mode === "fixed" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="font-medium text-foreground">Add More Periods</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate stays</span>
                  <span className="font-mono-display text-foreground">${topUpPreview.periodAmount.toFixed(4)} / {topUpPreview.freqLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-mono-display text-foreground">
                    {topUpPreview.currentPeriods} <span className="text-muted-foreground mx-1">-&gt;</span> {topUpPreview.newTotalPeriods} {topUpPreview.freqLabel} periods
                  </span>
                </div>
              </>
            )}

            {topUpPreview.mode === "percentage_extend" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="font-medium text-foreground">Extend Duration</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate stays</span>
                  <span className="font-mono-display text-foreground">{topUpPreview.currentPct.toFixed(2)}% {topUpPreview.freqLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-mono-display text-foreground">
                    {topUpPreview.currentPeriods} <span className="text-muted-foreground mx-1">-&gt;</span> {topUpPreview.newTotalPeriods} {topUpPreview.freqLabel} periods
                  </span>
                </div>
              </>
            )}

            {topUpPreview.mode === "percentage_increase" && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="font-medium text-foreground">Increase Rate</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate changes</span>
                  <span className="font-mono-display text-foreground">
                    {topUpPreview.currentPct.toFixed(2)}% <span className="text-muted-foreground mx-1">-&gt;</span> {topUpPreview.newPct.toFixed(2)}% {topUpPreview.freqLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New per period</span>
                  <span className="font-mono-display text-foreground">~${topUpPreview.newPerPeriod.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-mono-display text-foreground">{topUpPreview.remainingPeriods} {topUpPreview.freqLabel} periods</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Confirm button */}
      <motion.button
        onClick={handleTopUp}
        disabled={savings.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden min-h-[44px]"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        <span className="relative flex items-center gap-2">
          {savings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Confirm Top Up
        </span>
      </motion.button>
    </div>
  );
}



// ---------------------------------------------------------------------------
// Your Savings Card (SpendingPower)
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
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyPosId, setEmergencyPosId] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClaim = (positionId: number) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;
    const claimable = computePositionClaimable(pos);
    if (claimable === 0n) {
      toast.error("Nothing to claim yet");
      return;
    }
    savings.claim(positionId);
    toast.info("Confirm the claim transaction...");
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
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader icon={PiggyBank} title="Your Savings" subtitle="Manage positions and claim released funds" />

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Available to Claim</p>
        <motion.p
          className="font-mono-display text-foreground text-3xl sm:text-4xl font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CountUpValue value={formatUSDCValue(totalClaimable)} />
        </motion.p>
      </div>

      {positions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Active Positions</p>
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto scrollbar-hide">
            {positions.map((p, idx) => {
              const claimable = computePositionClaimable(p);
              const secured = p.totalDeposited - p.claimed - claimable;
              const hasClaimable = claimable > 0n;
              const freqLabel = FREQUENCY_LABELS[(p.frequency ?? 0) as UnlockFrequency];

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.35 }}
                  className="bg-secondary/30 border border-border/60 rounded-xl p-4 space-y-3 hover:border-primary/20 transition-colors duration-200"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">#{p.id}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                        {p.mode === 0 ? "Fixed" : "%"} / {freqLabel}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Next Unlock</p>
                      <p className="text-xs"><NextUnlockTimer position={p} /></p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Released</p>
                      <p className="font-mono-display text-sm text-primary font-semibold">${formatUSDCValue(claimable)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Secured</p>
                      <p className="font-mono-display text-sm text-foreground font-semibold">${formatUSDCValue(secured > 0n ? secured : 0n)}</p>
                    </div>
                  </div>

                  {/* Claim button */}
                  <motion.button
                    onClick={() => handleClaim(p.id)}
                    disabled={savings.isPending || !hasClaimable}
                    className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px] ${
                      hasClaimable
                        ? "bg-[#B45309] text-white hover:bg-[#A3480B] disabled:opacity-50"
                        : "bg-[#78350F]/30 text-[#78350F] cursor-not-allowed border border-[#78350F]/20"
                    }`}
                    whileHover={hasClaimable ? { scale: 1.01 } : {}}
                    whileTap={hasClaimable ? { scale: 0.99 } : {}}
                    animate={hasClaimable ? {
                      boxShadow: [
                        "0 0 0px rgba(180, 83, 9, 0)",
                        "0 0 12px rgba(180, 83, 9, 0.4)",
                        "0 0 0px rgba(180, 83, 9, 0)",
                      ],
                    } : { boxShadow: "none" }}
                    transition={hasClaimable ? { duration: 2, repeat: Infinity } : {}}
                  >
                    {savings.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                    Claim ${formatUSDCValue(claimable)}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <PiggyBank className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground text-center">Start saving to see your positions here</p>
          <p className="text-[11px] text-muted-foreground/60 text-center">Create a position using the Manage Allowance card</p>
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Emergency section */}
      {emergencyMode && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          <Select value={emergencyPosId} onValueChange={setEmergencyPosId}>
            <SelectTrigger className="bg-secondary border-border font-mono-display h-11 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200">
              <SelectValue placeholder="Select position..." />
            </SelectTrigger>
            <SelectContent>
              {positions.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  #{p.id} - ${formatUSDCValue(p.totalDeposited - p.claimed)} secured
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Emergency fee: {EMERGENCY_FEE_BPS / 100}% of remaining balance
          </p>
        </motion.div>
      )}

      <motion.button
        onClick={handleEmergencyClick}
        disabled={savings.isPending || positions.length === 0}
        className="w-full py-3 px-6 font-bold uppercase text-xs tracking-widest transition-all duration-150 bg-destructive/90 hover:bg-destructive text-destructive-foreground flex items-center justify-center gap-2 disabled:opacity-50 rounded-lg min-h-[44px]"
        whileHover={{
          x: [0, -2, 2, -2, 2, 0],
          transition: { duration: 0.4 },
        }}
      >
        <AlertTriangle className="w-4 h-4" />
        Emergency Unlock
      </motion.button>

      {emergencyMode && !showConfirm && (
        <button
          onClick={() => setEmergencyMode(false)}
          className="w-full text-[11px] text-muted-foreground hover:text-foreground text-center py-2 min-h-[44px]"
        >
          Cancel
        </button>
      )}

      <AnimatePresence>
        {showConfirm && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="bg-card border border-destructive/30 p-6 max-w-sm w-full rounded-xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-lg text-destructive font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Emergency Withdrawal
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will withdraw position #{emergencyPosId} with a{" "}
                <strong className="text-destructive">{EMERGENCY_FEE_BPS / 100}% fee</strong> on the
                remaining balance. Your streak will reset to 0 but you can rebuild it. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setEmergencyMode(false);
                  }}
                  className="btn-secondary flex-1 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEmergency}
                  className="flex-1 py-3 px-6 font-bold uppercase text-xs tracking-widest bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg min-h-[44px]"
                >
                  Confirm
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
// Recent Activity Card (TX Activity)
// ---------------------------------------------------------------------------

const TX_TYPE_COLORS: Record<string, string> = {
  "Deposit": "text-emerald-400",
  "Top Up": "text-emerald-400",
  "Claim": "text-primary",
  "Emergency": "text-destructive",
  "Check-In": "text-blue-400",
  "Badge Earned": "text-yellow-400",
};

const TX_TYPE_ICONS: Record<string, React.ElementType> = {
  "Deposit": Lock,
  "Top Up": Plus,
  "Claim": ArrowUpRight,
  "Emergency": AlertTriangle,
  "Check-In": Zap,
  "Badge Earned": Shield,
};

function TxActivityCard({ savings }: { savings: ReturnType<typeof useGamifiedSavings> }) {
  const { events, isLoading, error } = useTxActivity();

  const formatTimeAgo = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 0) return "just now";
    if (diff < 60) return "just now";
    if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} min${m > 1 ? "s" : ""} ago`; }
    if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hr${h > 1 ? "s" : ""} ago`; }
    if (diff < 604800) { const d = Math.floor(diff / 86400); return `${d} day${d > 1 ? "s" : ""} ago`; }
    const w = Math.floor(diff / 604800);
    return `${w} week${w > 1 ? "s" : ""} ago`;
  };

  const derivedEvents: TxEvent[] = useMemo(() => {
    if (events.length > 0) return [];

    const items: TxEvent[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const p of savings.positions) {
      const deposited = Number(p.totalDeposited) / 1e18;
      const claimed = Number(p.claimed) / 1e18;
      const startTime = Number(p.startTime);
      if (deposited > 0) {
        items.push({
          type: "Deposit",
          time: formatTimeAgo(startTime),
          amount: `+$${deposited.toFixed(2)}`,
          positive: true,
          timestamp: startTime,
        });
      }
      if (claimed > 0) {
        items.push({
          type: "Claim",
          time: formatTimeAgo(startTime + 86400),
          amount: `+$${claimed.toFixed(2)}`,
          positive: true,
          timestamp: startTime + 86400,
        });
      }
    }

    const streak = Number(savings.userStats.streak);
    if (streak > 0) {
      const lastCheckIn = Number(savings.userStats.lastCheckIn);
      items.push({
        type: "Check-In",
        time: lastCheckIn > 0 ? formatTimeAgo(lastCheckIn) : "active",
        amount: `${streak} day streak`,
        positive: true,
        timestamp: lastCheckIn || now,
      });
    }

    if (savings.badges.hasTier1) items.push({ type: "Badge Earned", time: "earned", amount: "Tier 1", positive: true, timestamp: 0 });
    if (savings.badges.hasTier2) items.push({ type: "Badge Earned", time: "earned", amount: "Tier 2", positive: true, timestamp: 0 });
    if (savings.badges.hasTier3) items.push({ type: "Badge Earned", time: "earned", amount: "Tier 3", positive: true, timestamp: 0 });

    if (savings.totalClaimable > 0n) {
      const amt = Number(savings.totalClaimable) / 1e18;
      items.push({
        type: "Claim",
        time: "available now",
        amount: `+$${amt.toFixed(2)}`,
        positive: true,
        timestamp: now,
      });
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [events, savings]);

  const allEvents = events.length > 0 ? events : derivedEvents;
  const displayEvents = allEvents.slice(0, 5);
  const hasMore = allEvents.length > 5;
  return (
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader icon={Activity} title="Recent Activity" subtitle="On-chain transaction history" />

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="space-y-0 max-h-[460px] overflow-y-auto">
        {isLoading && events.length === 0 && derivedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Loading activity...</p>
          </div>
        ) : error && derivedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Activity className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Activity className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-[11px] text-muted-foreground/60">Your transactions will appear here</p>
          </div>
        ) : (
          <>
            {displayEvents.map((tx, i) => {
            const IconComp = TX_TYPE_ICONS[tx.type] || Activity;
            const colorClass = TX_TYPE_COLORS[tx.type] || "text-muted-foreground";
            return (
              <motion.div
                key={`${tx.type}-${tx.timestamp}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors px-1 rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center ${colorClass}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${colorClass}`}>{tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
                <span className={`font-mono-display text-sm font-medium ${tx.positive ? "text-foreground" : "text-destructive"}`}>
                  {tx.amount}
                </span>
              </motion.div>
            );
            })}
            {hasMore && (
              <p className="text-[10px] text-muted-foreground/60 text-center pt-3 pb-1">
                Showing 5 most recent
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Savings Projection Card (formerly AllowanceAnalytics)
// ---------------------------------------------------------------------------

function SavingsProjectionCard({ positions }: { positions: (Position & { id: number })[] }) {
  const { projectionData, nowLabel } = useMemo(() => {
    if (positions.length === 0) {
      return { projectionData: [], nowLabel: "" };
    }

    const nowSec = Math.floor(Date.now() / 1000);

    // Find the overall timeline: earliest start to latest projected end
    let earliestStart = Infinity;
    let latestEnd = 0;
    const totalClaimed = positions.reduce((sum, p) => sum + Number(p.claimed) / 1e18, 0);

    for (const p of positions) {
      const startSec = Number(p.startTime);
      const freqSecs = FREQUENCY_SECONDS[(p.frequency ?? 0) as UnlockFrequency] || 86400;
      const deposited = Number(p.totalDeposited) / 1e18;
      const periodAmt = Number(p.dailyAmount) / 1e18;

      if (startSec < earliestStart) earliestStart = startSec;

      let endSec: number;
      if (p.mode === 0 && periodAmt > 0) {
        // Fixed: fully released after totalDeposited / dailyAmount periods
        const totalPeriods = Math.ceil(deposited / periodAmt);
        endSec = startSec + totalPeriods * freqSecs;
      } else if (p.mode === 1) {
        // Percentage: use durationDays periods
        endSec = startSec + p.durationDays * freqSecs;
      } else {
        endSec = startSec + 365 * 86400; // fallback 1 year
      }
      if (endSec > latestEnd) latestEnd = endSec;
    }

    // Ensure now is visible and add some padding
    if (latestEnd < nowSec + 86400) latestEnd = nowSec + 86400 * 7;
    if (earliestStart > nowSec) earliestStart = nowSec;

    const totalSpan = latestEnd - earliestStart;
    const numPoints = 25;
    const stepSec = totalSpan / (numPoints - 1);

    const data: { label: string; Secured: number; Released: number; Claimed: number }[] = [];
    let closestNowLabel = "";
    let closestNowDist = Infinity;

    for (let i = 0; i < numPoints; i++) {
      const tSec = earliestStart + i * stepSec;
      const date = new Date(tSec * 1000);

      // Format label based on span
      let label: string;
      if (totalSpan < 86400 * 7) {
        // Less than a week: show "Day X"
        const dayNum = Math.round((tSec - earliestStart) / 86400) + 1;
        label = `Day ${dayNum}`;
      } else if (totalSpan < 86400 * 90) {
        // Less than 3 months: show "Mar 29" style
        label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        // Longer: show "Mar '26" style
        label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      }

      // Track closest label to "now" for the reference line
      const dist = Math.abs(tSec - nowSec);
      if (dist < closestNowDist) {
        closestNowDist = dist;
        closestNowLabel = label;
      }

      // Calculate cumulative released across all positions at time tSec
      let totalReleased = 0;
      let totalDeposited = 0;

      for (const p of positions) {
        const startSec = Number(p.startTime);
        const freqSecs = FREQUENCY_SECONDS[(p.frequency ?? 0) as UnlockFrequency] || 86400;
        const deposited = Number(p.totalDeposited) / 1e18;
        totalDeposited += deposited;

        const elapsedFromStart = tSec - startSec;
        if (elapsedFromStart <= 0) continue;

        const elapsedPeriods = Math.floor(elapsedFromStart / freqSecs);

        if (p.mode === 0) {
          const periodAmt = Number(p.dailyAmount) / 1e18;
          totalReleased += Math.min(deposited, periodAmt * elapsedPeriods);
        } else {
          const r = p.percentBps / 10000;
          const released = deposited * (1 - Math.pow(1 - r, elapsedPeriods));
          totalReleased += Math.min(deposited, released);
        }
      }

      const secured = Math.max(0, totalDeposited - totalReleased);

      data.push({
        label,
        Released: +totalReleased.toFixed(2),
        Secured: +secured.toFixed(2),
        Claimed: +totalClaimed.toFixed(2),
      });
    }

    return { projectionData: data, nowLabel: closestNowLabel };
  }, [positions]);

  return (
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader icon={BarChart3} title="Savings Projection" subtitle="How your savings release over time" />

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {positions.length === 0 ? (
        <div className="h-[260px] border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-3">
          <BarChart3 className="w-10 h-10 text-muted-foreground/25" />
          <p className="text-sm text-muted-foreground">Create a savings position to see your projection</p>
          <p className="text-[11px] text-muted-foreground/50">Your release timeline will be visualized here</p>
        </div>
      ) : (
        <>
          <motion.div
            className="h-[260px] w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradReleased" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#737373" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#737373" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                {nowLabel && (
                  <ReferenceLine
                    x={nowLabel}
                    stroke="hsl(24, 100%, 50%)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: "NOW",
                      position: "top",
                      fill: "hsl(24, 100%, 50%)",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="Secured"
                  name="Secured"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  activeDot={{ r: 4, fill: "#ffffff", stroke: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="Released"
                  name="Released"
                  stroke="hsl(24, 100%, 50%)"
                  strokeWidth={2}
                  fill="url(#gradReleased)"
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(24, 100%, 50%)", stroke: "hsl(24, 100%, 50%)" }}
                />
                <Area
                  type="monotone"
                  dataKey="Claimed"
                  name="Claimed"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  strokeDasharray="5 3"
                  activeDot={{ r: 4, fill: "#22c55e", stroke: "#22c55e" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-white rounded-full" />
              <span className="text-muted-foreground">Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-primary rounded-full" />
              <span className="text-muted-foreground">Released</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-emerald-500 rounded-full opacity-70" style={{ borderTop: "1px dashed" }} />
              <span className="text-muted-foreground">Claimed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border border-primary/50 border-dashed rounded-sm" />
              <span className="text-muted-foreground">Current Time</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
