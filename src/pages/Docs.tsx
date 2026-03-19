import { useNavigate } from "react-router-dom";
import { AppHeader, AppFooter } from "@/components/AppLayout";
import { StreamDiagram } from "@/components/StreamDiagram";

const docs = [
  {
    title: "OVERVIEW",
    items: [
      { label: "What is DripFlow?", id: "what" },
      { label: "How It Works", id: "how" },
      { label: "Key Features", id: "features" },
    ]
  },
  {
    title: "CREATE STREAM",
    items: [
      { label: "Single Stream", id: "single" },
      { label: "Multi Stream", id: "multi" },
      { label: "Custom Split", id: "multi-custom" },
      { label: "Interval Settings", id: "interval" },
      { label: "Parameters Explained", id: "params" },
    ]
  },
  {
    title: "MANAGE STREAMS",
    items: [
      { label: "Claim Funds", id: "claim" },
      { label: "Pause Stream", id: "pause" },
      { label: "Resume Stream", id: "resume" },
      { label: "Cancel Stream", id: "cancel" },
    ]
  },
  {
    title: "TECHNICAL",
    items: [
      { label: "Smart Contract", id: "contract" },
      { label: "Security", id: "security" },
      { label: "Gas Optimization", id: "gas" },
    ]
  },
];

