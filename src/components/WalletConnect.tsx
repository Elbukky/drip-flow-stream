import { useState } from "react";
import { motion } from "framer-motion";

interface WalletConnectProps {
  onConnect: (address: string) => void;
  connected: boolean;
  address: string;
}

const WalletConnect = ({ onConnect, connected, address }: WalletConnectProps) => {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = "0x" + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      onConnect(mockAddress);
      setConnecting(false);
    }, 1200);
  };

  const truncate = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex items-center gap-4">
      {connected ? (
        <div className="flex items-center gap-3 border border-border px-4 py-2 bg-secondary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="font-mono-display text-sm text-foreground">{truncate(address)}</span>
          <span className="label-micro">CONNECTED</span>
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          onClick={handleConnect}
          disabled={connecting}
          className="btn-primary"
        >
          {connecting ? "[ CONNECTING... ]" : "[ CONNECT_WALLET ]"}
        </motion.button>
      )}
    </div>
  );
};

export default WalletConnect;
