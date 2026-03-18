import { useProtocolSummary, useTokenStats } from "@/hooks/useTokenStream";
import { formatUSDCCompact, USDC_LOGO } from "@/lib/contracts";
import { Loader2 } from "lucide-react";

export function GlobalStatsBar() {
  const { data: protocolSummary, isLoading: protocolLoading } = useProtocolSummary();
  const { data: tokenStats, isLoading: tokenLoading } = useTokenStats();

  if (protocolLoading || tokenLoading) {
    return (
      <div className="border-b border-border bg-card/50">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading protocol stats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-card/30">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-4">
          <StatItem
            label="Total Streams"
            value={protocolSummary ? Number(protocolSummary.totalStreams).toLocaleString() : "0"}
          />
          <StatItem
            label="Active"
            value={protocolSummary ? Number(protocolSummary.active).toLocaleString() : "0"}
            highlight
          />
          <StatItem
            label="Paused"
            value={protocolSummary ? Number(protocolSummary.paused).toLocaleString() : "0"}
          />
          <StatItem
            label="Completed"
            value={protocolSummary ? Number(protocolSummary.completed).toLocaleString() : "0"}
          />
          <StatItem
            label="Cancelled"
            value={protocolSummary ? Number(protocolSummary.cancelled).toLocaleString() : "0"}
          />
          <StatItem
            label="Creators"
            value={protocolSummary ? Number(protocolSummary.uniqueCreators).toLocaleString() : "0"}
          />
          <StatItem
            label="Beneficiaries"
            value={protocolSummary ? Number(protocolSummary.uniqueBeneficiaries).toLocaleString() : "0"}
          />
          <StatItem
            label="USDC Deposited"
            value={tokenStats ? formatUSDCCompact(tokenStats.totalDeposited) : "0"}
            icon={<USDCLogo />}
            suffix="USDC"
          />
          <StatItem
            label="USDC Claimed"
            value={tokenStats ? formatUSDCCompact(tokenStats.totalClaimed) : "0"}
            icon={<USDCLogo />}
            suffix="USDC"
          />
          <StatItem
            label="USDC Locked"
            value={tokenStats ? formatUSDCCompact(tokenStats.currentlyLocked) : "0"}
            icon={<USDCLogo />}
            suffix="USDC"
            highlight
          />
        </div>
      </div>
    </div>
  );
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
    <div className="flex flex-col">
      <span className="label-micro mb-1">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon && <span className="w-4 h-4">{icon}</span>}
        <span className={`font-mono-display text-sm ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function USDCLogo() {
  return (
    <img 
      src={USDC_LOGO} 
      alt="USDC" 
      className="w-4 h-4 rounded-full object-contain"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
