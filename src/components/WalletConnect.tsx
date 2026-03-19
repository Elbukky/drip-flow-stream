import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";

const WalletConnect = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
            aria-hidden={!ready}
          >
            {connected ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 16px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--secondary))",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "hsl(var(--primary))",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                />
                <button
                  onClick={openAccountModal}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    color: "hsl(var(--foreground))",
                    cursor: "pointer",
                  }}
                >
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ""}
                </button>
                <button
                  onClick={openChainModal}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 8px",
                    background: "hsl(var(--accent))",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "hsl(var(--accent-foreground))",
                    cursor: "pointer",
                  }}
                >
                  {chain.hasIcon && (
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {chain.iconUrl && (
                        <img
                          src={chain.iconUrl}
                          alt={chain.name}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      )}
                    </div>
                  )}
                  {chain.name}
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={openConnectModal}
                className="btn-primary"
              >
                [ CONNECT_WALLET ]
              </motion.button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletConnect;
