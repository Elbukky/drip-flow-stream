import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { useStream, useClaim, usePauseStream, useResumeStream, useCancelStream } from "@/hooks/useTokenStream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Copy, ArrowLeft, DollarSign, Clock, Pause, Play, XCircle } from "lucide-react";
import {
  USDC_LOGO,
  USDC_SYMBOL,
  STATUS,
  STATUS_COLORS,
  formatUSDC,
  formatTime,
  formatDate,
  truncateAddress,
  getExplorerUrl,
  getIntervalLabel,
  getPerUnlockAmount,
  getNextUnlockIn,
  getIntervalsCompleted,
  getTotalIntervals,
  isStreamFinished,
} from "@/lib/contracts";
import { AppHeader, AppFooter } from "@/components/AppLayout";

export default function StreamDetailPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();
  
  const { stream, claimable, streamed, remaining, progress, timeRemaining, endTime, isLoading, refetch } = useStream(BigInt(streamId!));
  
  const { claim, isPending: isClaiming, isConfirmed: claimConfirmed } = useClaim();
  const { pauseStream, isPending: isPausing, isConfirmed: pauseConfirmed } = usePauseStream();
  const { resumeStream, isPending: isResuming, isConfirmed: resumeConfirmed } = useResumeStream();
  const { cancelStream, isPending: isCancelling, isConfirmed: cancelConfirmed } = useCancelStream();
  
  const [cancelling, setCancelling] = useState(false);
  const [nextUnlock, setNextUnlock] = useState<number>(0);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (claimConfirmed) {
      toast.success("Tokens claimed successfully!");
      refetch();
    }
  }, [claimConfirmed, refetch]);

  useEffect(() => {
    if (stream && stream.status === 0) {
      const updateNextUnlock = () => {
        const next = getNextUnlockIn(stream.startTime, stream.interval);
        setNextUnlock(next);
      };
      updateNextUnlock();
      const interval = setInterval(updateNextUnlock, 1000);
      return () => clearInterval(interval);
    }
  }, [stream]);

  useEffect(() => {
    if (pauseConfirmed) {
      toast.success("Stream paused");
      refetch();
    }
  }, [pauseConfirmed, refetch]);

  useEffect(() => {
    if (resumeConfirmed) {
      toast.success("Stream resumed");
      refetch();
    }
  }, [resumeConfirmed, refetch]);

  useEffect(() => {
    if (cancelConfirmed) {
      toast.success("Stream cancelled");
      refetch();
    }
  }, [cancelConfirmed, refetch]);

  useEffect(() => {
    if (!stream) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [stream, refetch]);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    setCancelling(true);
    cancelStream(BigInt(streamId!));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        <AppFooter />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Stream not found</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
        <AppFooter />
      </div>
    );
  }

  const status = stream.status as keyof typeof STATUS;
  const isFinished = isStreamFinished(stream.status, timeRemaining);
  const displayStatus = isFinished && stream.status === 0 ? 2 : stream.status;
  const progressPercent = progress ? Number(progress) / 100 : 0;
  const timeRemainingSeconds = timeRemaining ? Number(timeRemaining) : 0;
  const isCreator = address?.toLowerCase() === stream.creator.toLowerCase();
  const isBeneficiary = address?.toLowerCase() === stream.beneficiary.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-mono-display text-3xl font-bold text-foreground tracking-tighter">
                STREAM #{streamId}
              </h1>
              <Badge className={`${STATUS_COLORS[displayStatus]} text-white`}>{STATUS[displayStatus]}</Badge>
            </div>
            <p className="text-muted-foreground">Token Stream Details</p>
          </div>
          <div className="flex items-center gap-2">
            <img src={USDC_LOGO} alt="USDC" className="w-6 h-6 rounded-full" />
            <span className="font-mono-display text-2xl text-foreground">
              {formatUSDC(stream.totalAmount)}
            </span>
            <span className="text-muted-foreground">{USDC_SYMBOL}</span>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{progressPercent.toFixed(2)}%</span>
                  <span>{formatTime(timeRemainingSeconds)} remaining</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="label-micro mb-1">Streamed</p>
                  <p className="font-mono-display text-primary">
                    {streamed ? formatUSDC(streamed) : "0.00"} {USDC_SYMBOL}
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">Claimed</p>
                  <p className="font-mono-display">
                    {formatUSDC(stream.claimed)} {USDC_SYMBOL}
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">Claimable Now</p>
                  <p className="font-mono-display text-green-500">
                    {claimable ? formatUSDC(claimable) : "0.00"} {USDC_SYMBOL}
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">Still Locked</p>
                  <p className="font-mono-display">
                    {remaining ? formatUSDC(remaining) : "0.00"} {USDC_SYMBOL}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unlock Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="label-micro mb-1">Frequency</p>
                  <p className="font-mono-display text-lg">
                    {getIntervalLabel(stream.interval)}
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">Amount Per Unlock</p>
                  <p className="font-mono-display text-lg text-primary">
                    {formatUSDC(getPerUnlockAmount(stream.totalAmount, stream.duration, stream.interval))} USDC
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">Next Unlock In</p>
                  <p className="font-mono-display text-lg text-green-500">
                    {!isFinished ? (timeRemaining !== undefined && timeRemaining === 0n ? "Fully unlocked" : formatTime(nextUnlock)) : "-"}
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">Intervals</p>
                  <p className="font-mono-display text-lg">
                    {getIntervalsCompleted(stream.startTime, stream.interval).toString()} / {getTotalIntervals(stream.duration, stream.interval).toString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="label-micro mb-1">Creator</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm">{truncateAddress(stream.creator)}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(stream.creator);
                        toast.success("Address copied");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="label-micro mb-1">Beneficiary</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm">{truncateAddress(stream.beneficiary)}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(stream.beneficiary);
                        toast.success("Address copied");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="label-micro mb-1">Start Time</p>
                  <p className="font-mono text-sm">{formatDate(stream.startTime)}</p>
                </div>
                <div>
                  <p className="label-micro mb-1">End Time</p>
                  <p className="font-mono text-sm">
                    {endTime ? formatDate(endTime) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="label-micro mb-1">Duration</p>
                  <p className="font-mono text-sm">{formatTime(Number(stream.duration))}</p>
                  <p className="text-xs text-muted-foreground">{getIntervalLabel(stream.interval)}</p>
                </div>
                <div>
                  <p className="label-micro mb-1">Total Amount</p>
                  <p className="font-mono text-sm flex items-center gap-1">
                    <img src={USDC_LOGO} alt="USDC" className="w-4 h-4 rounded-full" />
                    {formatUSDC(stream.totalAmount)} {USDC_SYMBOL}
                  </p>
                </div>
                {stream.accPausedDuration && Number(stream.accPausedDuration) > 0 && (
                  <div>
                    <p className="label-micro mb-1">Total Paused Time</p>
                    <p className="font-mono text-sm">{formatTime(Number(stream.accPausedDuration))}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {isCreator && !isFinished && status === 0 && (
                  <Button
                    onClick={() => pauseStream(BigInt(streamId!))}
                    disabled={isPausing}
                    variant="outline"
                  >
                    {isPausing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Pause className="w-4 h-4 mr-2" />
                    )}
                    Pause Stream
                  </Button>
                )}
                {isCreator && !isFinished && status === 1 && (
                  <>
                    <Button
                      onClick={() => resumeStream(BigInt(streamId!))}
                      disabled={isResuming}
                      variant="outline"
                    >
                      {isResuming ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Resume Stream
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={isCancelling || cancelling}
                      variant="destructive"
                    >
                      {isCancelling || cancelling ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Cancel Stream
                    </Button>
                  </>
                )}

                {isBeneficiary && !isFinished && (
                  <>
                    {claimable && Number(claimable) > 0 ? (
                      <Button
                        onClick={() => claim(BigInt(streamId!))}
                        disabled={isClaiming}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isClaiming ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <DollarSign className="w-4 h-4 mr-2" />
                        )}
                        Claim {formatUSDC(claimable)} {USDC_SYMBOL}
                      </Button>
                    ) : (
                      <Button disabled>
                        <Clock className="w-4 h-4 mr-2" />
                        Nothing to claim yet
                      </Button>
                    )}
                  </>
                )}

                {!isCreator && !isBeneficiary && (
                  <p className="text-muted-foreground text-sm">
                    Connect as creator or beneficiary to perform actions
                  </p>
                )}

                {status === 2 && (
                  <p className="text-green-500 text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Stream completed - all funds have been streamed
                  </p>
                )}

                {status === 3 && (
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Stream was cancelled
                  </p>
                )}

                {status === 1 && !isCreator && (
                  <p className="text-yellow-500 text-sm flex items-center gap-2">
                    <Pause className="w-4 h-4" />
                    Stream is paused by creator
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-card border rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Cancel Stream #{streamId}</h3>
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
                onClick={confirmCancel}
                disabled={isCancelling || cancelling}
              >
                {(isCancelling || cancelling) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Cancel Stream
              </Button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
