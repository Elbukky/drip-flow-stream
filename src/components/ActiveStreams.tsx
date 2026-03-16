import { motion } from "framer-motion";

export interface Stream {
  id: string;
  sender: string;
  totalAmount: number;
  dripPerSecond: number;
  interval: "second" | "minute";
  availableToClaim: number;
  totalStreamed: number;
  totalClaimed: number;
  isActive: boolean;
}

interface ActiveStreamsProps {
  streams: Stream[];
  onClaim: (streamId: string) => void;
}

const truncate = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

const ActiveStreams = ({ streams, onClaim }: ActiveStreamsProps) => {
  return (
    <div className="panel">
      <div className="label-micro mb-4">[ ACTIVE_STREAMS ] INCOMING DRIPS</div>

      {streams.length === 0 ? (
        <div className="text-muted-foreground font-mono-display text-sm py-8 text-center">
          NO_ACTIVE_STREAMS
        </div>
      ) : (
        <div className="space-y-0">
          {streams.map((stream) => (
            <div
              key={stream.id}
              className="border border-border p-4 mb-[-1px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-mono-display text-xs text-muted-foreground">
                    FROM: {truncate(stream.sender)}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                  stream.isActive
                    ? "text-primary border-primary/30 bg-primary/10"
                    : "text-muted-foreground border-border bg-secondary"
                }`}>
                  {stream.isActive ? "LIVE" : "ENDED"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-0 border border-border mb-3">
                <div className="p-2 border-r border-border">
                  <div className="label-micro mb-1">FUNDED</div>
                  <div className="font-mono-display text-sm text-foreground">
                    {stream.totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 border-r border-border">
                  <div className="label-micro mb-1">STREAMED</div>
                  <div className="font-mono-display text-sm text-primary">
                    {stream.totalStreamed.toFixed(4)}
                  </div>
                </div>
                <div className="p-2">
                  <div className="label-micro mb-1">CLAIMED</div>
                  <div className="font-mono-display text-sm text-accent">
                    {stream.totalClaimed.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="label-micro mb-1">AVAILABLE</div>
                  <div className="font-mono-display text-lg text-primary">
                    {stream.availableToClaim.toFixed(6)}
                    <span className="text-xs text-muted-foreground ml-1">USDC</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  onClick={() => onClaim(stream.id)}
                  disabled={!stream.isActive || stream.availableToClaim <= 0}
                  className="btn-primary text-[10px] py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  [ CLAIM ]
                </motion.button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="label-micro">RATE:</div>
                <div className="font-mono-display text-xs text-accent">
                  {stream.dripPerSecond.toFixed(6)} USDC / {stream.interval === "second" ? "SEC" : "MIN"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveStreams;
