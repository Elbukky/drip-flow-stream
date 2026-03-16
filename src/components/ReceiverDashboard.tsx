import { motion } from "framer-motion";

interface ReceiverDashboardProps {
  availableToClaim: number;
  totalStreamed: number;
  totalClaimed: number;
  dripRate: number;
  interval: "second" | "minute";
  isActive: boolean;
  onClaim: () => void;
}

const ReceiverDashboard = ({
  availableToClaim,
  totalStreamed,
  totalClaimed,
  dripRate,
  interval,
  isActive,
  onClaim,
}: ReceiverDashboardProps) => {
  return (
    <div className="panel">
      <div className="label-micro mb-6">[ RECEIVER_TERMINAL ] CLAIM FUNDS</div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-0 border border-border">
          <div className="p-4 border-r border-border">
            <div className="label-micro mb-2">TOTAL_STREAMED</div>
            <div className="stream-value">{totalStreamed.toFixed(6)}</div>
          </div>
          <div className="p-4">
            <div className="label-micro mb-2">TOTAL_CLAIMED</div>
            <div className="stream-value">{totalClaimed.toFixed(6)}</div>
          </div>
        </div>

        <div className="border border-border p-4">
          <div className="label-micro mb-2">AVAILABLE_NOW</div>
          <div className="font-mono-display text-3xl text-primary">
            {availableToClaim.toFixed(6)}
            <span className="text-sm text-muted-foreground ml-2">USDC</span>
          </div>
        </div>

        <div className="border border-border p-4">
          <div className="label-micro mb-2">STREAM_RATE</div>
          <div className="font-mono-display text-lg text-accent">
            {dripRate.toFixed(6)} USDC / {interval === "second" ? "SEC" : "MIN"}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          onClick={onClaim}
          disabled={!isActive || availableToClaim <= 0}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          [ CLAIM_FUNDS ] {availableToClaim > 0 ? `${availableToClaim.toFixed(4)} USDC` : "0.0000 USDC"}
        </motion.button>
      </div>
    </div>
  );
};

export default ReceiverDashboard;
