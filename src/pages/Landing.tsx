import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

const stats = [
  { value: "$12.4M", label: "TOTAL_STREAMED" },
  { value: "2,847", label: "ACTIVE_VAULTS" },
  { value: "0.001s", label: "AVG_LATENCY" },
  { value: "99.99%", label: "UPTIME" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-mono-display text-xl text-primary font-bold tracking-tighter">
              DRIP<span className="text-foreground">FLOW</span>
            </h1>
            <span className="label-micro mt-1">PROTOCOL</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/app")}
            className="btn-primary"
          >
            [ LAUNCH_APP ]
          </motion.button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="label-micro mb-6">[ MONEY_STREAMING_PROTOCOL ]</div>
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
              <button className="btn-secondary text-sm py-5 px-10">
                [ READ_DOCS ]
              </button>
            </motion.div>

            {/* Live rate ticker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-16 border border-border p-6 inline-block"
            >
              <div className="label-micro mb-2">LIVE_SAMPLE_RATE</div>
              <div className="font-mono-display text-3xl text-primary">
                4.829301 <span className="text-muted-foreground text-lg">USDC / SEC</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-8 ${i < 3 ? "border-r border-border" : ""}`}
            >
              <div className="font-mono-display text-3xl lg:text-4xl text-primary font-bold mb-2">
                {stat.value}
              </div>
              <div className="label-micro">{stat.label}</div>
            </motion.div>
          ))}
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
            className="btn-primary text-sm py-5 px-12"
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
