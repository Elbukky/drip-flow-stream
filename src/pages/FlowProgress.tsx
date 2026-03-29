import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { AppHeader, AppFooter } from "@/components/AppLayout";
import { useGamifiedSavings } from "@/hooks/useGamifiedSavings";
import { formatUSDCValue, MIN_BALANCE_MULT, STREAK_RECOVERY_FEE } from "@/lib/gamified-savings";
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
} from "lucide-react";
import { motion } from "framer-motion";
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
// Helpers
// ---------------------------------------------------------------------------

function getMilestone(streak: number) {
  if (streak < 1)
    return {
      title: "First Check-In",
      description: "Complete your first daily check-in",
      current: 0,
      target: 1,
      motivational: "Start your journey today!",
    };
  if (streak < 15)
    return {
      title: "Silver Badge",
      description: "Reach a 15-day streak",
      current: streak,
      target: 15,
      motivational:
        streak >= 10
          ? "You're close - keep your streak going!"
          : "Keep it up! Consistency is key.",
    };
  if (streak < 30)
    return {
      title: "Gold Badge",
      description: "Reach a 30-day streak",
      current: streak,
      target: 30,
      motivational:
        streak >= 25
          ? "Almost there - don't stop now!"
          : "You're close - keep your streak going!",
    };
  return {
    title: "All Milestones Complete!",
    description: "You've earned all badges",
    current: 30,
    target: 30,
    motivational: "Legendary discipline. Keep it up!",
  };
}

function getNextMilestoneName(streak: number) {
  if (streak < 7) return "7-Day Discipline";
  if (streak < 15) return "15-Day Discipline";
  if (streak < 30) return "30-Day Discipline";
  return "All Complete";
}

function getNextMilestoneTarget(streak: number) {
  if (streak < 7) return 7;
  if (streak < 15) return 15;
  if (streak < 30) return 30;
  return 30;
}

function getMultiplierColor(multiplier: number): string {
  if (multiplier >= 4) return "text-primary"; // orange/gold
  if (multiplier >= 3) return "text-purple-400";
  if (multiplier >= 2) return "text-blue-400";
  return "text-muted-foreground";
}

function getMultiplierBg(multiplier: number): string {
  if (multiplier >= 4) return "bg-primary/20 border-primary/40";
  if (multiplier >= 3) return "bg-purple-400/20 border-purple-400/40";
  if (multiplier >= 2) return "bg-blue-400/20 border-blue-400/40";
  return "bg-secondary border-border";
}

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

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function FlowProgressPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 w-full">
          <PageTabs />
          <div className="panel flex items-center justify-center py-16">
            <p className="text-muted-foreground">
              Connect your wallet to view your flow progress
            </p>
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
        <FlowProgressContent />
      </div>
      <AppFooter />
    </div>
  );
}

