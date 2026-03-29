interface Transaction {
  id: string;
  type: "FUND" | "CLAIM" | "INIT";
  amount: number;
  timestamp: Date;
}

interface TransactionLogProps {
  transactions: Transaction[];
}

const TransactionLog = ({ transactions }: TransactionLogProps) => {
  return (
    <div className="panel">
      <div className="label-micro mb-4">[ TX_LEDGER ] RECENT TRANSACTIONS</div>

      {transactions.length === 0 ? (
        <div className="text-muted-foreground font-mono-display text-sm py-8 text-center">
          NO_TRANSACTIONS_FOUND
        </div>
      ) : (
        <div className="space-y-0">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b border-border py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-none border ${
                    tx.type === "FUND"
                      ? "text-primary border-primary/30 bg-primary/10"
                      : tx.type === "CLAIM"
                      ? "text-accent border-accent/30 bg-accent/10"
                      : "text-muted-foreground border-border bg-secondary"
                  }`}
                >
                  {tx.type}
                </span>
                <span className="font-mono-display text-sm text-muted-foreground">
                  {tx.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <span className="font-mono-display text-sm text-foreground">
                {tx.type === "CLAIM" ? "-" : "+"}{tx.amount.toFixed(4)} USDC
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export type { Transaction };
export default TransactionLog;
