import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import {
  useUserStreams,
  useCreatorStreams,
  useBeneficiarySummary,
  useBeneficiaryTokenBreakdown,
  useExpiringStreams,
  useStream,
  useClaim,
  usePauseStream,
  useResumeStream,
  useCancelStream,
} from "@/hooks/useTokenStream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Copy, DollarSign, Clock, Pause, Play, XCircle } from "lucide-react";
import {
  USDC_LOGO,
  USDC_SYMBOL,
  STATUS,
  STATUS_COLORS,
  formatUSDC,
  truncateAddress,
  getStreamUrl,
  getIntervalLabel,
  getPerUnlockAmount,
  getNextUnlockIn,
  formatTime,
} from "@/lib/contracts";
import { USDCFlow } from "@/components/USDCFlow";
import { AppHeader, AppFooter } from "@/components/AppLayout";

const PAGE_SIZE = 20;

export default function MyStreamsPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-[1400px] mx-auto px-6 py-8 w-full">
            <Card className="max-w-xl mx-auto">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Connect your wallet to view streams</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1 max-w-[1400px] mx-auto px-6 py-8 w-full">
        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="incoming">Incoming (Receiving)</TabsTrigger>
            <TabsTrigger value="created">Created (Sending)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="incoming">
            <BeneficiaryStreams />
          </TabsContent>
          
          <TabsContent value="created">
            <CreatorStreams />
          </TabsContent>
        </Tabs>
      </div>
      <AppFooter />
    </div>
  );
}

