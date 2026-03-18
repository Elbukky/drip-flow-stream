import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { USDC_LOGO } from "@/lib/contracts";

export function WalletDisplay() {
  const { address, isConnected } = useAccount();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const formatBalance = (val: bigint | undefined, decimals: number) => {
    if (!val) return "0";
    const num = Number(val) / Math.pow(10, decimals);
    if (isNaN(num)) return "0";
    return num.toFixed(6);
  };

  if (!isConnected) {
    return <ConnectButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded border border-border">
        <img src={USDC_LOGO} alt="USDC" className="w-4 h-4 rounded-full" />
        <span className="font-mono text-sm">
          {formatBalance(balance?.value, balance?.decimals ?? 18)} USDC
        </span>
      </div>
      <ConnectButton />
    </div>
  );
}