function FlowProgressContent() {
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

  const discipline = useMemo(() => {
    if (savings.positions.length === 0 && streak === 0) return 0;
    return Math.min(streak * 10 + 32, 100);
  }, [streak, savings.positions.length]);

  const milestone = useMemo(() => getMilestone(streak), [streak]);

  const topMilestoneTarget = useMemo(
    () => getNextMilestoneTarget(streak),
    [streak]
  );
  const topMilestoneName = useMemo(
    () => getNextMilestoneName(streak),
    [streak]
  );

  if (savings.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SECTION 1: YOUR FLOW PROGRESS */}
      <FlowProgressStats
        streak={streak}
        discipline={discipline}
        activePositionCount={activePositionCount}
        topMilestoneName={topMilestoneName}
        topMilestoneTarget={topMilestoneTarget}
      />

      {/* SECTION 2: STREAK TRACKER */}
      <StreakTrackerCard
        streak={streak}
        lastCheckIn={lastCheckIn}
        topMilestoneTarget={topMilestoneTarget}
        savings={savings}
      />

      {/* SECTION 3: NEXT MILESTONE */}
      <NextMilestoneCard milestone={milestone} />

      {/* SECTION 4: XP & MULTIPLIER */}
      <XPMultiplierCard
        totalXP={totalXP}
        multiplier={multiplier}
        streak={streak}
        usedEmergency={usedEmergency}
        totalClaimable={savings.totalClaimable}
      />

      {/* SECTION 5: BADGES EARNED */}
      <BadgesEarnedGrid
        streak={streak}
        totalXP={totalXP}
        multiplier={multiplier}
        usedEmergency={usedEmergency}
        positions={savings.positions}
        badges={savings.badges}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION 1: YOUR FLOW PROGRESS (3-stat row)
// ---------------------------------------------------------------------------

function FlowProgressStats({
  streak,
  discipline,
  activePositionCount,
  topMilestoneName,
  topMilestoneTarget,
}: {
  streak: number;
  discipline: number;
  activePositionCount: number;
  topMilestoneName: string;
  topMilestoneTarget: number;
}) {
  const progress = Math.min(streak, topMilestoneTarget);
  const pct =
    topMilestoneTarget > 0 ? (progress / topMilestoneTarget) * 100 : 0;

  return (
    <div className="panel space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <span className="label-micro">YOUR FLOW PROGRESS</span>
      </div>

      {/* 3-stat row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat 1: Control Streak */}
        <div className="bg-secondary/50 border border-border p-4 rounded-sm text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-mono-display text-4xl text-foreground font-bold">
              {streak}
            </span>
            <span className="text-sm text-muted-foreground">Day</span>
          </div>
          <p className="label-micro mt-2">CONTROL STREAK</p>
        </div>

        {/* Stat 2: Monthly Discipline */}
        <div className="bg-secondary/50 border border-border p-4 rounded-sm text-center">
          <span className="font-mono-display text-4xl text-foreground font-bold">
            {discipline}%
          </span>
          <p className="label-micro mt-2">MONTHLY DISCIPLINE</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Within allowance
          </p>
        </div>

        {/* Stat 3: Active Streams */}
        <div className="bg-secondary/50 border border-border p-4 rounded-sm text-center">
          <span className="font-mono-display text-4xl text-foreground font-bold">
            {activePositionCount}
          </span>
          <p className="label-micro mt-2">ACTIVE STREAMS</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Running</p>
        </div>
      </div>

      {/* Next milestone progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Next milestone:{" "}
            <span className="text-foreground font-bold">
              {topMilestoneName}
            </span>
          </p>
          <span className="font-mono-display text-xs text-muted-foreground">
            {progress}/{topMilestoneTarget}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION 2: STREAK TRACKER
// ---------------------------------------------------------------------------

function StreakTrackerCard({
  streak,
  lastCheckIn,
  topMilestoneTarget,
  savings,
}: {
  streak: number;
  lastCheckIn: number;
  topMilestoneTarget: number;
  savings: ReturnType<typeof useGamifiedSavings>;
}) {
  const [countdown, setCountdown] = useState("");
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [canRecover, setCanRecover] = useState(false);

  useEffect(() => {
    function update() {
      const now = Math.floor(Date.now() / 1000);
      const nextCheckIn = lastCheckIn + 86400; // +24h
      const secRemaining = nextCheckIn - now;

      if (lastCheckIn === 0) {
        // Never checked in
        setCanCheckIn(true);
        setCanRecover(false);
        setCountdown("00:00:00");
        return;
      }

      if (secRemaining > 0) {
        // Still in cooldown
        setCanCheckIn(false);
        setCanRecover(false);
        setCountdown(formatCountdown(secRemaining));
      } else {
        // Cooldown expired
        setCanCheckIn(true);
        // If more than 48h since last check-in, streak is broken and recovery window passed
        // If between 24h-48h, eligible for check-in (streak continues or can recover)
        const hoursSinceCheckIn = (now - lastCheckIn) / 3600;
        if (hoursSinceCheckIn > 48 && streak > 0) {
          // Streak broken, within recovery window (24-48h was the window; >48h = too late)
          setCanRecover(false);
        } else if (hoursSinceCheckIn > 24 && hoursSinceCheckIn <= 48 && streak === 0) {
          // Missed exactly one day, recovery possible
          setCanRecover(true);
        }
        setCountdown("00:00:00");
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastCheckIn, streak]);

  const handleCheckIn = () => {
    savings.checkIn();
    toast.info("Confirm check-in transaction in your wallet...");
  };

  const handleRecoverStreak = () => {
    savings.recoverStreak();
    toast.info("Confirm streak recovery (0.01 USDC)...");
  };

  const TOTAL_DOTS = 30;
  const progress = Math.min(streak, topMilestoneTarget);

  return (
    <div className="panel space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="label-micro">STREAK TRACKER</span>
      </div>

      {streak > 0 ? (
        <p className="text-sm text-muted-foreground">
          You've stayed within your allowance for{" "}
          <span className="text-foreground font-bold">{streak} days</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Start your streak by checking in!
        </p>
      )}

      {/* Progress text */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Progress</span>
        <span className="font-mono-display text-xs text-muted-foreground">
          {progress}/{topMilestoneTarget}
        </span>
      </div>

      {/* Day indicator row */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-colors duration-300 ${
              i < streak
                ? "bg-primary"
                : "border border-muted-foreground"
            }`}
          />
        ))}
      </div>

      {/* Check-in button */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleCheckIn}
          disabled={savings.isPending || !canCheckIn}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {savings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          CHECK IN
        </button>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            Next check-in available in:{" "}
            <span className="font-mono-display text-foreground">
              {countdown}
            </span>
          </span>
        </div>

        {/* Recover streak button */}
        {canRecover && (
          <button
            onClick={handleRecoverStreak}
            disabled={savings.isPending}
            className="w-full py-3 px-6 font-bold uppercase text-xs tracking-widest transition-colors duration-150 bg-yellow-600 hover:bg-yellow-500 text-black flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {savings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            RECOVER STREAK (0.01 USDC)
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION 3: NEXT MILESTONE
// ---------------------------------------------------------------------------

function NextMilestoneCard({
  milestone,
}: {
  milestone: ReturnType<typeof getMilestone>;
}) {
  const pct =
    milestone.target > 0
      ? (milestone.current / milestone.target) * 100
      : 0;

  return (
    <div className="panel space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-muted-foreground" />
        <span className="label-micro">NEXT MILESTONE</span>
      </div>

      <div>
        <h3 className="font-mono-display text-lg text-foreground font-bold">
          {milestone.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {milestone.description}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono-display text-xs text-muted-foreground">
            {milestone.current} / {milestone.target} days
          </span>
          <span className="text-xs text-muted-foreground">
            {milestone.motivational}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION 4: XP & MULTIPLIER
// ---------------------------------------------------------------------------

function XPMultiplierCard({
  totalXP,
  multiplier,
  streak,
  usedEmergency,
  totalClaimable,
}: {
  totalXP: bigint;
  multiplier: number;
  streak: number;
  usedEmergency: boolean;
  totalClaimable: bigint;
}) {
  const multiplierColor = getMultiplierColor(multiplier);
  const multiplierBg = getMultiplierBg(multiplier);
  const hasMinBalance = totalClaimable >= MIN_BALANCE_MULT;

  const requirements = [
    {
      label: "7-day streak = 2x",
      achieved: streak >= 7,
    },
    {
      label: "15-day streak = 3x",
      achieved: streak >= 15,
    },
    {
      label: "30-day streak = 4x",
      achieved: streak >= 30,
    },
    {
      label: "No emergency withdrawals",
      achieved: !usedEmergency,
    },
    {
      label: ">10 USDC unclaimed balance",
      achieved: hasMinBalance,
    },
  ];

  return (
    <div className="panel space-y-5">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-muted-foreground" />
        <span className="label-micro">XP & MULTIPLIER</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: XP + Multiplier display */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              TOTAL XP
            </p>
            <p className="font-mono-display text-3xl text-primary font-bold">
              {totalXP.toString()}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
              CURRENT MULTIPLIER
            </p>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm border ${multiplierBg}`}
            >
              <TrendingUp className={`w-5 h-5 ${multiplierColor}`} />
              <span
                className={`font-mono-display text-3xl font-bold ${multiplierColor}`}
              >
                {multiplier}x
              </span>
            </div>
          </div>
        </div>

        {/* Right: Requirements list */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            REQUIREMENTS
          </p>
          {requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {req.achieved ? (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <span
                className={`text-sm ${
                  req.achieved
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency warning */}
      {usedEmergency && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 p-3 rounded-sm">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">
            Multiplier permanently lost due to emergency withdrawal
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECTION 5: BADGES EARNED
// ---------------------------------------------------------------------------

interface BadgeDef {
  title: string;
  description: string;
  icon: typeof Shield;
  earned: boolean;
  tier?: 1 | 2 | 3;
  tokenId?: bigint;
}

function BadgesEarnedGrid({
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
        icon: Shield,
        earned: hasTier1,
        tier: 1 as const,
        tokenId: badges.hasTier1 ? badges.tier1TokenId : undefined,
      },
      {
        title: "Silver Badge",
        description: "Reach a 15-day streak",
        icon: Star,
        earned: hasTier2,
        tier: 2 as const,
        tokenId: badges.hasTier2 ? badges.tier2TokenId : undefined,
      },
      {
        title: "Gold Badge",
        description: "Achieve a 30-day streak",
        icon: Crown,
        earned: hasTier3,
        tier: 3 as const,
        tokenId: badges.hasTier3 ? badges.tier3TokenId : undefined,
      },
      {
        title: "Saver",
        description: "Deposit your first savings",
        icon: Coins,
        earned: hasSaver,
      },
      {
        title: "Diamond Hands",
        description: "Never use emergency withdrawal",
        icon: Diamond,
        earned: hasDiamond,
      },
      {
        title: "Max Multiplier",
        description: "Achieve 4x XP multiplier",
        icon: Zap,
        earned: hasMaxMult,
      },
    ];
  }, [streak, totalXP, multiplier, usedEmergency, positions.length, badges]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Crown className="w-4 h-4 text-muted-foreground" />
        <span className="label-micro">BADGES EARNED</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {badgeDefs.map((badge, i) => (
          <motion.div
            key={badge.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <BadgeCard badge={badge} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: BadgeDef }) {
  const Icon = badge.icon;

  return (
    <div
      className={`p-5 rounded-sm border transition-all duration-200 ${
        badge.earned
          ? "bg-[#1E1E1E] border-border"
          : "bg-[#141414] border-border/50 opacity-60"
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            badge.earned
              ? "bg-primary/20"
              : "bg-secondary"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              badge.earned ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </div>

        {/* Title */}
        <h4 className="font-bold text-sm text-foreground">{badge.title}</h4>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {badge.description}
        </p>

        {/* Status */}
        {badge.earned ? (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              EARNED
            </span>
            {badge.tier && badge.tokenId !== undefined && badge.tokenId > 0n && (
              <p className="text-[9px] text-muted-foreground font-mono-display">
                Token #{badge.tokenId.toString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              LOCKED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
