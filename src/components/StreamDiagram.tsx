"use client";

interface StreamDiagramProps {
  type: "single" | "multi-even" | "multi-custom";
}

export function StreamDiagram({ type }: StreamDiagramProps) {
  return (
    <div className="w-full my-8 p-4 rounded-lg overflow-x-auto" style={{ background: "#0a0a0a" }}>
      {type === "single" && <SingleStreamDiagram />}
      {type === "multi-even" && <MultiEvenDiagram />}
      {type === "multi-custom" && <MultiCustomDiagram />}
    </div>
  );
}

function SingleStreamDiagram() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2 py-6 min-w-[300px]">
      <NodeBox label="CREATOR" sublabel="WALLET" color="teal" />
      <Arrow direction="right" color="teal" label="[ deposit USDC ]" />
      <NodeBox label="STREAM" sublabel="CONTRACT" color="dark" />
      <Arrow direction="right" color="orange" label="[ streams X / hr ]" />
      <NodeBox label="BENEFICIARY" sublabel="WALLET" color="orange" />
    </div>
  );
}

function MultiEvenDiagram() {
  return (
    <div className="py-6 min-w-[300px]">
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2">
        <NodeBox label="CREATOR" sublabel="WALLET" color="teal" />
        <Arrow direction="right" color="teal" label="[ deposit — split ]" />
        <NodeBox label="STREAM" sublabel="CONTRACT" color="dark" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mt-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-0.5 bg-[#ff6b00] hidden md:block" />
          <NodeBox label="BENEFICIARY" sublabel="A" color="orange" small />
          <span className="text-[10px] text-gray-500 font-mono">[ X/3 /hr ]</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-0.5 bg-[#ff6b00] hidden md:block" />
          <NodeBox label="BENEFICIARY" sublabel="B" color="orange" small />
          <span className="text-[10px] text-gray-500 font-mono">[ X/3 /hr ]</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-0.5 bg-[#ff6b00] hidden md:block" />
          <NodeBox label="BENEFICIARY" sublabel="C" color="orange" small />
          <span className="text-[10px] text-gray-500 font-mono">[ X/3 /hr ]</span>
        </div>
      </div>
    </div>
  );
}

function MultiCustomDiagram() {
  return (
    <div className="py-6 min-w-[300px]">
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2">
        <NodeBox label="CREATOR" sublabel="WALLET" color="teal" />
        <Arrow direction="right" color="teal" label="[ deposit — split ]" />
        <NodeBox label="STREAM" sublabel="CONTRACT" color="dark" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mt-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-0.5 bg-[#ff6b00] hidden md:block" />
          <NodeBox label="TEAM" sublabel="WALLET" color="orange" small />
          <span className="text-[10px] text-gray-500 font-mono">[ 50% — X /day ]</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-0.5 bg-[#ff6b00] hidden md:block" />
          <NodeBox label="INVESTOR" sublabel="WALLET" color="orange" small />
          <span className="text-[10px] text-gray-500 font-mono">[ 30% — Y /day ]</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-0.5 bg-[#ff6b00] hidden md:block" />
          <NodeBox label="ADVISOR" sublabel="WALLET" color="orange" small />
          <span className="text-[10px] text-gray-500 font-mono">[ 20% — Z /day ]</span>
        </div>
      </div>
    </div>
  );
}

function NodeBox({ label, sublabel, color, small }: { label: string; sublabel: string; color: "teal" | "orange" | "dark"; small?: boolean }) {
  const styles = {
    teal: "border-[#00c9a7] bg-[rgba(0,201,167,0.08)]",
    orange: "border-[#ff6b00] bg-[rgba(255,107,0,0.08)]",
    dark: "border-[#2a3148] bg-[#1a1f2e]",
  };

  const textColor = {
    teal: "text-[#00c9a7]",
    orange: "text-[#ff6b00]",
    dark: "text-white",
  };

  return (
    <div className={`px-3 py-2 md:px-4 md:py-3 rounded-lg border-2 ${styles[color]} ${small ? 'min-w-[90px] md:min-w-[100px]' : 'min-w-[100px] md:min-w-[120px]'}`}>
      <p className={`font-mono text-center font-bold ${textColor[color]} text-xs md:text-sm`}>{label}</p>
      <p className={`font-mono text-center text-[9px] md:text-[10px] ${textColor[color]} opacity-70`}>{sublabel}</p>
    </div>
  );
}

function Arrow({ direction, color, label }: { direction: "left" | "right" | "down"; color: "teal" | "orange"; label?: string }) {
  const borderColor = color === "teal" ? "border-[#00c9a7]" : "border-[#ff6b00]";
  const textColor = color === "teal" ? "text-[#00c9a7]" : "text-[#ff6b00]";

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className={`text-[9px] md:text-[10px] font-mono ${textColor} mb-1 whitespace-nowrap px-1`}>
          {label}
        </span>
      )}
      <div className="relative">
        <div className={`h-0.5 ${borderColor} w-8 md:w-12`} />
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{
            width: 0,
            height: 0,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderLeft: `8px solid ${color === "teal" ? "#00c9a7" : "#ff6b00"}`,
          }}
        />
      </div>
    </div>
  );
}
