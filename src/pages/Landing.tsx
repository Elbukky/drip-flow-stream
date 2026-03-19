import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProtocolSummary, useTokenStats } from "@/hooks/useTokenStream";
import { formatUSDCCompact } from "@/lib/contracts";
import { useEffect, useState } from "react";

const LOGO = "/logo.png";

const features = [
  {
    title: "REAL-TIME DRIPS",
    desc: "Funds stream every second directly from the vault. No batching, no delays.",
    icon: "◉",
  },
  {
    title: "PAYER CONTROLS",
    desc: "Set total amount, drip interval, duration, and destination wallet in one transaction.",
    icon: "⬡",
  },
  {
    title: "INSTANT CLAIMS",
    desc: "Receivers claim accumulated funds anytime. No approval needed.",
    icon: "△",
  },
  {
    title: "VAULT SECURITY",
    desc: "Funds locked in smart contract vaults. Transparent, auditable, immutable.",
    icon: "◇",
  },
];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const HeroParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 20 + 10,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            y: [-20, 20],
            opacity: [particle.opacity * 0.5, particle.opacity],
          }}
          transition={{
            duration: particle.speed,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { data: protocolSummary } = useProtocolSummary();
  const { data: tokenStats } = useTokenStats();
  const [dotVisible, setDotVisible] = useState(true);

  const totalStreams = protocolSummary ? Number(protocolSummary.totalStreams) : 0;
  const activeStreams = protocolSummary ? Number(protocolSummary.active) : 0;
  const totalDeposited = tokenStats ? tokenStats.totalDeposited : 0n;

  useEffect(() => {
    const interval = setInterval(() => {
      setDotVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={LOGO} alt="DripFlow" className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="font-mono-display text-xl text-primary font-bold tracking-tighter">
              DRIP<span className="text-foreground">FLOW</span>
            </h1>
            <span className="label-micro mt-1 hidden sm:block">PROTOCOL</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/app")}
            className="btn-primary text-[10px] sm:text-xs py-2 sm:py-4 px-3 sm:px-6 whitespace-nowrap min-w-fit"
          >
            [ LAUNCH_APP ]
          </motion.button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border relative overflow-hidden">
        {/* Gradient background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 30% 20%, rgba(249, 115, 22, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)",
          }}
        />
        
        {/* Particles */}
        <HeroParticles />

        <div className="max-w-[1400px] mx-auto px-6 py-24 lg:py-32 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="label-micro mb-6 flex items-center gap-2">
                <span 
                  className="inline-block w-2 h-2 rounded-full bg-primary transition-opacity duration-200"
                  style={{ opacity: dotVisible ? 1 : 0.3 }}
                />
                [ MONEY_STREAMING_PROTOCOL ]
              </div>
              <h2 className="font-mono-display text-5xl lg:text-7xl text-foreground font-bold tracking-tighter leading-[0.9] mb-6">
                CAPITAL IN<br />
                <span className="text-primary">FLOW STATE</span>
                <span className="text-primary">.</span>
              </h2>
              <p className="text-muted-foreground text-lg lg:text-xl leading-relaxed max-w-xl mb-10">
                Stream payments in bits on-chain. Fund a vault, set the drip rate,
                and let the protocol handle continuous distribution.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app")}
                className="btn-primary text-sm py-5 px-10"
              >
                [ START_STREAMING ]
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/docs")}
                className="btn-secondary text-sm py-5 px-10"
              >
                [ READ_DOCS ]
              </motion.button>
            </motion.div>

            {/* Live rate ticker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-16 border border-border p-6 inline-flex gap-12"
            >
              <div>
                <div className="label-micro mb-2">LIVE_SAMPLE_RATE</div>
                <div className="font-mono-display text-3xl text-primary">
                  0.01 <span className="text-muted-foreground text-lg">USDC / SEC</span>
                </div>
              </div>
              <div>
                <div className="label-micro mb-2">STREAM_DURATION</div>
                <div className="font-mono-display text-3xl text-primary">
                  2 <span className="text-muted-foreground text-lg">MONTHS</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            viewport={{ once: true }}
            className="p-8 border-r border-border"
          >
            <div className="font-mono-display text-3xl lg:text-4xl text-primary font-bold mb-2">
              {formatUSDCCompact(totalDeposited)}
            </div>
            <div className="label-micro">TOTAL_STREAMED</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="p-8 border-r border-border"
          >
            <div className="font-mono-display text-3xl lg:text-4xl text-primary font-bold mb-2">
              {activeStreams.toLocaleString()}
            </div>
            <div className="label-micro">ACTIVE_STREAMS</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="p-8 border-r border-border"
          >
            <div className="font-mono-display text-3xl lg:text-4xl text-primary font-bold mb-2">
              {totalStreams.toLocaleString()}
            </div>
            <div className="label-micro">TOTAL_STREAMS</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="p-8"
          >
            <div className="font-mono-display text-3xl lg:text-4xl text-primary font-bold mb-2">
              {protocolSummary ? Number(protocolSummary.uniqueCreators) : 0}
            </div>
            <div className="label-micro">CREATORS</div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-20">
          <div className="label-micro mb-12">[ PROTOCOL_FEATURES ]</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 ${i % 2 === 0 ? "md:border-r border-border" : ""} ${i < 2 ? "border-b border-border" : ""}`}
              >
                <div className="font-mono-display text-3xl text-primary mb-4">{f.icon}</div>
                <h3 className="font-mono-display text-lg text-foreground font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-20">
          <div className="label-micro mb-12">[ HOW_IT_WORKS ]</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border">
            {[
              { step: "01", title: "FUND VAULT", desc: "Deposit USDC and set total payment amount, receiver wallet, and drip schedule." },
              { step: "02", title: "STREAM BEGINS", desc: "Funds drip per-second or per-minute from vault to receiver automatically." },
              { step: "03", title: "CLAIM ANYTIME", desc: "Receiver claims accumulated funds at any time with a single click." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`p-8 ${i < 2 ? "md:border-r border-border" : ""}`}
              >
                <div className="font-mono-display text-5xl text-primary/20 font-bold mb-4">{item.step}</div>
                <h3 className="font-mono-display text-foreground font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border bg-card">
        <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
          <h2 className="font-mono-display text-3xl lg:text-4xl text-foreground font-bold tracking-tighter mb-4">
            READY TO <span className="text-primary">STREAM</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Connect your wallet and start streaming payments in seconds.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/app")}
            className="btn-primary text-xs sm:text-sm py-3 sm:py-5 px-6 sm:px-12"
          >
            [ LAUNCH_APP ]
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between">
          <span className="label-micro">DRIPFLOW PROTOCOL</span>
          <span className="font-mono-display text-xs text-muted-foreground">
            © 2026 DRIPFLOW
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