function BeneficiaryStreams() {
  const { address } = useAccount();
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const { data: summary } = useBeneficiarySummary(address);
  const { data: breakdown } = useBeneficiaryTokenBreakdown(address);
  const { data: expiringResult } = useExpiringStreams(address!, 604800, 0, 5);
  const { data: streamsResult, isLoading: streamsLoading } = useUserStreams(address!, page * PAGE_SIZE, PAGE_SIZE);
  const { claim, isPending: isClaiming, isConfirmed: claimConfirmed } = useClaim();

  useEffect(() => {
    if (claimConfirmed) {
      toast.success("Tokens claimed successfully!");
    }
  }, [claimConfirmed]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <SummaryCard label="Total" value={summary ? Number(summary[0]).toLocaleString() : "0"} />
        <SummaryCard label="Active" value={summary ? Number(summary[1]).toLocaleString() : "0"} highlight />
        <SummaryCard label="Completed" value={summary ? Number(summary[2]).toLocaleString() : "0"} />
        <SummaryCard 
          label="Claimable" 
          value={summary ? formatUSDC(summary[3]) : "0"} 
          highlight 
          green 
        />
      </div>

      {breakdown && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
              <div>
                <p className="label-micro mb-0.5 text-[9px] sm:text-xs">Claimed</p>
                <p className="font-mono-display text-xs sm:text-sm text-primary">{formatUSDC(breakdown[0])}</p>
              </div>
              <div>
                <p className="label-micro mb-0.5 text-[9px] sm:text-xs">Pending</p>
                <p className="font-mono-display text-xs sm:text-sm text-green-500">{formatUSDC(breakdown[1])}</p>
              </div>
              <div>
                <p className="label-micro mb-0.5 text-[9px] sm:text-xs">Locked</p>
                <p className="font-mono-display text-xs sm:text-sm">{formatUSDC(breakdown[2])}</p>
              </div>
              <div>
                <p className="label-micro mb-0.5 text-[9px] sm:text-xs">Expected</p>
                <p className="font-mono-display text-xs sm:text-sm">{formatUSDC(breakdown[3])}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {expiringResult && expiringResult[0] && expiringResult[0].length > 0 && (
        <Card className="border-yellow-600/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringResult[0].map((streamId: bigint) => (
                <div key={streamId.toString()} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Stream #{streamId.toString()}</span>
                  <button
                    onClick={() => navigate(getStreamUrl(streamId.toString()))}
                    className="text-primary hover:underline"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <StreamList
        address={address!}
        page={page}
        setPage={setPage}
        onClaim={claim}
        isClaiming={isClaiming}
        streamsResult={streamsResult}
        streamsLoading={streamsLoading}
      />
    </div>
  );
}

function StreamList({
  address,
  page,
  setPage,
  onClaim,
  isClaiming,
  streamsResult,
  streamsLoading,
}: {
  address: `0x${string}`;
  page: number;
  setPage: (page: number) => void;
  onClaim: (streamId: bigint) => void;
  isClaiming: boolean;
  streamsResult: readonly [bigint[], bigint] | undefined;
  streamsLoading: boolean;
}) {
  const navigate = useNavigate();

  if (streamsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!streamsResult || streamsResult[0].length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No streams to claim</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [streamIds, total] = streamsResult;

  return (
    <div className="space-y-4">
      {streamIds.map((streamId: bigint) => (
        <StreamCard
          key={streamId.toString()}
          streamId={streamId}
          onClaim={onClaim}
          isClaiming={isClaiming}
          onClick={() => navigate(getStreamUrl(streamId.toString()))}
        />
      ))}

      {Number(total) > (page + 1) * PAGE_SIZE && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(page + 1)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function StreamCard({
  streamId,
  onClaim,
  isClaiming,
  onClick,
}: {
  streamId: bigint;
  onClaim: (streamId: bigint) => void;
  isClaiming: boolean;
  onClick: () => void;
}) {
  const { stream, claimable, progress, isLoading, refetch } = useStream(streamId);
  const [liveClaimable, setLiveClaimable] = useState<bigint | undefined>();
  const [nextUnlock, setNextUnlock] = useState<number>(0);

  useEffect(() => {
    if (claimable !== undefined) {
      setLiveClaimable(claimable);
    }
  }, [claimable]);

  useEffect(() => {
    if (!stream || stream.status !== 0) return;

    const updateNextUnlock = () => {
      const next = getNextUnlockIn(stream.startTime, stream.interval);
      setNextUnlock(next);
    };

    updateNextUnlock();
    const interval = setInterval(updateNextUnlock, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  useEffect(() => {
    if (!stream || stream.status !== 0) return;
    if (nextUnlock === 1) {
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [nextUnlock, stream, refetch]);

  if (isLoading || !stream) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = stream.status;
  const progressPercent = progress ? Number(progress) / 100 : 0;
  const perUnlock = getPerUnlockAmount(stream.totalAmount, stream.duration, stream.interval);

  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
      <CardContent className="pt-4 pb-4" onClick={onClick}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-display text-xs sm:text-sm text-muted-foreground">#{streamId.toString()}</span>
              <Badge className={`${STATUS_COLORS[status]} text-white text-[10px] sm:text-xs`}>{STATUS[status]}</Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <span>From: {truncateAddress(stream.creator)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(stream.creator);
                  toast.success("Address copied");
                }}
                className="hover:text-foreground"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <img src={USDC_LOGO} alt="USDC" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-contain" />
            <span className="font-mono-display text-base sm:text-lg text-foreground">
              {formatUSDC(stream.totalAmount)}
            </span>
            <span className="text-[10px] sm:text-sm text-muted-foreground">{USDC_SYMBOL}</span>
          </div>
        </div>

        <USDCFlow progress={progressPercent} totalAmount={stream.totalAmount} paused={status === 1} duration={stream.duration} interval={stream.interval} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] sm:text-xs mt-3 mb-3">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Unlocks</span>
            <span className="text-foreground">{getIntervalLabel(stream.interval)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Next Unlock</span>
            <span className="text-primary font-medium">{status === 0 ? formatTime(nextUnlock) : "-"}</span>
          </div>
          <div className="flex flex-col sm:col-span-1">
            <span className="text-muted-foreground">Per Unlock</span>
            <span className="text-foreground">{formatUSDC(perUnlock)} USDC</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2 text-[10px] sm:text-xs mb-3">
          <span className="text-muted-foreground">
            Claimed: {formatUSDC(stream.claimed)} / {formatUSDC(stream.totalAmount)}
          </span>
          {status === 0 && liveClaimable !== undefined && (
            <span className="flex items-center gap-1 text-green-500 font-medium">
              <DollarSign className="w-3 h-3" />
              {formatUSDC(liveClaimable)} claimable
            </span>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()} className="w-full">
          {status === 0 && liveClaimable !== undefined && Number(liveClaimable) > 0 && (
            <Button
              size="sm"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
              onClick={() => onClaim(stream.streamId)}
              disabled={isClaiming}
            >
              {isClaiming ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <DollarSign className="w-3 h-3 mr-1" />
              )}
              Claim {formatUSDC(liveClaimable)} USDC
            </Button>
          )}
          {status === 0 && (liveClaimable === undefined || Number(liveClaimable) <= 0) && (
            <Button size="sm" disabled className="text-[10px] sm:text-xs">
              Nothing to claim yet
            </Button>
          )}
          {status === 1 && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs">Paused</Badge>
          )}
          {status === 2 && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs">Completed</Badge>
          )}
          {status === 3 && (
            <Badge variant="destructive" className="text-[10px] sm:text-xs">Cancelled</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
  green,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  green?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/50" : ""}>
      <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4">
        <p className="label-micro mb-0.5 text-[9px] sm:text-xs">{label}</p>
        <p className={`font-mono-display text-sm sm:text-lg ${green ? "text-green-500" : highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function CreatorStreams() {
  const { address } = useAccount();
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const { data: streamsResult, isLoading: streamsLoading } = useCreatorStreams(address!, page * PAGE_SIZE, PAGE_SIZE);
  const { pauseStream, isPending: isPausing, isConfirmed: pauseConfirmed } = usePauseStream();
  const { resumeStream, isPending: isResuming, isConfirmed: resumeConfirmed } = useResumeStream();
  const { cancelStream, isPending: isCancelling, isConfirmed: cancelConfirmed } = useCancelStream();

  useEffect(() => {
    if (pauseConfirmed) toast.success("Stream paused");
    if (resumeConfirmed) toast.success("Stream resumed");
    if (cancelConfirmed) toast.success("Stream cancelled");
  }, [pauseConfirmed, resumeConfirmed, cancelConfirmed]);

  if (streamsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!streamsResult || streamsResult[0].length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">You haven't created any streams yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [streamIds, total] = streamsResult;

  return (
    <div className="space-y-4">
      {streamIds.map((streamId: bigint) => (
        <CreatorStreamCard
          key={streamId.toString()}
          streamId={streamId}
          onPause={pauseStream}
          onResume={resumeStream}
          onCancel={cancelStream}
          isPausing={isPausing}
          isResuming={isResuming}
          isCancelling={isCancelling}
          onClick={() => navigate(getStreamUrl(streamId.toString()))}
        />
      ))}

      {Number(total) > (page + 1) * PAGE_SIZE && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(page + 1)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function CreatorStreamCard({
  streamId,
  onPause,
  onResume,
  onCancel,
  isPausing,
  isResuming,
  isCancelling,
  onClick,
}: {
  streamId: bigint;
  onPause: (id: bigint) => void;
  onResume: (id: bigint) => void;
  onCancel: (id: bigint) => void;
  isPausing: boolean;
  isResuming: boolean;
  isCancelling: boolean;
  onClick: () => void;
}) {
  const { stream, claimable, remaining, progress, isLoading } = useStream(streamId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [nextUnlock, setNextUnlock] = useState<number>(0);

  useEffect(() => {
    if (!stream || stream.status !== 0) return;

    const updateNextUnlock = () => {
      const next = getNextUnlockIn(stream.startTime, stream.interval);
      setNextUnlock(next);
    };

    updateNextUnlock();
    const interval = setInterval(updateNextUnlock, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  if (isLoading || !stream) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = stream.status;
  const progressPercent = progress ? Number(progress) / 100 : 0;
  const perUnlock = getPerUnlockAmount(stream.totalAmount, stream.duration, stream.interval);

  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors">
      <CardContent className="pt-4 pb-4" onClick={onClick}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-display text-xs sm:text-sm text-muted-foreground">#{streamId.toString()}</span>
              <Badge className={`${STATUS_COLORS[status]} text-white text-[10px] sm:text-xs`}>{STATUS[status]}</Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <span>To: {truncateAddress(stream.beneficiary)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(stream.beneficiary);
                  toast.success("Address copied");
                }}
                className="hover:text-foreground"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <img src={USDC_LOGO} alt="USDC" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-contain" />
            <span className="font-mono-display text-base sm:text-lg text-foreground">
              {formatUSDC(stream.totalAmount)}
            </span>
            <span className="text-[10px] sm:text-sm text-muted-foreground">{USDC_SYMBOL}</span>
          </div>
        </div>

        <USDCFlow progress={progressPercent} totalAmount={stream.totalAmount} paused={status === 1} duration={stream.duration} interval={stream.interval} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] sm:text-xs mt-3 mb-3">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Unlocks</span>
            <span className="text-foreground">{getIntervalLabel(stream.interval)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Next Unlock</span>
            <span className="text-primary font-medium">{status === 0 ? formatTime(nextUnlock) : "-"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Per Unlock</span>
            <span className="text-foreground">{formatUSDC(perUnlock)} USDC</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2 text-[10px] sm:text-xs mt-3 mb-3">
          <span className="text-muted-foreground">
            Claimed: {formatUSDC(stream.claimed)} / {formatUSDC(stream.totalAmount)}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="flex flex-wrap gap-2">
          {(status === 0 || status === 1) && (
            <>
              {status === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] sm:text-xs"
                  onClick={() => onPause(streamId)}
                  disabled={isPausing}
                >
                  {isPausing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
                  Pause
                </Button>
              )}
              {status === 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] sm:text-xs"
                  onClick={() => onResume(streamId)}
                  disabled={isResuming}
                >
                  {isResuming ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  Resume
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                className="text-[10px] sm:text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCancelModal(true);
                }}
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Cancel
              </Button>
            </>
          )}
          {status === 2 && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs">Completed</Badge>
          )}
          {status === 3 && (
            <Badge variant="destructive" className="text-[10px] sm:text-xs">Cancelled</Badge>
          )}
        </div>
      </CardContent>

      {showCancelModal && stream && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-card border rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Cancel Stream #{streamId.toString()}</h3>
            <p className="text-sm text-muted-foreground mb-4">Cancelling will:</p>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Send to beneficiary:</span>
                <span className="font-mono text-green-500">{claimable ? formatUSDC(claimable) : "0.00"} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return to you:</span>
                <span className="font-mono text-red-400">{remaining ? formatUSDC(remaining) : "0.00"} USDC</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setShowCancelModal(false);
                  onCancel(streamId);
                }}
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Cancel Stream
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
