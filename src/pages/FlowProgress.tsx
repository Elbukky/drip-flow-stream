import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { AppHeader, AppFooter } from "@/components/AppLayout";
import { useGamifiedSavings } from "@/hooks/useGamifiedSavings";
import { formatUSDCValue, MIN_LOCKED_FOR_XP, MIN_LOCKED_MULT, STREAK_RECOVERY_FEE, GAMIFIED_SAVINGS_ADDRESS } from "@/lib/gamified-savings";
import {
  Shield,
  Star,
  Crown,
  Coins,
  Diamond,
  Zap,
  Check,
  X,
  Lock,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Flame,
  Trophy,
  Target,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Navigation tabs (same as DripAllowance)
// ---------------------------------------------------------------------------

const NAV_TABS = [
  { label: "STREAMS", to: "/app/streams" },
  { label: "DRIP ALLOWANCE", to: "/app/allowance" },
  { label: "FLOW PROGRESS", to: "/app/progress" },
] as const;

function PageTabs() {
  const location = useLocation();
  return (
    <div className="flex items-center gap-6 border-b border-border mb-6 overflow-x-auto">
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
// Reusable CardHeader component (matching DripAllowance style)
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
// Staggered card animation wrapper
// ---------------------------------------------------------------------------

function StaggeredCard({ children, index, className = "" }: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animated number component (counts up from 0)
// ---------------------------------------------------------------------------

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.floor(eased * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayed(value);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{displayed}</>;
}

// ---------------------------------------------------------------------------
// Fire Animation Component (celebration on check-in)
// ---------------------------------------------------------------------------

function FireAnimation({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: `radial-gradient(circle, ${i % 3 === 0 ? '#FF6B00' : i % 3 === 1 ? '#FF9500' : '#FFD700'}, transparent)`,
            left: `${30 + Math.random() * 40}%`,
            bottom: '40%',
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: [0, -200 - Math.random() * 300],
            x: [0, (Math.random() - 0.5) * 120],
            opacity: [1, 1, 0],
            scale: [1, 1.5, 0],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: [0, 1.5, 1], rotate: [-10, 10, 0] }}
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        <Flame className="w-24 h-24 text-orange-500 drop-shadow-[0_0_30px_rgba(255,107,0,0.8)]" />
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader for loading states
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="panel space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary" />
        <div className="space-y-1.5">
          <div className="w-24 h-3.5 bg-secondary rounded" />
          <div className="w-40 h-2.5 bg-secondary/60 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="w-full h-10 bg-secondary rounded" />
        <div className="w-3/4 h-3 bg-secondary/60 rounded" />
        <div className="w-1/2 h-3 bg-secondary/60 rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom error decoder for contract reverts
// ---------------------------------------------------------------------------

const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  AlreadyCheckedInToday: "You've already checked in today! Come back tomorrow.",
  InsufficientLockedForXP: "You need at least 1 USDC still secured in your positions to check in.",
  NoActivePositions: "No active savings positions found. Create one first!",
  PositionNotActive: "This savings position is no longer active.",
  NothingToClaim: "Nothing available to claim yet.",
  ZeroAmount: "Amount cannot be zero.",
  StreakNotRecoverable: "Streak is not recoverable. Recovery is only available if you missed exactly 1 day.",
  IncorrectRecoveryFee: "Incorrect recovery fee. Please send exactly 0.01 ETH.",
};

function decodeContractError(error: unknown): string {
  const errObj = error as { message?: string; cause?: { message?: string; data?: { errorName?: string }; shortMessage?: string } };

  const causeData = errObj?.cause?.data;
  if (causeData?.errorName && CUSTOM_ERROR_MESSAGES[causeData.errorName]) {
    return CUSTOM_ERROR_MESSAGES[causeData.errorName];
  }

  const fullMessage = [
    errObj?.message ?? "",
    errObj?.cause?.message ?? "",
    errObj?.cause?.shortMessage ?? "",
  ].join(" ");

  for (const [errorName, friendlyMessage] of Object.entries(CUSTOM_ERROR_MESSAGES)) {
    if (fullMessage.includes(errorName)) {
      return friendlyMessage;
    }
  }

  if (fullMessage.includes("User rejected") || fullMessage.includes("user rejected") || fullMessage.includes("denied")) {
    return "Transaction was rejected in your wallet.";
  }

  return errObj?.cause?.shortMessage ?? errObj?.message ?? "Transaction failed. Please try again.";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [
    h.toString().padStart(2, "0"),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0"),
  ].join(":");
}

// Multiplier tier definitions
const MULTIPLIER_TIERS = [
  { multiplier: 1, label: "1x", streakRequired: 0, description: "Base rate" },
  { multiplier: 2, label: "2x", streakRequired: 7, description: "7-day streak" },
  { multiplier: 3, label: "3x", streakRequired: 15, description: "15-day streak" },
  { multiplier: 4, label: "4x", streakRequired: 30, description: "30-day streak" },
];

function getCurrentTierIndex(streak: number): number {
  if (streak >= 30) return 3;
  if (streak >= 15) return 2;
  if (streak >= 7) return 1;
  return 0;
}

function getNextMilestone(streak: number) {
  if (streak < 7)
    return {
      title: "7-Day Discipline",
      description: "Reach a 7-day streak to unlock 2x multiplier",
      current: streak,
      target: 7,
      motivational: streak >= 5 ? "Almost there!" : "Build the habit!",
    };
  if (streak < 15)
    return {
      title: "Silver Badge",
      description: "Reach a 15-day streak to earn your Silver NFT badge",
      current: streak,
      target: 15,
      motivational: streak >= 12 ? "So close - don't stop now!" : "Great momentum!",
    };
  if (streak < 30)
    return {
      title: "Gold Badge",
      description: "Reach a 30-day streak to earn the legendary Gold badge",
      current: streak,
      target: 30,
      motivational: streak >= 25 ? "The finish line is in sight!" : "Incredible consistency!",
    };
  return {
    title: "All Milestones Complete!",
    description: "You've earned all badges and maximum multiplier",
    current: 30,
    target: 30,
    motivational: "Legendary discipline. Keep it up!",
  };
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function FlowProgressPage() {
  const { isConnected, address } = useAccount();

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
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-muted-foreground text-center">
              Connect your wallet to view your flow progress
            </p>
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
        <FlowProgressContent />
      </div>
      <AppFooter />
    </div>
  );
}

function FlowProgressContent() {
  const { address } = useAccount();
  const savings = useGamifiedSavings();

  const streak = Number(savings.userStats.streak);
  const multiplier = Number(savings.userStats.multiplier);
  const totalXP = savings.userStats.totalXP;
  const lastCheckIn = Number(savings.userStats.lastCheckIn);
  const usedEmergency = savings.userStats.usedEmergency;

  const activePositionCount = useMemo(
    () => savings.positions.filter((p) => p.active).length,
    [savings.positions]
  );

  const milestone = useMemo(() => getNextMilestone(streak), [streak]);

  if (savings.isLoading) {
    return (
      <div className="flex flex-col flex-1 gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 min-w-0"><SkeletonCard /></div>
          <div className="flex-1 min-w-0"><SkeletonCard /></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 min-w-0"><SkeletonCard /></div>
          <div className="flex-1 min-w-0"><SkeletonCard /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-4">
      {/* Row 1: Streak Tracker + Next Milestone */}
      <div className="flex flex-col sm:flex-row gap-4">
        <StaggeredCard index={0} className="flex-1 min-w-0">
          <StreakTrackerCard
            streak={streak}
            lastCheckIn={lastCheckIn}
            savings={savings}
            totalXP={totalXP}
            address={address}
          />
        </StaggeredCard>
        <StaggeredCard index={1} className="flex-1 min-w-0">
          <NextMilestoneCard milestone={milestone} streak={streak} />
        </StaggeredCard>
      </div>

      {/* Row 2: XP Multiplier + Achievement Badges (expands to fill remaining) */}
      <div className="flex flex-col sm:flex-row gap-4 flex-1 min-h-[300px]">
        <StaggeredCard index={2} className="flex-1 min-w-0">
          <XPMultiplierCard
            totalXP={totalXP}
            multiplier={multiplier}
            streak={streak}
            usedEmergency={usedEmergency}
            totalLocked={savings.totalLocked}
            hasActivePosition={activePositionCount > 0}
          />
        </StaggeredCard>
        <StaggeredCard index={3} className="flex-1 min-w-0">
          <BadgesEarnedCard
            streak={streak}
            totalXP={totalXP}
            multiplier={multiplier}
            usedEmergency={usedEmergency}
            positions={savings.positions}
            badges={savings.badges}
          />
        </StaggeredCard>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STREAK TRACKER Card
// ---------------------------------------------------------------------------

function StreakTrackerCard({
  streak,
  lastCheckIn,
  savings,
  totalXP,
  address,
}: {
  streak: number;
  lastCheckIn: number;
  savings: ReturnType<typeof useGamifiedSavings>;
  totalXP: bigint;
  address: `0x${string}` | undefined;
}) {
  const [countdown, setCountdown] = useState("");
  const [canRecover, setCanRecover] = useState(false);
  const [showFire, setShowFire] = useState(false);
  const [xpEarnedToday, setXpEarnedToday] = useState<number | null>(null);
  const prevXPRef = useRef(totalXP);

  // --- FIX 1: Fetch real check-in history from on-chain event logs ---
  const publicClient = usePublicClient();
  const [checkInDays, setCheckInDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!publicClient || !address) return;

    const fetchCheckInHistory = async () => {
      try {
        // Get logs for the last ~30 days of blocks
        // Base Sepolia ~2s blocks, 30 days ~ 1,296,000 blocks
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(1_300_000);

        const logs = await publicClient.getLogs({
          address: GAMIFIED_SAVINGS_ADDRESS as `0x${string}`,
          event: parseAbiItem('event CheckIn(address indexed user, uint256 xpEarned, uint256 newStreak)'),
          args: { user: address },
          fromBlock: fromBlock > 0n ? fromBlock : 0n,
          toBlock: 'latest',
        });

        // The event doesn't have a day field, so derive the UTC day
        // from each log's block timestamp
        const days = new Set<number>();
        const blockCache = new Map<bigint, bigint>(); // blockNumber -> timestamp

        for (const log of logs) {
          if (log.blockNumber === null) continue;
          let timestamp = blockCache.get(log.blockNumber);
          if (timestamp === undefined) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            timestamp = block.timestamp;
            blockCache.set(log.blockNumber, timestamp);
          }
          const utcDay = Number(timestamp / BigInt(86400));
          days.add(utcDay);
        }
        setCheckInDays(days);
      } catch (err) {
        console.error('Failed to fetch check-in history:', err);
      }
    };

    fetchCheckInHistory();
  }, [publicClient, address, lastCheckIn]); // re-fetch when lastCheckIn changes


  // Compute canCheckIn from contract requirements
  const hasActivePositions = savings.positions.some((p) => p.active);
  const hasMinLocked = savings.totalLocked >= MIN_LOCKED_FOR_XP;
  const lastCheckInDay = lastCheckIn > 0 ? Math.floor(lastCheckIn / 86400) : -1;
  const todayDay = Math.floor(Date.now() / 1000 / 86400);
  const checkedInToday = lastCheckInDay === todayDay;
  const canCheckIn = hasActivePositions && hasMinLocked && !checkedInToday && !savings.isPending && !savings.isConfirming;

  // Disabled reason for UI hint
  const disabledReason = useMemo(() => {
    if (savings.isPending || savings.isConfirming) return "Transaction in progress...";
    if (!hasActivePositions) return "Create a savings position first on Drip Allowance";
    if (checkedInToday) return null; // handled by button state
    if (!hasMinLocked) return "You need at least 1 USDC still secured in your positions";
    return null;
  }, [hasActivePositions, hasMinLocked, checkedInToday, savings.isPending, savings.isConfirming]);

  useEffect(() => {
    function update() {
      const nowSec = Math.floor(Date.now() / 1000);
      const currentUtcDay = Math.floor(nowSec / 86400);
      const lastCheckInDay = lastCheckIn > 0 ? Math.floor(lastCheckIn / 86400) : -1;
      const isCheckedInToday = lastCheckInDay === currentUtcDay;

      if (lastCheckIn === 0) {
        setCanRecover(false);
        setCountdown("");
        return;
      }

      // Countdown to next UTC midnight (contract day boundary)
      const nextUtcMidnight = (currentUtcDay + 1) * 86400;
      const secRemaining = Math.max(0, nextUtcMidnight - nowSec);

      if (isCheckedInToday) {
        // Already checked in today -- show countdown to next UTC midnight
        setCanRecover(false);
        setCountdown(formatCountdown(secRemaining));
      } else {
        // Haven't checked in today
        const daysSinceLastCheckIn = currentUtcDay - lastCheckInDay;
        if (daysSinceLastCheckIn === 1 && streak > 0) {
          // Missed exactly 0 days (yesterday was last check-in) -- no recovery needed
          setCanRecover(false);
        } else if (daysSinceLastCheckIn === 2 && streak > 0) {
          // Missed exactly 1 day -- recovery available
          setCanRecover(true);
        } else {
          setCanRecover(false);
        }
        setCountdown("00:00:00");
      }
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastCheckIn, streak]);

  // Watch for write errors
  useEffect(() => {
    if (savings.writeError) {
      const message = decodeContractError(savings.writeError);
      toast.error(message);
    }
  }, [savings.writeError]);

  // On confirmed tx, trigger fire + show XP earned
  useEffect(() => {
    if (savings.isConfirmed) {
      toast.success("Check-in confirmed!");
      savings.refetchAll();
      setShowFire(true);
      setTimeout(() => setShowFire(false), 2500);

      // Calculate XP earned (difference from before)
      const diff = Number(totalXP - prevXPRef.current);
      if (diff > 0) {
        setXpEarnedToday(diff);
      } else {
        // Fallback: base XP for a check-in is 10 * multiplier
        setXpEarnedToday(10);
      }
      prevXPRef.current = totalXP;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savings.isConfirmed]);

  // Track XP changes
  useEffect(() => {
    prevXPRef.current = totalXP;
  }, [totalXP]);

  const handleCheckIn = () => {
    if (!hasActivePositions) {
      toast.error("No active savings positions. Create one on the Drip Allowance page first.");
      return;
    }
    if (checkedInToday) {
      // Do nothing - button is already showing "CHECKED IN TODAY"
      return;
    }
    if (!hasMinLocked) {
      toast.error("You need at least 1 USDC still secured in your savings positions to check in.");
      return;
    }
    try {
      savings.checkIn();
      toast.info("Confirm check-in transaction in your wallet...");
      setTimeout(() => savings.refetchAll(), 2000);
    } catch (error) {
      const message = decodeContractError(error);
      toast.error("Check-in failed: " + message);
    }
  };

  const handleRecoverStreak = () => {
    savings.recoverStreak();
    toast.info("Confirm streak recovery (costs 0.01 ETH)...");
  };

  // Generate streak calendar from real on-chain CheckIn event logs
  const calendarDays = useMemo(() => {
    const days: { date: Date; dayNum: number; isToday: boolean; checkedIn: boolean }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      // UTC day number matching contract's block.timestamp / 86400
      const utcDayNum = Math.floor(d.getTime() / 1000 / 86400);
      const isToday = i === 0;
      const checkedIn = checkInDays.has(utcDayNum) || (isToday && checkedInToday);
      days.push({ date: d, dayNum: utcDayNum, isToday, checkedIn });
    }
    return days;
  }, [checkInDays, checkedInToday]);

  return (
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Fire celebration */}
      <AnimatePresence>
        <FireAnimation show={showFire} />
      </AnimatePresence>

      <CardHeader
        icon={Flame}
        title="Streak Tracker"
        subtitle="Check in daily to build your streak and earn XP"
      />

      {/* Big streak number with fire animation */}
      <div className="flex items-center justify-center py-2">
        <div className="relative">
          {/* Fire glow behind the number */}
          {streak > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,107,0,0.3) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div className="relative flex items-baseline gap-2">
            <motion.span
              className="font-mono-display text-6xl sm:text-7xl font-bold"
              style={streak > 0 ? {
                background: "linear-gradient(135deg, #FF6B00, #FFD700)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 20px rgba(255,107,0,0.5))",
              } : { color: "var(--muted-foreground)" }}
              key={streak}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 15 }}
            >
              <AnimatedNumber value={streak} duration={1} />
            </motion.span>
            <span className="text-lg text-muted-foreground font-medium">
              {streak === 1 ? "day" : "days"}
            </span>
          </div>
        </div>
      </div>

      {/* XP earned today badge */}
      <AnimatePresence>
        {xpEarnedToday !== null && (
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">
                XP Earned Today: +<AnimatedNumber value={xpEarnedToday} duration={0.8} />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Calendar / Heatmap - last 30 days */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">Last 30 days</span>
        </div>
        <style>{`
          @keyframes flame-flicker {
            0%, 100% { transform: scaleY(1) scaleX(1) rotate(0deg); }
            25% { transform: scaleY(1.1) scaleX(0.95) rotate(-2deg); }
            50% { transform: scaleY(0.95) scaleX(1.05) rotate(1deg); }
            75% { transform: scaleY(1.05) scaleX(0.98) rotate(-1deg); }
          }
        `}</style>
        <div className="grid grid-cols-6 gap-1.5">
            {calendarDays.map((day, i) => {
              const dayLabel = day.date.getDate().toString();
              const isCheckedIn = day.checkedIn;
              return (
                <motion.div
                  key={i}
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.015, duration: 0.25 }}
                >
                  {isCheckedIn ? (
                    <div
                      key={day.dayNum}
                      className="w-8 h-8 flex items-center justify-center"
                      title={day.date.toLocaleDateString()}
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))',
                        ...(day.isToday ? { boxShadow: '0 0 0 2px rgba(255,107,0,0.5)', borderRadius: '6px' } : {}),
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6" style={{animation: 'flame-flicker 0.8s ease-in-out infinite'}}>
                        <path d="M12 2c0 0-7 8-7 13a7 7 0 0014 0c0-5-7-13-7-13z" fill="#F59E0B"/>
                        <path d="M12 9c0 0-3.5 4-3.5 6.5a3.5 3.5 0 007 0c0-2.5-3.5-6.5-3.5-6.5z" fill="#FCD34D"/>
                      </svg>
                    </div>
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-mono-display font-medium transition-all duration-200 ${
                        day.isToday
                          ? "bg-secondary ring-2 ring-primary/40 text-foreground animate-pulse"
                          : "bg-secondary/50 text-muted-foreground/60"
                      }`}
                      title={day.date.toLocaleDateString()}
                    >
                      {dayLabel}
                    </div>
                  )}
                </motion.div>
              );
            })}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5"><path d="M12 2c0 0-7 8-7 13a7 7 0 0014 0c0-5-7-13-7-13z" fill="#F59E0B"/></svg>
            <span>Checked in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-secondary/50" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-secondary ring-1 ring-primary/40" />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Check-in button + countdown */}
      <div className="space-y-3 pt-1">
        {checkedInToday ? (
          /* Already checked in - muted disabled button */
          <button
            disabled
            className="w-full min-h-[44px] py-3 px-6 font-bold uppercase text-xs tracking-widest bg-secondary text-muted-foreground rounded-lg flex items-center justify-center gap-2 cursor-default"
          >
            <Check className="w-4 h-4" />
            CHECKED IN TODAY
          </button>
        ) : (
          /* Active check-in button with glow when eligible */
          <motion.button
            onClick={handleCheckIn}
            disabled={!canCheckIn}
            className={`w-full min-h-[44px] py-3 px-6 font-bold uppercase text-xs tracking-widest rounded-lg flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-200 ${
              canCheckIn
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
            animate={canCheckIn ? {
              boxShadow: [
                "0 0 0px rgba(255,107,0,0)",
                "0 0 25px rgba(255,107,0,0.5)",
                "0 0 0px rgba(255,107,0,0)",
              ],
            } : {}}
            transition={canCheckIn ? { duration: 2, repeat: Infinity } : {}}
            whileHover={canCheckIn ? { scale: 1.01 } : {}}
            whileTap={canCheckIn ? { scale: 0.97 } : {}}
          >
            {canCheckIn && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {savings.isPending || savings.isConfirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Flame className="w-4 h-4" />
              )}
              CHECK IN
            </span>
          </motion.button>
        )}

        {/* Disabled reason */}
        {disabledReason && !checkedInToday && (
          <p className="text-center text-[11px] text-muted-foreground">
            {disabledReason}
          </p>
        )}

        {/* Countdown timer */}
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {countdown === "" ? (
              <span className="font-mono-display text-primary font-bold">
                Ready for first check-in!
              </span>
            ) : checkedInToday ? (
              <span>
                Next check-in in:{" "}
                <span className="font-mono-display text-foreground">{countdown}</span>
              </span>
            ) : (
              <span className="font-mono-display text-primary font-bold">
                Check-in available now!
              </span>
            )}
          </div>
          {checkedInToday && (
            <span className="text-[10px] text-muted-foreground/70">
              Resets at 00:00 UTC
            </span>
          )}
        </div>

        {/* Recover streak button */}
        {canRecover && (
          <motion.button
            onClick={handleRecoverStreak}
            disabled={savings.isPending}
            className="w-full min-h-[44px] py-3 px-6 font-bold uppercase text-xs tracking-widest transition-colors duration-150 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {savings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            RECOVER STREAK (0.01 ETH)
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEXT MILESTONE Card
// ---------------------------------------------------------------------------

function NextMilestoneCard({
  milestone,
  streak,
}: {
  milestone: ReturnType<typeof getNextMilestone>;
  streak: number;
}) {
  const pct = milestone.target > 0 ? (milestone.current / milestone.target) * 100 : 0;

  // Mini-milestones at 7, 15, 30
  const milestones = [
    { target: 7, label: "7d", name: "2x Multiplier", icon: Zap },
    { target: 15, label: "15d", name: "Silver Badge", icon: Star },
    { target: 30, label: "30d", name: "Gold Badge", icon: Crown },
  ];

  return (
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader
        icon={Target}
        title="Next Milestone"
        subtitle="Reach streak milestones to unlock multipliers"
      />

      {/* Current target */}
      <div className="space-y-1">
        <h4 className="font-semibold text-base text-foreground">{milestone.title}</h4>
        <p className="text-[12px] text-muted-foreground">{milestone.description}</p>
      </div>

      {/* Animated progress bar */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 relative"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono-display text-xs text-muted-foreground">
            {milestone.current} / {milestone.target} days
          </span>
          <span className="text-[11px] text-primary font-medium italic">
            {milestone.motivational}
          </span>
        </div>
      </div>

      {/* Milestone roadmap */}
      <div className="space-y-2 pt-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Milestone Roadmap
        </p>
        <div className="space-y-2">
          {milestones.map((m, i) => {
            const Icon = m.icon;
            const achieved = streak >= m.target;
            return (
              <motion.div
                key={m.target}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200 ${
                  achieved
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/30 border-border"
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  achieved ? "bg-primary/20" : "bg-secondary"
                }`}>
                  {achieved ? (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${achieved ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.label} streak required</p>
                </div>
                {achieved && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="px-2 py-0.5 rounded-full bg-primary/20 text-[9px] font-bold text-primary uppercase tracking-wider">
                      Done
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// XP MULTIPLIER Card
// ---------------------------------------------------------------------------

function XPMultiplierCard({
  totalXP,
  multiplier,
  streak,
  usedEmergency,
  totalLocked,
  hasActivePosition,
}: {
  totalXP: bigint;
  multiplier: number;
  streak: number;
  usedEmergency: boolean;
  totalLocked: bigint;
  hasActivePosition: boolean;
}) {
  const hasMinBalance = totalLocked >= MIN_LOCKED_MULT;
  const currentTierIdx = getCurrentTierIndex(streak);

  const requirements = [
    {
      label: "Active savings position",
      achieved: hasActivePosition,
    },
    {
      label: "10+ USDC secured",
      achieved: hasMinBalance,
    },
    {
      label: "7-day streak (2x)",
      achieved: streak >= 7,
    },
    {
      label: "15-day streak (3x)",
      achieved: streak >= 15,
    },
    {
      label: "30-day streak (4x)",
      achieved: streak >= 30,
    },
  ];

  return (
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader
        icon={Zap}
        title="XP Multiplier"
        subtitle="Your earning power based on streak and savings"
      />

      {/* Multiplier display with glow */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            Total XP Earned
          </p>
          <motion.p
            className="font-mono-display text-2xl text-primary font-bold"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedNumber value={Number(totalXP)} duration={1.2} />
          </motion.p>
        </div>

        <div className="relative">
          {/* Pulsing glow behind multiplier */}
          <motion.div
            className="absolute -inset-4 rounded-3xl"
            style={{
              background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.15) 40%, transparent 70%)",
              filter: "blur(20px)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative px-6 py-4 rounded-2xl border border-amber-500/50 bg-amber-500/10 animate-multiplier-glow"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <p className="text-[10px] uppercase tracking-wide text-amber-400/80 text-center mb-1 font-bold">
              Multiplier
            </p>
            <span
              className="font-mono-display text-5xl sm:text-6xl font-bold block text-center"
              style={{
                color: "#F59E0B",
                textShadow: "0 0 10px rgba(245,158,11,0.8), 0 0 20px rgba(245,158,11,0.4), 0 0 40px rgba(245,158,11,0.2)",
                filter: "drop-shadow(0 0 15px rgba(245,158,11,0.6))",
              }}
            >
              {multiplier}x
            </span>
          </motion.div>
        </div>
      </div>

      {/* Multiplier tier progress */}
      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Tier Progress
        </p>
        <div className="flex items-center gap-1">
          {MULTIPLIER_TIERS.map((tier, i) => {
            const isActive = i <= currentTierIdx;
            const isCurrent = i === currentTierIdx;
            return (
              <div key={tier.multiplier} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`w-full h-2 rounded-full ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-orange-400"
                      : "bg-secondary"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  style={{ originX: 0 }}
                />
                <span className={`text-[10px] font-mono-display font-bold ${
                  isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground/60"
                }`}>
                  {tier.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
          Requirements
        </p>
        <div className="space-y-1.5">
          {requirements.map((req, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
            >
              {req.achieved ? (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <X className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <span className={`text-[12px] ${
                req.achieved ? "text-foreground" : "text-muted-foreground"
              }`}>
                {req.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Emergency warning (softer - not permanent) */}
      {usedEmergency && (
        <motion.div
          className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-yellow-500/90 leading-relaxed">
            Emergency withdrawal used previously. Your streak resets but you can rebuild it to regain your multiplier.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ACHIEVEMENT BADGES Card
// ---------------------------------------------------------------------------

interface BadgeDef {
  title: string;
  description: string;
  requirement: string;
  icon: typeof Shield;
  earned: boolean;
  tier?: 1 | 2 | 3;
  tierLabel?: string;
  tokenId?: bigint;
}

function BadgesEarnedCard({
  streak,
  totalXP,
  multiplier,
  usedEmergency,
  positions,
  badges,
}: {
  streak: number;
  totalXP: bigint;
  multiplier: number;
  usedEmergency: boolean;
  positions: ReturnType<typeof useGamifiedSavings>["positions"];
  badges: ReturnType<typeof useGamifiedSavings>["badges"];
}) {
  const badgeDefs: BadgeDef[] = useMemo(() => {
    const hasTier1 = badges.hasTier1 || (streak >= 1 && totalXP >= 1n);
    const hasTier2 = badges.hasTier2 || streak >= 15;
    const hasTier3 = badges.hasTier3 || streak >= 30;
    const hasSaver = positions.length > 0;
    const hasDiamond = !usedEmergency && positions.length > 0;
    const hasMaxMult = multiplier >= 4;

    return [
      {
        title: "Bronze Badge",
        description: "Complete your first check-in",
        requirement: "1 check-in",
        icon: Shield,
        earned: hasTier1,
        tier: 1 as const,
        tierLabel: "Bronze",
        tokenId: badges.hasTier1 ? badges.tier1TokenId : undefined,
      },
      {
        title: "Silver Badge",
        description: "Reach a 15-day streak",
        requirement: "15-day streak",
        icon: Star,
        earned: hasTier2,
        tier: 2 as const,
        tierLabel: "Silver",
        tokenId: badges.hasTier2 ? badges.tier2TokenId : undefined,
      },
      {
        title: "Gold Badge",
        description: "Achieve a 30-day streak",
        requirement: "30-day streak",
        icon: Crown,
        earned: hasTier3,
        tier: 3 as const,
        tierLabel: "Gold",
        tokenId: badges.hasTier3 ? badges.tier3TokenId : undefined,
      },
      {
        title: "Saver",
        description: "Deposit your first savings",
        requirement: "Create a position",
        icon: Coins,
        earned: hasSaver,
      },
      {
        title: "Diamond Hands",
        description: "Never use emergency withdrawal",
        requirement: "No emergencies",
        icon: Diamond,
        earned: hasDiamond,
      },
      {
        title: "Max Power",
        description: "Achieve 4x XP multiplier",
        requirement: "4x multiplier",
        icon: Zap,
        earned: hasMaxMult,
      },
    ];
  }, [streak, totalXP, multiplier, usedEmergency, positions.length, badges]);

  const earnedCount = badgeDefs.filter((b) => b.earned).length;

  return (
    <div className="panel h-full flex flex-col group hover:border-primary/30 transition-all duration-300 relative overflow-hidden space-y-5">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-start justify-between">
        <CardHeader
          icon={Trophy}
          title="Achievement Badges"
          subtitle="Collectible NFT badges earned through consistency"
        />
        <div className="text-right flex-shrink-0 ml-2">
          <span className="font-mono-display text-lg font-bold text-foreground">{earnedCount}</span>
          <span className="text-xs text-muted-foreground">/{badgeDefs.length}</span>
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {badgeDefs.map((badge, i) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: "easeOut" }}
          >
            <BadgeCard badge={badge} />
          </motion.div>
        ))}
      </div>

      {/* Permanent badge note */}
      <div className="flex items-center gap-1.5 justify-center pt-1">
        <Lock className="w-3 h-3 text-muted-foreground/60" />
        <p className="text-[10px] text-muted-foreground/60 italic">
          Once earned, badges are yours forever
        </p>
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: BadgeDef }) {
  const Icon = badge.icon;

  const tierColors: Record<string, string> = {
    Bronze: "from-amber-700/30 to-amber-900/10 border-amber-700/30",
    Silver: "from-gray-300/20 to-gray-500/10 border-gray-400/30",
    Gold: "from-yellow-500/25 to-yellow-700/10 border-yellow-500/30",
  };

  const tierBg = badge.tierLabel && tierColors[badge.tierLabel]
    ? tierColors[badge.tierLabel]
    : badge.earned
    ? "from-primary/15 to-primary/5 border-primary/20"
    : "from-secondary to-secondary/50 border-border/50";

  return (
    <div
      className={`relative overflow-hidden p-3.5 rounded-xl border bg-gradient-to-br transition-all duration-300 ${tierBg} ${
        badge.earned ? "hover:border-primary/40" : "opacity-50"
      }`}
    >
      {/* Shimmer effect for earned badges */}
      {badge.earned && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      )}

      <div className="relative flex flex-col items-center text-center space-y-2">
        {/* Tier label */}
        {badge.tierLabel && (
          <span className={`text-[9px] font-bold uppercase tracking-widest ${
            badge.earned ? "text-primary" : "text-muted-foreground"
          }`}>
            {badge.tierLabel}
          </span>
        )}

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          badge.earned ? "bg-primary/20" : "bg-secondary/80"
        }`}>
          <Icon className={`w-5 h-5 ${
            badge.earned ? "text-primary" : "text-muted-foreground/60"
          }`} />
        </div>

        {/* Title */}
        <h4 className={`font-semibold text-[12px] leading-tight ${
          badge.earned ? "text-foreground" : "text-muted-foreground"
        }`}>
          {badge.title}
        </h4>

        {/* Status */}
        {badge.earned ? (
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20">
              <Check className="w-2.5 h-2.5 text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
                Earned
              </span>
            </div>
            {badge.tier && badge.tokenId !== undefined && badge.tokenId > 0n && (
              <p className="text-[9px] text-muted-foreground font-mono-display">
                NFT #{badge.tokenId.toString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 justify-center">
              <Lock className="w-2.5 h-2.5 text-muted-foreground/60" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Not Earned
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground/50">{badge.requirement}</p>
          </div>
        )}
      </div>
    </div>
  );
}
