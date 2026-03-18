import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { USDC_LOGO } from "@/lib/contracts";

export function WalletDisplay() {
  const { isConnected } = useAccount();
  const { address } = useAccount();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const formatBalance = (val: bigint | undefined, decimals: number) => {
    if (!val) return "0";
    const num = Number(val) / Math.pow(10, decimals);
    if (isNaN(num)) return "0";
    return num.toFixed(4);
  };

  return (
    <ConnectButton
      accountStatus={isConnected ? "address" : "full"}
      chainStatus="full"
      showBalance={false}
    />
  );
}
