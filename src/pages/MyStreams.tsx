import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import {
  useCreatorStreams,
  useCreatorSummary,
  useCreatorStatusBreakdown,
  useCreatorVolumeByToken,
  useUserStreams,
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Copy, ExternalLink, Pause, Play, XCircle, DollarSign, Clock } from "lucide-react";
import {
  USDC_LOGO,
  STATUS,
  STATUS_COLORS,
  formatUSDC,
  formatTime,
  truncateAddress,
  getExplorerUrl,
  getStreamUrl,
  type Stream,
} from "@/lib/contracts";

const PAGE_SIZE = 20;

export default function MyStreamsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-mono-display text-3xl font-bold text-foreground tracking-tighter mb-2">
            MY STREAMS
          </h1>
          <p className="text-muted-foreground">
            Manage your created streams and view incoming streams.
          </p>
        </div>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="created">Streams I Created</TabsTrigger>
            <TabsTrigger value="receiving">Streams I Receive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="created">
            <CreatorStreams />
          </TabsContent>
          
          <TabsContent value="receiving">
            <BeneficiaryStreams />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CreatorStreams() {
  const { address, isConnected } = useAccount();
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data: summary } = useCreatorSummary(address);
  const { data: breakdown } = useCreatorStatusBreakdown(address);
  const { data: volume } = useCreatorVolumeByToken(address);
  const { data: streamsResult, refetch } = useCreatorStreams(address!, page * PAGE_SIZE, PAGE_SIZE, statusFilter);

  useEffect(() => {
    if (streamsResult) {
      const [streamIds] = streamsResult;
      if (page === 0) {
        setStreams([]);
      }
      
      streamIds.forEach(async (streamId) => {
        const { useStream } = await import("@/hooks/useTokenStream");
        // We'll handle this differently
      });

      setHasMore(streamIds.length === PAGE_SIZE);
    }
  }, [streamsResult, page]);

  const loadStreams = useCallback(async () => {
    if (!streamsResult || !address) return;
    
    const [streamIds] = streamsResult;
    if (streamIds.length === 0) {
      setStreams([]);
      return;
    }

    const newStreams: Stream[] = [];
    for (const streamId of streamIds) {
      try {
        const response = await fetch(`/api/streams/${streamId}`);
        // For now, we'll just use the raw data
      } catch (e) {
        // Handle error
      }
    }
  }, [streamsResult, address]);

  if (!isConnected) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Connect your wallet to view your streams</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <SummaryCard label="Total Created" value={summary ? Number(summary[0]).toLocaleString() : "0"} />
        <SummaryCard label="Active" value={breakdown ? Number(breakdown[0]).toLocaleString() : "0"} highlight />
        <SummaryCard label="Paused" value={breakdown ? Number(breakdown[1]).toLocaleString() : "0"} />
        <SummaryCard label="Completed" value={breakdown ? Number(breakdown[2]).toLocaleString() : "0"} />
        <SummaryCard label="Cancelled" value={breakdown ? Number(breakdown[3]).toLocaleString() : "0"} />
        <SummaryCard 
          label="USDC Deposited" 
          value={volume ? formatUSDC(volume[0]) : "0"} 
          icon={<USDCLogoSmall />}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <FilterButton active={statusFilter === undefined} onClick={() => { setStatusFilter(undefined); setPage(0); }}>
          All
        </FilterButton>
        <FilterButton active={statusFilter === 0} onClick={() => { setStatusFilter(0); setPage(0); }}>
          Active
        </FilterButton>
        <FilterButton active={statusFilter === 1} onClick={() => { setStatusFilter(1); setPage(0); }}>
          Paused
        </FilterButton>
        <FilterButton active={statusFilter === 2} onClick={() => { setStatusFilter(2); setPage(0); }}>
          Completed
        </FilterButton>
        <FilterButton active={statusFilter === 3} onClick={() => { setStatusFilter(3); setPage(0); }}>
          Cancelled
        </FilterButton>
      </div>

      <CreatorStreamList
        address={address!}
        statusFilter={statusFilter}
        page={page}
        setPage={setPage}
        hasMore={hasMore}
      />

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(p => p + 1)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function CreatorStreamList({
  address,
  statusFilter,
  page,
  setPage,
  hasMore,
}: {
  address: `0x${string}`;
  statusFilter: number | undefined;
  page: number;
  setPage: (page: number) => void;
  hasMore: boolean;
}) {
  const { data: streamsResult, isLoading } = useCreatorStreams(address, page * PAGE_SIZE, PAGE_SIZE, statusFilter);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [streamClaimables, setStreamClaimables] = useState<Record<string, bigint>>({});
  const [streamProgress, setStreamProgress] = useState<Record<string, bigint>>({});
  const [streamTimeRemaining, setStreamTimeRemaining] = useState<Record<string, bigint>>({});
  const { pauseStream, isPending: isPausing } = usePauseStream();
  const { resumeStream, isPending: isResuming } = useResumeStream();
  const { cancelStream, isPending: isCancelling } = useCancelStream();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!streamsResult) return;
    const [streamIds] = streamsResult;
    
    if (streamIds.length === 0) {
      setStreams([]);
      return;
    }

    const loadStreamData = async () => {
      const loadedStreams: Stream[] = [];
      const claimables: Record<string, bigint> = {};
      const progress: Record<string, bigint> = {};
      const timeRemaining: Record<string, bigint> = {};

      for (const streamId of streamIds) {
        try {
          const response = await fetch(`https://api.arcblock.io/api/tokenstream/${streamId}`);
          if (response.ok) {
            const data = await response.json();
            loadedStreams.push(data);
            claimables[streamId.toString()] = BigInt(data.claimable || 0);
            progress[streamId.toString()] = BigInt(data.progress || 0);
            timeRemaining[streamId.toString()] = BigInt(data.timeRemaining || 0);
          }
        } catch (e) {
          console.error("Failed to load stream:", streamId, e);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setStreams(loadedStreams as any);
      setStreamClaimables(claimables);
      setStreamProgress(progress);
      setStreamTimeRemaining(timeRemaining);
    };

    loadStreamData();
  }, [streamsResult]);

  const handleCancel = async (streamId: bigint) => {
    if (!confirm("Are you sure you want to cancel this stream? Funds will be distributed.")) {
      return;
    }
    setCancellingId(streamId.toString());
    cancelStream(streamId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No streams found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {streams.map((stream) => {
        const streamId = stream.streamId.toString();
        const status = stream.status as keyof typeof STATUS;
        const progress = Number(streamProgress[streamId] || 0) / 100;
        const claimable = streamClaimables[streamId];
        const timeRemaining = Number(streamTimeRemaining[streamId] || 0);

        return (
          <Card key={streamId} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6" onClick={() => navigate(getStreamUrl(streamId))}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-display text-sm text-muted-foreground">Stream #{streamId}</span>
                    <Badge className={STATUS_COLORS[status]}>{STATUS[status]}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-2">
                  <img src={USDC_LOGO} alt="USDC" className="w-5 h-5" />
                  <span className="font-mono-display text-lg text-foreground">
                    {formatUSDC(stream.totalAmount)}
                  </span>
                  <span className="text-sm text-muted-foreground">USDC</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex justify-between text-sm text-muted-foreground mb-4">
                <span>Streamed: {formatUSDC(stream.claimed)} / {formatUSDC(stream.totalAmount)}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(timeRemaining)} remaining
                </span>
              </div>

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {status === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseStream(stream.streamId)}
                    disabled={isPausing}
                  >
                    <Pause className="w-3 h-3 mr-1" /> Pause
                  </Button>
                )}
                {status === 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resumeStream(stream.streamId)}
                    disabled={isResuming}
                  >
                    <Play className="w-3 h-3 mr-1" /> Resume
                  </Button>
                )}
                {(status === 0 || status === 1) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleCancel(stream.streamId)}
                    disabled={isCancelling || cancellingId === streamId}
                  >
                    <XCircle className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function BeneficiaryStreams() {
  const { address, isConnected } = useAccount();
  const [page, setPage] = useState(0);
  const [claimablePolling, setClaimablePolling] = useState<Record<string, bigint>>({});

  const { data: summary } = useBeneficiarySummary(address);
  const { data: breakdown } = useBeneficiaryTokenBreakdown(address);
  const { data: expiringResult } = useExpiringStreams(address!, 604800, 0, 5);
  const { data: streamsResult } = useUserStreams(address!, page * PAGE_SIZE, PAGE_SIZE);

  useEffect(() => {
    if (!streamsResult) return;
    const [streamIds] = streamsResult;
    
    if (streamIds.length === 0) return;

    const pollClaimables = async () => {
      const newClaimables: Record<string, bigint> = {};
      for (const streamId of streamIds) {
        try {
          const response = await fetch(`https://api.arcblock.io/api/tokenstream/${streamId}/claimable`);
          if (response.ok) {
            const data = await response.json();
            newClaimables[streamId.toString()] = BigInt(data.claimable || 0);
          }
        } catch (e) {
          // Ignore polling errors
        }
      }
      setClaimablePolling(newClaimables);
    };

    pollClaimables();
    const interval = setInterval(pollClaimables, 10000);
    return () => clearInterval(interval);
  }, [streamsResult]);

  if (!isConnected) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Connect your wallet to view incoming streams</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Receiving" value={summary ? Number(summary[0]).toLocaleString() : "0"} />
        <SummaryCard label="Active" value={summary ? Number(summary[1]).toLocaleString() : "0"} highlight />
        <SummaryCard label="Completed" value={summary ? Number(summary[2]).toLocaleString() : "0"} />
        <SummaryCard 
          label="Claimable Now" 
          value={summary ? formatUSDC(summary[3]) : "0"} 
          icon={<USDCLogoSmall />}
          highlight
          green
        />
      </div>

      {breakdown && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="label-micro mb-1">Claimed</p>
                <p className="font-mono-display text-primary">{formatUSDC(breakdown[0])}</p>
              </div>
              <div>
                <p className="label-micro mb-1">Pending Now</p>
                <p className="font-mono-display text-green-500">{formatUSDC(breakdown[1])}</p>
              </div>
              <div>
                <p className="label-micro mb-1">Still Locked</p>
                <p className="font-mono-display">{formatUSDC(breakdown[2])}</p>
              </div>
              <div>
                <p className="label-micro mb-1">Total Expected</p>
                <p className="font-mono-display">{formatUSDC(breakdown[3])}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {expiringResult && expiringResult[0].length > 0 && (
        <Card className="border-yellow-600/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringResult[0].map((streamId) => (
                <div key={streamId.toString()} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Stream #{streamId.toString()}</span>
                  <a
                    href={getStreamUrl(streamId.toString())}
                    className="text-primary hover:underline"
                  >
                    View Details
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <BeneficiaryStreamList
        address={address!}
        page={page}
        setPage={setPage}
        claimablePolling={claimablePolling}
      />
    </div>
  );
}

function BeneficiaryStreamList({
  address,
  page,
  setPage,
  claimablePolling,
}: {
  address: `0x${string}`;
  page: number;
  setPage: (page: number) => void;
  claimablePolling: Record<string, bigint>;
}) {
  const { data: streamsResult, isLoading } = useUserStreams(address, page * PAGE_SIZE, PAGE_SIZE);
  const [streams, setStreams] = useState<Stream[]>([]);
  const { claim, isPending: isClaiming, isConfirmed } = useClaim();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Tokens claimed successfully!");
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (!streamsResult) return;
    const [streamIds] = streamsResult;
    
    if (streamIds.length === 0) {
      setStreams([]);
      return;
    }

    const loadStreamData = async () => {
      const loadedStreams: Stream[] = [];
      for (const streamId of streamIds) {
        try {
          const response = await fetch(`https://api.arcblock.io/api/tokenstream/${streamId}`);
          if (response.ok) {
            const data = await response.json();
            loadedStreams.push(data);
          }
        } catch (e) {
          console.error("Failed to load stream:", streamId, e);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setStreams(loadedStreams as any);
    };

    loadStreamData();
  }, [streamsResult]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No incoming streams</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {streams.map((stream) => {
        const streamId = stream.streamId.toString();
        const status = stream.status as keyof typeof STATUS;

        return (
          <Card key={streamId} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6" onClick={() => navigate(getStreamUrl(streamId))}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono-display text-sm text-muted-foreground">Stream #{streamId}</span>
                    <Badge className={STATUS_COLORS[status]}>{STATUS[status]}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-2">
                  <img src={USDC_LOGO} alt="USDC" className="w-5 h-5" />
                  <span className="font-mono-display text-lg text-foreground">
                    {formatUSDC(stream.totalAmount)}
                  </span>
                  <span className="text-sm text-muted-foreground">USDC</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Claimed</span>
                  <span>{formatUSDC(stream.claimed)} / {formatUSDC(stream.totalAmount)}</span>
                </div>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                {status === 1 && (
                  <Badge variant="secondary">Paused by Creator</Badge>
                )}
                {status === 2 && (
                  <Badge variant="secondary">Fully Streamed</Badge>
                )}
                {status === 3 && (
                  <Badge variant="destructive">Cancelled</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {streams.length === PAGE_SIZE && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(page + 1)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  highlight,
  green,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  green?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="label-micro mb-1">{label}</p>
        <div className="flex items-center gap-2">
          {icon && <span className="w-4 h-4">{icon}</span>}
          <span className={`font-mono-display text-lg ${green ? "text-green-500" : highlight ? "text-primary" : "text-foreground"}`}>
            {value}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={active ? "bg-primary" : ""}
    >
      {children}
    </Button>
  );
}

function USDCLogoSmall() {
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