const sections = [
  {
    id: "what",
    title: "WHAT IS DRIPFLOW?",
    content: `DripFlow is a linear token streaming protocol that allows creators to stream payments over time. Instead of sending a lump sum, funds unlock continuously based on a configurable schedule.

Unlike traditional payment systems where recipients must wait for specific dates or manually request funds, DripFlow automatically accumulates unlocked tokens that can be claimed at any time.`
  },
  {
    id: "how",
    title: "HOW IT WORKS",
    content: `1. CREATOR deposits tokens into a vault and sets the streaming parameters:
   - Total amount to stream
   - Duration (total streaming period)
   - Interval (how often tokens unlock)

2. STREAM begins immediately. Tokens unlock continuously based on the interval.

3. BENEFICIARY can claim accumulated tokens anytime with a single transaction.

4. STREAM ends when all tokens are fully streamed or the creator cancels.`
  },
  {
    id: "features",
    title: "KEY FEATURES",
    content: `• CONTINUOUS STREAMING - Tokens unlock continuously, not in chunks
• FLEXIBLE INTERVALS - Set unlock frequency from per-second to per-day
• PAUSE/RESUME - Creators can pause and resume streams
• MULTI-STREAM - Distribute to multiple recipients in one transaction
• INSTANT CLAIMS - Beneficiaries claim anytime, no waiting
• ON-CHAIN SECURITY - All logic handled by audited smart contracts`
  },
  {
    id: "single",
    title: "SINGLE STREAM",
    content: `Create a stream to one beneficiary.

Required fields:
• Beneficiary Address - The wallet that will receive tokens
• Amount - Total USDC to stream
• Duration - How long the stream lasts
• Interval - How often tokens unlock

Example: Stream 1000 USDC over 30 days, unlocking every hour.

The beneficiary can claim accumulated tokens at any time.`,
    showDiagram: "single"
  },
  {
    id: "multi",
    title: "MULTI STREAM",
    content: `Distribute tokens to multiple recipients in a single transaction.

Each beneficiary gets their own independent stream with:
• Their own proportional share of the total amount
• The same duration and interval as the parent stream

You can set custom percentages or split evenly.

Example: Stream 10,000 USDC to 5 team members over 12 months.`,
    showDiagram: "multi-even"
  },
  {
    id: "multi-custom",
    title: "CUSTOM SPLIT",
    content: `When creating a multi-stream, you can specify exact percentages for each beneficiary.

The percentages must sum to exactly 100% (10000 basis points).

Example: Team gets 50%, Investor gets 30%, Advisor gets 20%.`,
    showDiagram: "multi-custom"
  },
  {
    id: "interval",
    title: "INTERVAL SETTINGS",
    content: `The interval determines how often tokens unlock:

• Per Second (1) - Maximum granularity, continuous flow
• Per Minute (60) - Good for short streams
• Per Hour (3600) - Standard for day-to-day streams  
• Per Day (86400) - Weekly/monthly distributions

Note: The interval cannot exceed the duration. If you set a 1-hour interval with a 30-minute duration, the stream will complete in one unlock.`
  },
  {
    id: "params",
    title: "PARAMETERS EXPLAINED",
    content: `TOTAL AMOUNT: The exact number of USDC to stream. This is deposited upfront.

DURATION: Total streaming period in seconds. The stream will fully unlock over this time.

INTERVAL: Unlock frequency. Tokens accumulate between intervals and can be claimed anytime.

START TIME: Always immediately upon creation.

END TIME: startTime + duration (pauses don't extend this).`
  },
  {
    id: "claim",
    title: "CLAIM FUNDS",
    content: `Beneficiaries can claim accumulated tokens at any time.

• Click "Claim" on any active stream
• All currently unlocked tokens are sent to your wallet
• Claims can be made as frequently as desired
• No approval needed - tokens are already unlocked for you

Gas tip: Claiming less frequently uses less total gas.`
  },
  {
    id: "pause",
    title: "PAUSE STREAM",
    content: `Creators can pause active streams at any time.

When paused:
• The unlock clock stops
• No additional tokens unlock
• Previously unlocked tokens remain claimable
• The stream status shows "Paused"

Use pause when you need to temporarily stop payments without cancelling.`
  },
  {
    id: "resume",
    title: "RESUME STREAM",
    content: `Resume a paused stream to continue streaming.

When resumed:
• The unlock clock continues from where it stopped
• Time spent paused is tracked
• Remaining tokens continue to unlock as scheduled

Note: Pausing does not extend the end date.`
  },
  {
    id: "cancel",
    title: "CANCEL STREAM",
    content: `Cancel a stream to stop streaming early.

IMPORTANT: Streams must be paused before they can be cancelled.

When cancelled:
• Already unlocked tokens → sent to beneficiary
• Still locked tokens → returned to creator
• Stream status → Cancelled

This action cannot be undone. Both parties should confirm before proceeding.`
  },
  {
    id: "contract",
    title: "SMART CONTRACT",
    content: `DripFlow uses a single smart contract on Arc Testnet:

Contract: 0xDa0b9d18Fe9e67e5997b96Ef6ACa25a87eee62a9
Network: Arc Testnet (Chain ID: 5042002)
Token: USDC (address(0) - native)

The contract is:
• Non-upgradeable - Logic cannot change
• Reentrancy protected - Safe against callback attacks
• Gas optimized - O(1) writes for all state changes`
  },
  {
    id: "security",
    title: "SECURITY",
    content: `• Funds are locked in the contract vault
• Only the creator can pause/resume/cancel
• Only the beneficiary can claim
• All transfers require sufficient balance
• No admin keys or backdoors
• Based on OpenZeppelin contracts

DYOR: Always verify contract code before using.`
  },
  {
    id: "gas",
    title: "GAS OPTIMIZATION",
    content: `DripFlow is optimized for minimal gas usage:

• CREATE STREAM: ~200k gas (one-time)
• CLAIM: ~50k gas (flat, any stream size)
• PAUSE/RESUME: ~30k gas each
• CANCEL: ~60k gas

All state-changing functions use O(1) writes, meaning gas cost stays constant regardless of:
• Stream duration
• Total number of streams
• Historical activity`
  },
];

export default function DocsPage() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1 max-w-[1400px] mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <div className="label-micro mb-4">[ DOCUMENTATION ]</div>
          <h1 className="font-mono-display text-4xl lg:text-5xl text-foreground font-bold tracking-tighter mb-4">
            DRIPFLOW<br />
            <span className="text-primary">DOCS</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Learn how to create, manage, and claim token streams on DripFlow protocol.
          </p>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-8 lg:gap-12">
          {/* Sidebar */}
          <nav className="space-y-6 lg:sticky lg:top-24 lg:h-fit px-6 lg:px-0">
            {docs.map((section) => (
              <div key={section.title}>
                <h3 className="label-micro text-primary mb-3">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left pl-6 lg:pl-0"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Content */}
          <div className="space-y-16">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-mono-display text-2xl text-foreground font-bold mb-6 pb-3 border-b border-border">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.split('\n\n').map((para, i) => (
                    <p key={i} className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
                {section.showDiagram === "single" && <StreamDiagram type="single" />}
                {section.showDiagram === "multi-even" && <StreamDiagram type="multi-even" />}
                {section.showDiagram === "multi-custom" && <StreamDiagram type="multi-custom" />}
              </section>
            ))}
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
