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
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="btn-primary"
                  >
                    [ CONNECT_WALLET ]
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="btn-primary"
                  >
                    [ WRONG_NETWORK ]
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-muted border border-border transition-colors"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="font-mono text-xs">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-muted border border-border transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-mono text-xs">
                      {account.displayBalance && balance ? (
                        <>{formatBalance(balance.value, balance.decimals)} {balance.symbol}</>
                      ) : (
                        <>{account.displayName}</>
                      )}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
