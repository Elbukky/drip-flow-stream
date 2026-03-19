import { useProtocolSummary, useTokenStats, useDailyCreations, useWeeklyCreations, useStreamsCreatedInRange } from "@/hooks/useTokenStream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  USDC_LOGO,
  USDC_SYMBOL,
  formatUSDC,
  formatUSDCCompact,
} from "@/lib/contracts";
import { AppHeader, AppFooter } from "@/components/AppLayout";
import { GlobalStatsBar } from "@/components/GlobalStatsBar";

export default function ProtocolStatsPage() {
  const { data: protocolSummary, isLoading: protocolLoading } = useProtocolSummary();
  const { data: tokenStats, isLoading: tokenLoading } = useTokenStats();
  const { data: dailyCreations, isLoading: dailyLoading } = useDailyCreations();
  const { data: weeklyCreations, isLoading: weeklyLoading } = useWeeklyCreations();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const { data: monthlyCreations, isLoading: monthlyLoading } = useStreamsCreatedInRange(
    Math.floor(startOfMonth.getTime() / 1000),
    Math.floor(now.getTime() / 1000)
  );

  const isLoading = protocolLoading || tokenLoading || dailyLoading || weeklyLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <GlobalStatsBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading protocol stats...</span>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <GlobalStatsBar />
      <div className="flex-1 max-w-[1400px] mx-auto px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="font-mono-display text-3xl font-bold text-foreground tracking-tighter mb-2">
            PROTOCOL STATS
          </h1>
          <p className="text-muted-foreground">
            Real-time analytics and metrics for the TokenStream protocol.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Streams"
              value={protocolSummary ? Number(protocolSummary.totalStreams).toLocaleString() : "0"}
              description="All-time stream count"
            />
            <StatCard
              label="Active Streams"
              value={protocolSummary ? Number(protocolSummary.active).toLocaleString() : "0"}
              description="Currently streaming"
              highlight
            />
            <StatCard
              label="Paused Streams"
              value={protocolSummary ? Number(protocolSummary.paused).toLocaleString() : "0"}
              description="Temporarily halted"
            />
            <StatCard
              label="Completed Streams"
              value={protocolSummary ? Number(protocolSummary.completed).toLocaleString() : "0"}
              description="Successfully completed"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Cancelled Streams"
              value={protocolSummary ? Number(protocolSummary.cancelled).toLocaleString() : "0"}
              description="Cancelled by creators"
            />
            <StatCard
              label="Unique Creators"
              value={protocolSummary ? Number(protocolSummary.uniqueCreators).toLocaleString() : "0"}
              description="Distinct stream creators"
            />
            <StatCard
              label="Unique Beneficiaries"
              value={protocolSummary ? Number(protocolSummary.uniqueBeneficiaries).toLocaleString() : "0"}
              description="Distinct receivers"
            />
            <StatCard
              label="Whitelisted Tokens"
              value={protocolSummary ? Number(protocolSummary.tokensWhitelisted).toLocaleString() : "0"}
              description="Supported tokens"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src={USDC_LOGO} alt="USDC" className="w-5 h-5 rounded-full" />
                USDC Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <p className="label-micro mb-1">Total Deposited</p>
                  <p className="font-mono-display text-xl text-foreground">
                    {tokenStats ? formatUSDCCompact(tokenStats.totalDeposited) : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">{USDC_SYMBOL}</p>
                </div>
                <div>
                  <p className="label-micro mb-1">Total Claimed</p>
                  <p className="font-mono-display text-xl text-green-500">
                    {tokenStats ? formatUSDCCompact(tokenStats.totalClaimed) : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">{USDC_SYMBOL}</p>
                </div>
                <div>
                  <p className="label-micro mb-1">Currently Locked</p>
                  <p className="font-mono-display text-xl text-primary">
                    {tokenStats ? formatUSDCCompact(tokenStats.currentlyLocked) : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">{USDC_SYMBOL}</p>
                </div>
                <div>
                  <p className="label-micro mb-1">Active Stream Count</p>
                  <p className="font-mono-display text-xl">
                    {tokenStats ? Number(tokenStats.activeStreamCount).toLocaleString() : "0"}
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">All-Time Stream Count</p>
                  <p className="font-mono-display text-xl">
                    {tokenStats ? Number(tokenStats.allTimeStreamCount).toLocaleString() : "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stream Creations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted/50 rounded">
                  <p className="label-micro mb-2">Today</p>
                  <p className="font-mono-display text-3xl text-primary">
                    {dailyCreations ? Number(dailyCreations).toLocaleString() : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">streams created</p>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded">
                  <p className="label-micro mb-2">This Week</p>
                  <p className="font-mono-display text-3xl text-primary">
                    {weeklyCreations ? Number(weeklyCreations).toLocaleString() : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">streams created</p>
                </div>
                <div className="text-center p-6 bg-muted/50 rounded">
                  <p className="label-micro mb-2">This Month</p>
                  <p className="font-mono-display text-3xl text-primary">
                    {monthlyCreations ? Number(monthlyCreations).toLocaleString() : "0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">streams created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protocol Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="label-micro mb-1">Contract Address</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">0xb53879ADa9756D45D874b6c54d06052698CeDfC9</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("0xb53879ADa9756D45D874b6c54d06052698CeDfC9");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="label-micro mb-1">Network</p>
                  <p className="font-mono text-sm">Arc Testnet (Chain ID: 5042002)</p>
                </div>
                <div>
                  <p className="label-micro mb-1">Native Token</p>
                  <div className="flex items-center gap-2">
                    <img src={USDC_LOGO} alt="USDC" className="w-4 h-4 rounded-full" />
                    <span className="font-mono text-sm">{USDC_SYMBOL}</span>
                    <span className="text-xs text-muted-foreground">(address(0))</span>
                  </div>
                </div>
                <div>
                  <p className="label-micro mb-1">Decimals</p>
                  <p className="font-mono text-sm">18</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  highlight,
}: {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/50" : ""}>
      <CardContent className="pt-6">
        <p className="label-micro mb-1">{label}</p>
        <p className={`font-mono-display text-2xl ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function Copy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="14" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
