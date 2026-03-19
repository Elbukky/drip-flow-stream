"use client";

import { motion } from "framer-motion";

interface StreamDiagramProps {
  type: "single" | "multi-even" | "multi-custom";
}

export function StreamDiagram({ type }: StreamDiagramProps) {
  return (
    <div className="w-full max-w-[800px] overflow-x-auto my-8">
      <svg
        viewBox="0 0 700 300"
        className="w-full h-auto min-w-[300px]"
        style={{ background: "#0a0a0a", borderRadius: "8px" }}
      >
        <defs>
          <marker
            id="teal-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#00c9a7" />
          </marker>
          <marker
            id="orange-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#ff6b00" />
          </marker>
          <style>
            {`
              @keyframes march {
                to { stroke-dashoffset: -20; }
              }
              .flow-arrow {
                stroke-dasharray: 6 4;
                animation: march 0.8s linear infinite;
              }
              .box-text {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                fill: white;
              }
              .label-text {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                fill: #666;
              }
              .creator-box {
                fill: rgba(0,201,167,0.08);
                stroke: #00c9a7;
                stroke-width: 2;
                rx: 8;
              }
              .contract-box {
                fill: #1a1f2e;
                stroke: #2a3148;
                stroke-width: 2;
                rx: 8;
              }
              .beneficiary-box {
                fill: rgba(255,107,0,0.08);
                stroke: #ff6b00;
                stroke-width: 2;
                rx: 8;
              }
            `}
          </style>
        </defs>

        {/* Creator Box */}
        <rect
          x="20"
          y="120"
          width="140"
          height="60"
          className="creator-box"
        />
        <text x="90" y="145" textAnchor="middle" className="box-text">
          CREATOR
        </text>
        <text x="90" y="162" textAnchor="middle" className="box-text" style={{ fontSize: "10px", fill: "#00c9a7" }}>
          WALLET
        </text>

        {/* Contract Box */}
        <rect
          x="280"
          y="100"
          width="140"
          height="100"
          className="contract-box"
        />
        <text x="350" y="135" textAnchor="middle" className="box-text">
          STREAM
        </text>
        <text x="350" y="152" textAnchor="middle" className="box-text">
          CONTRACT
        </text>

        {/* Arrows from Creator to Contract */}
        <motion.path
          d="M 160 150 L 280 150"
          stroke="#00c9a7"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#teal-arrow)"
          className="flow-arrow"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        <text x="220" y="140" textAnchor="middle" className="label-text">
          [ deposit USDC ]
        </text>

        {type === "single" && <SingleStream />}
        {type === "multi-even" && <MultiEvenStream />}
        {type === "multi-custom" && <MultiCustomStream />}
      </svg>
    </div>
  );
}

function SingleStream() {
  return (
    <>
      {/* Arrow to Beneficiary */}
      <motion.path
        d="M 420 150 L 540 150"
        stroke="#ff6b00"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#orange-arrow)"
        className="flow-arrow"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      <text x="480" y="140" textAnchor="middle" className="label-text">
        [ streams X USDC / hour ]
      </text>

      {/* Beneficiary Box */}
      <rect
        x="540"
        y="120"
        width="140"
        height="60"
        className="beneficiary-box"
      />
      <text x="610" y="145" textAnchor="middle" className="box-text">
        BENEFICIARY
      </text>
      <text x="610" y="162" textAnchor="middle" className="box-text" style={{ fontSize: "10px", fill: "#ff6b00" }}>
        WALLET
      </text>
    </>
  );
}

function MultiEvenStream() {
  const beneficiaries = ["A", "B", "C"];
  const yPositions = [80, 150, 220];

  return (
    <>
      <motion.path
        d="M 420 150 L 500 150"
        stroke="#ff6b00"
        strokeWidth="2"
        fill="none"
        className="flow-arrow"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Horizontal line */}
      <motion.line
        x1="500"
        y1="150"
        x2="500"
        y2="220"
        stroke="#ff6b00"
        strokeWidth="2"
        className="flow-arrow"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      />

      {/* Label */}
      <text x="480" y="140" textAnchor="middle" className="label-text">
        [ deposit total — split evenly ]
      </text>

      {beneficiaries.map((letter, i) => (
        <g key={letter}>
          <motion.line
            x1="500"
            y1={yPositions[i]}
            x2="540"
            y2={yPositions[i]}
            stroke="#ff6b00"
            strokeWidth="2"
            className="flow-arrow"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
          />
          <motion.path
            d="M 540 0 L 540 0"
            stroke="#ff6b00"
            strokeWidth="0"
            markerEnd="url(#orange-arrow)"
          />
          <rect
            x="540"
            y={yPositions[i] - 30}
            width="140"
            height="60"
            className="beneficiary-box"
          />
          <text x="610" y={yPositions[i] - 5} textAnchor="middle" className="box-text">
            BENEFICIARY
          </text>
          <text x="610" y={yPositions[i] + 12} textAnchor="middle" className="box-text" style={{ fontSize: "10px", fill: "#ff6b00" }}>
            {letter}
          </text>
          <text x="680" y={yPositions[i] + 10} textAnchor="end" className="label-text">
            [ X / 3 USDC/hr ]
          </text>
        </g>
      ))}
    </>
  );
}

function MultiCustomStream() {
  const streams = [
    { label: "50%", amount: "X", target: "TEAM", y: 60 },
    { label: "30%", amount: "Y", target: "INVESTOR", y: 150 },
    { label: "20%", amount: "Z", target: "ADVISOR", y: 240 },
  ];

  return (
    <>
      <motion.path
        d="M 420 150 L 500 150"
        stroke="#ff6b00"
        strokeWidth="2"
        fill="none"
        className="flow-arrow"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Horizontal line */}
      <motion.line
        x1="500"
        y1="60"
        x2="500"
        y2="240"
        stroke="#ff6b00"
        strokeWidth="2"
        className="flow-arrow"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      />

      {/* Label */}
      <text x="480" y="140" textAnchor="middle" className="label-text">
        [ deposit total — custom split ]
      </text>

      {streams.map((stream, i) => (
        <g key={stream.target}>
          <motion.line
            x1="500"
            y1={stream.y}
            x2="540"
            y2={stream.y}
            stroke="#ff6b00"
            strokeWidth="2"
            markerEnd="url(#orange-arrow)"
            className="flow-arrow"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
          />
          <rect
            x="540"
            y={stream.y - 30}
            width="140"
            height="60"
            className="beneficiary-box"
          />
          <text x="610" y={stream.y - 5} textAnchor="middle" className="box-text">
            {stream.target}
          </text>
          <text x="610" y={stream.y + 12} textAnchor="middle" className="box-text" style={{ fontSize: "10px", fill: "#ff6b00" }}>
            WALLET
          </text>
          <text x="680" y={stream.y + 10} textAnchor="end" className="label-text">
            [ {stream.label} — {stream.amount} USDC/day ]
          </text>
        </g>
      ))}
    </>
  );
}
