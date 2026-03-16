import { useState } from "react";
import { motion } from "framer-motion";

interface PayerDashboardProps {
  onInitialize: (config: { amount: number; interval: "second" | "minute"; duration: number; receiver: string }) => void;
  isActive: boolean;
}

const PayerDashboard = ({ onInitialize, isActive }: PayerDashboardProps) => {
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState<"second" | "minute">("second");
  const [duration, setDuration] = useState("");
  const [receiver, setReceiver] = useState("");

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    const dur = parseInt(duration);
    if (amt > 0 && dur > 0 && receiver.trim()) {
      onInitialize({ amount: amt, interval, duration: dur, receiver: receiver.trim() });
    }
  };

  const dripRate = amount && duration
    ? interval === "second"
      ? parseFloat(amount) / (parseInt(duration) * 86400)
      : parseFloat(amount) / (parseInt(duration) * 1440)
    : 0;

  return (
    <div className="panel">
      <div className="label-micro mb-6">[ PAYER_CONTROLS ] INITIALIZE VAULT</div>

      <div className="space-y-5">
        <div>
          <label className="label-micro mb-2 block">DESTINATION_WALLET</label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder="0x..."
            disabled={isActive}
            className="w-full bg-secondary border border-border px-4 py-3 font-mono-display text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary rounded-none disabled:opacity-40"
          />
        </div>

        <div>
          <label className="label-micro mb-2 block">TOTAL_AMOUNT (USDC)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            disabled={isActive}
            className="w-full bg-secondary border border-border px-4 py-3 font-mono-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary rounded-none disabled:opacity-40"
          />
        </div>

        <div>
          <label className="label-micro mb-2 block">DRIP_INTERVAL</label>
          <div className="flex gap-0">
            <button
              onClick={() => setInterval("second")}
              disabled={isActive}
              className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest border transition-colors duration-150 rounded-none ${
                interval === "second"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              } disabled:opacity-40`}
            >
              PER SECOND
            </button>
            <button
              onClick={() => setInterval("minute")}
              disabled={isActive}
              className={`flex-1 py-3 font-bold text-xs uppercase tracking-widest border border-l-0 transition-colors duration-150 rounded-none ${
                interval === "minute"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              } disabled:opacity-40`}
            >
              PER MINUTE
            </button>
          </div>
        </div>

        <div>
          <label className="label-micro mb-2 block">DURATION (DAYS)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
            disabled={isActive}
            className="w-full bg-secondary border border-border px-4 py-3 font-mono-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary rounded-none disabled:opacity-40"
          />
        </div>

        {dripRate > 0 && (
          <div className="border border-border p-4">
            <div className="label-micro mb-2">CALCULATED_RATE</div>
            <div className="font-mono-display text-primary text-lg">
              {dripRate.toFixed(6)} USDC / {interval === "second" ? "SEC" : "MIN"}
            </div>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          onClick={handleSubmit}
          disabled={isActive || !amount || !duration || !receiver.trim()}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isActive ? "[ VAULT_ACTIVE ]" : "[ INITIALIZE_VAULT ]"}
        </motion.button>
      </div>
    </div>
  );
};

export default PayerDashboard;
