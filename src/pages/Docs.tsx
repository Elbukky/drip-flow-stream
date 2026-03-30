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
  {
    title: "DRIP ALLOWANCE",
    items: [
      { label: "What is Drip Allowance?", id: "allowance-what" },
      { label: "Fixed Daily Mode", id: "allowance-fixed" },
      { label: "Percentage Mode", id: "allowance-percentage" },
      { label: "Unlock Frequencies", id: "allowance-frequency" },
      { label: "Top Up", id: "allowance-topup" },
      { label: "Claim Funds", id: "allowance-claim" },
      { label: "Emergency Withdrawal", id: "allowance-emergency" },
    ]
  },
  {
    title: "FLOW PROGRESS",
    items: [
      { label: "Gamification Overview", id: "gamification-overview" },
      { label: "Daily Check-In", id: "gamification-checkin" },
      { label: "Streaks & Recovery", id: "gamification-streaks" },
      { label: "XP & Multipliers", id: "gamification-xp" },
      { label: "NFT Badges", id: "gamification-badges" },
      { label: "Boosting Explained", id: "gamification-boosting" },
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

Contract: 0xd54B92983698Dbc3193a1E1D18DA68d5E6AD66a4
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
  {
    id: "allowance-what",
    title: "WHAT IS DRIP ALLOWANCE?",
    content: `Drip Allowance is a gamified self-custody savings vault built on-chain. Instead of giving yourself access to all your funds at once, you lock USDC into a savings position and it drips back to you over time on a schedule you choose.

Think of it as a personal allowance system: you deposit a lump sum, configure how much unlocks per period, and your funds release gradually. You stay in full control -- you can claim released funds anytime, top up existing positions, or use emergency withdrawal if needed.

There are two savings modes: Fixed Daily (set an exact amount per period) and Percentage (set a percentage of your balance per period). Both support four unlock frequencies: Daily, Weekly, Monthly, and Yearly.`
  },
  {
    id: "allowance-fixed",
    title: "FIXED DAILY MODE",
    content: `In Fixed Daily mode, you choose an exact amount of USDC to release per unlock period.

HOW IT WORKS:
- You deposit a total amount (e.g. 100 USDC)
- You set a per-period release amount (e.g. 5 USDC)
- The contract calculates the duration automatically (100 / 5 = 20 periods)
- Each period, exactly 5 USDC becomes claimable
- On the last period, any remaining dust (from rounding) is included

EXAMPLE:
Deposit 100 USDC with 3 USDC per day release.
- Duration: 33 days (100 / 3 = 33 full periods)
- Day 1-33: 3 USDC unlocks each day
- Day 33 (last day): 3 USDC + 1 USDC remainder = 4 USDC unlocks
- Total: 100 USDC fully returned

When you top up a Fixed Daily position, the contract keeps your same per-period rate and extends the duration proportionally.`
  },
  {
    id: "allowance-percentage",
    title: "PERCENTAGE MODE",
    content: `In Percentage mode, you set a percentage of your total deposit to release per unlock period.

HOW IT WORKS:
- You deposit a total amount (e.g. 100 USDC)
- You set a duration in periods (e.g. 10 periods)
- The contract calculates the percentage automatically (10000 / 10 = 1000 bps = 10% per period)
- Each period, 10% of the total deposit unlocks
- On the last period, all remaining funds (including any rounding dust) are released

EXAMPLE:
Deposit 100 USDC over 10 daily periods.
- Percentage: 10% per day
- Day 1: 10 USDC unlocks
- Day 2: another 10 USDC unlocks (20 total)
- Day 10 (last day): all remaining funds released
- Total: 100 USDC fully returned

Percentage mode is useful when you want your unlock rate to scale with your deposit size.`
  },
  {
    id: "allowance-frequency",
    title: "UNLOCK FREQUENCIES",
    content: `Every savings position has an unlock frequency that determines how often tokens become available:

DAILY - Tokens unlock once every 24 hours. Best for everyday spending allowances.

WEEKLY - Tokens unlock once every 7 days. Good for weekly budgeting.

MONTHLY - Tokens unlock once every 30 days. Ideal for monthly expense planning.

YEARLY - Tokens unlock once every 365 days. Best for long-term savings goals.

The frequency applies to both Fixed Daily and Percentage modes. When you see "per period" in the UI, it means per frequency period (per day, per week, per month, or per year depending on your setting).

You choose the frequency when creating a position. It cannot be changed after creation, but you can create multiple positions with different frequencies.`
  },
  {
    id: "allowance-topup",
    title: "TOP UP",
    content: `You can add more funds to any active savings position without creating a new one.

FIXED DAILY TOP-UP:
When you top up a Fixed Daily position, the per-period release amount stays the same and the duration extends. For example, if you have 5 USDC/day with 10 days remaining and add 50 USDC, you now have 20 days remaining at the same 5 USDC/day rate.

PERCENTAGE TOP-UP - TWO STRATEGIES:
When topping up a Percentage position, you choose one of two strategies:

1. EXTEND DURATION (default)
   - Keeps the same percentage rate per period
   - Adds more periods proportionally
   - Example: 10% rate with 5 periods left, add equal funds = 10 periods at same 10% rate

2. INCREASE RATE
   - Keeps the same number of remaining periods
   - Recalculates the percentage to distribute new total evenly
   - Example: 5 periods left, add more funds = same 5 periods but higher release per period
   - Accounting resets cleanly so drip is smooth from day 1 after top-up

The UI shows a preview of how your top-up will affect the position before you confirm.`
  },
  {
    id: "allowance-claim",
    title: "CLAIM FUNDS",
    content: `Once funds unlock according to your schedule, you can claim them at any time.

- Click "Claim" on any position to withdraw all currently available funds
- Use "Claim All" to batch-claim across all your active positions in a single transaction
- Claiming is free (you only pay gas)
- You can claim as frequently or infrequently as you want -- unclaimed funds accumulate
- When a position is fully claimed, it is automatically marked as inactive

The Drip Allowance page shows your total available balance across all positions, the next unlock timer for each position, and how much is still secured (locked).`
  },
  {
    id: "allowance-emergency",
    title: "EMERGENCY WITHDRAWAL",
    content: `If you need your locked funds immediately, you can use Emergency Withdrawal on any active position.

WHAT HAPPENS:
- A 2% fee is deducted from your remaining balance
- The fee goes to the protocol treasury
- You receive 98% of the remaining locked funds immediately
- The position is permanently closed
- Your check-in streak resets to 0

IMPORTANT:
- Your XP multiplier is NOT permanently blocked -- once you rebuild your streak, your multiplier returns
- NFT badges you already earned are permanent and will not be taken away
- Emergency withdrawal cannot be undone

This feature exists as a safety net. The 2% fee and streak reset are designed to discourage casual use while still giving you access to your own funds when you truly need them.`
  },
  {
    id: "gamification-overview",
    title: "GAMIFICATION OVERVIEW",
    content: `DripFlow's Flow Progress system rewards consistency through a gamification layer built on top of the savings vault.

THE CORE LOOP:
1. Lock USDC into a savings position on the Drip Allowance page
2. Check in daily on the Flow Progress page to earn XP
3. Build your streak to unlock multipliers that boost XP earned per check-in
4. Earn soulbound NFT badges at streak milestones (permanent collectibles)

REQUIREMENTS TO PARTICIPATE:
- At least one active savings position
- At least 1 USDC worth of locked (not yet released) funds across all positions

The gamification system is entirely optional. Your savings positions work independently whether or not you participate in check-ins, streaks, or badges.`
  },
  {
    id: "gamification-checkin",
    title: "DAILY CHECK-IN",
    content: `Check in once per day to earn XP and maintain your streak.

HOW IT WORKS:
- Visit the Flow Progress page and click "Check In"
- One check-in per calendar day (resets at 00:00 UTC)
- Each check-in earns base XP, multiplied by your current multiplier
- The calendar heatmap shows your last 30 days of check-in history

REQUIREMENTS:
- At least one active savings position
- At least 1 USDC of locked funds across all positions
- If your locked balance drops below 1 USDC (because funds unlocked), you cannot check in until you deposit more

Check-ins are on-chain transactions, so they cost a small amount of gas. The UI shows a countdown timer to the next available check-in window.`
  },
  {
    id: "gamification-streaks",
    title: "STREAKS & RECOVERY",
    content: `Your streak tracks how many consecutive days you have checked in.

BUILDING A STREAK:
- Check in on consecutive days to increase your streak by 1 each day
- Your first ever check-in starts your streak at 1

MISSING DAYS:
- Miss 1 or 2 days: Your streak can be recovered by paying a 0.01 ETH recovery fee, then checking in
- Miss 3 or more days: Your streak hard resets to 0 and CANNOT be recovered. You must start fresh

RECOVERY PROCESS:
1. If you missed 1 or 2 days, a yellow "Recover Streak" button appears
2. Click it and pay 0.01 ETH (goes to protocol treasury)
3. After recovery, check in as normal -- your streak continues where it left off
4. Recovery must be done BEFORE your check-in on the recovery day

STREAK MILESTONES:
- 7 days: Unlocks 2x XP multiplier
- 15 days: Earns Silver NFT badge + 3x XP multiplier
- 30 days: Earns Gold NFT badge + 4x XP multiplier

EMERGENCY WITHDRAWAL IMPACT:
Using emergency withdrawal on any position resets your streak to 0. However, your multiplier is NOT permanently blocked -- rebuild your streak and it returns.`
  },
  {
    id: "gamification-xp",
    title: "XP & MULTIPLIERS",
    content: `XP (experience points) is your lifetime score. It can only go up and is never lost.

BASE XP:
Each daily check-in earns 1 base XP, which is then multiplied by your current multiplier.

MULTIPLIER TIERS:
Your multiplier depends on your current streak AND having enough locked funds:

- 1x (base): Default. Any streak under 7 days
- 2x: Streak of 7+ days
- 3x: Streak of 15+ days
- 4x: Streak of 30+ days

MULTIPLIER REQUIREMENTS (all must be met):
1. At least one active savings position
2. At least 10 USDC of locked funds across all positions
3. Streak at the required level

If your locked balance drops below 10 USDC, your multiplier falls back to 1x regardless of your streak. The streak itself is preserved -- only the multiplier is affected.

EXAMPLE:
- Day 1-6: Check in daily, earn 1 XP each (1x multiplier)
- Day 7: Streak hits 7, multiplier becomes 2x, earn 2 XP
- Day 8-14: Earn 2 XP per check-in
- Day 15: Multiplier becomes 3x, earn 3 XP
- Day 30: Multiplier becomes 4x, earn 4 XP per check-in going forward`
  },
  {
    id: "gamification-badges",
    title: "NFT BADGES",
    content: `NFT badges are soulbound (non-transferable) ERC-721 tokens minted as you hit milestones.

BADGE TIERS:

BRONZE (Tier 1):
- Requirement: 1 check-in with at least 1 XP
- Minted automatically on your first successful check-in

SILVER (Tier 2):
- Requirement: 15-day streak
- Minted automatically when your streak reaches 15

GOLD (Tier 3):
- Requirement: 30-day streak
- Minted automatically when your streak reaches 30

IMPORTANT PROPERTIES:
- Badges are PERMANENT. Once minted, they stay in your wallet forever
- Badges are SOULBOUND (ERC-5192). They cannot be transferred, sold, or burned
- Badges persist even if your streak resets or you use emergency withdrawal
- Each badge has on-chain SVG art generated by the NFTDescriptor contract
- Badge metadata includes your streak, XP, and total saved at time of viewing

Badges are purely cosmetic achievements. They do not affect your multiplier or XP earnings -- those come from your current streak and locked balance.`
  },
  {
    id: "gamification-boosting",
    title: "BOOSTING EXPLAINED",
    content: `Boosting is how you maximize your XP earnings. Here is the complete breakdown of what affects your XP multiplier and how to optimize it.

THE BOOST FORMULA:
XP per check-in = 1 (base) x Multiplier

WHAT CONTROLS YOUR MULTIPLIER:
Three conditions must ALL be true for any multiplier above 1x:

1. ACTIVE POSITION: You must have at least one active (not fully claimed or emergency-withdrawn) savings position

2. LOCKED BALANCE: You must have at least 10 USDC worth of funds still locked (not yet released) across all your positions. This means as your positions drip and funds unlock, your locked balance decreases. If it drops below 10 USDC, your multiplier drops to 1x until you deposit more

3. STREAK LEVEL: Your consecutive check-in streak determines the tier:
   - 0-6 days: 1x (no boost)
   - 7-13 days: 2x boost
   - 14-29 days: 3x boost  (note: this is streak >= 15 on-chain, but effectively from day 15 onward)
   - 30+ days: 4x boost (maximum)

HOW TO MAINTAIN MAX BOOST:
- Check in EVERY day without missing more than 2 days
- Keep at least 10 USDC locked at all times (top up before positions fully drain)
- If you miss 1-2 days, use streak recovery (0.01 ETH) immediately
- Avoid emergency withdrawal unless absolutely necessary (resets streak to 0)

WHAT HAPPENS IF YOU LOSE YOUR BOOST:
- Streak reset: Your multiplier drops but can be rebuilt by checking in consistently again
- Emergency withdrawal: Streak goes to 0, but multiplier is NOT permanently blocked
- Balance drops below 10 USDC: Multiplier drops to 1x until you deposit more. Streak is preserved
- All XP earned is permanent and never decreases`
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
