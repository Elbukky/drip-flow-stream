import { useProtocolSummary, useTokenStats } from "@/hooks/useTokenStream";
import { formatUSDCCompact, USDC_LOGO } from "@/lib/contracts";
import { Loader2 } from "lucide-react";

export function GlobalStatsBar() {
  const { data: protocolSummary, isLoading: protocolLoading } = useProtocolSummary();
  const { data: tokenStats, isLoading: tokenLoading } = useTokenStats();

  if ((protocolLoading && !protocolSummary) || (tokenLoading && !tokenStats)) {
    return (
      <div className="border-b border-border bg-card/50">
        <div className="max-w-[1400px] mx-auto px-6 py-3">
          <div className="flex items-center justify-center gap-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading stats...</span>
          </div>
        </div>
      </div>
    );
  }

  const totalStreams = protocolSummary?.totalStreams ?? 0n;
  const active = protocolSummary?.active ?? 0n;
  const paused = protocolSummary?.paused ?? 0n;
  const completed = protocolSummary?.completed ?? 0n;
  const cancelled = protocolSummary?.cancelled ?? 0n;
  const uniqueCreators = protocolSummary?.uniqueCreators ?? 0n;
  const uniqueBeneficiaries = protocolSummary?.uniqueBeneficiaries ?? 0n;

  const totalDeposited = tokenStats?.totalDeposited ?? 0n;
  const totalClaimed = tokenStats?.totalClaimed ?? 0n;
  const currentlyLocked = tokenStats?.currentlyLocked ?? 0n;

  return (
    <div className="border-b border-border bg-card/30">
      <div className="max-w-[1400px] mx-auto px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-3 lg:gap-4">
          <StatItem label="Total" value={formatNumber(totalStreams)} />
          <StatItem label="Active" value={formatNumber(active)} highlight />
          <StatItem label="Paused" value={formatNumber(paused)} />
          <StatItem label="Completed" value={formatNumber(completed)} />
          <StatItem label="Cancelled" value={formatNumber(cancelled)} />
          <StatItem label="Creators" value={formatNumber(uniqueCreators)} />
          <StatItem label="Beneficiaries" value={formatNumber(uniqueBeneficiaries)} />
          <StatItem label="USDC Deposited" value={formatUSDCCompact(totalDeposited)} icon={<USDCLogoSmall />} suffix="USDC" />
          <StatItem label="USDC Claimed" value={formatUSDCCompact(totalClaimed)} icon={<USDCLogoSmall />} suffix="USDC" />
          <StatItem label="USDC Locked" value={formatUSDCCompact(currentlyLocked)} icon={<USDCLogoSmall />} suffix="USDC" highlight />
        </div>
      </div>
    </div>
  );
}

function formatNumber(value: bigint): string {
  const num = Number(value);
  if (isNaN(num)) return "0";
  return num.toLocaleString();
}

function StatItem({ 
  label, 
  value, 
  icon, 
  suffix, 
  highlight 
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="label-micro mb-0.5 text-[9px] lg:text-[10px]">{label}</span>
      <div className="flex items-center gap-1">
        {icon && <span className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0">{icon}</span>}
        <span className={`font-mono-display text-xs lg:text-sm truncate ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </span>
        {suffix && <span className="text-[9px] lg:text-[10px] text-muted-foreground hidden sm:inline">{suffix}</span>}
      </div>
    </div>
  );
}

function USDCLogoSmall() {
  return (
    <img 
      src={USDC_LOGO} 
      alt="USDC" 
      className="w-full h-full rounded-full object-contain"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
