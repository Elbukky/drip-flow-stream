interface VaultProgressProps {
  total: number;
  streamed: number;
  claimed: number;
}

const VaultProgress = ({ total, streamed, claimed }: VaultProgressProps) => {
  const streamedPct = total > 0 ? (streamed / total) * 100 : 0;
  const claimedPct = total > 0 ? (claimed / total) * 100 : 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="label-micro mb-4">[ VAULT_LEVEL ]</div>

      <div className="flex-1 flex gap-4">
        {/* Vertical tank */}
        <div className="w-16 bg-secondary border border-border rounded-sm relative overflow-hidden flex-shrink-0">
          {/* Remaining (fills from bottom) */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-1000"
            style={{ height: `${100 - streamedPct}%` }}
          />
          {/* Claimed portion */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-300"
            style={{ height: `${claimedPct}%`, opacity: 0.4 }}
          />
          {/* Level markers */}
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="absolute left-0 right-0 border-t border-border/50"
              style={{ bottom: `${mark}%` }}
            >
              <span className="absolute -right-1 -top-2 text-[8px] text-muted-foreground font-mono-display">
                {mark}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between py-1 flex-1">
          <div>
            <div className="label-micro mb-1">CAPACITY</div>
            <div className="font-mono-display text-lg text-foreground">{total.toLocaleString()} USDC</div>
          </div>
          <div>
            <div className="label-micro mb-1">DISPENSED</div>
            <div className="font-mono-display text-lg text-primary">{streamed.toFixed(2)} USDC</div>
          </div>
          <div>
            <div className="label-micro mb-1">CLAIMED</div>
            <div className="font-mono-display text-lg text-accent">{claimed.toFixed(2)} USDC</div>
          </div>
          <div>
            <div className="label-micro mb-1">IN_VAULT</div>
            <div className="font-mono-display text-lg text-foreground">
              {(total - streamed).toFixed(2)} USDC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultProgress;
