"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function scoreColor(score: number): string {
  if (score >= 75) return "#3ED9B6";
  if (score >= 50) return "#FDB870";
  return "#FF6E8E";
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 50) return "Needs work";
  return "High risk of rejection";
}

export function ScoreGauge({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const color = scoreColor(score);

  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
      <svg width="224" height="224" viewBox="0 0 224 224" className="-rotate-90">
        <circle
          cx="112"
          cy="112"
          r={radius}
          fill="none"
          stroke="#3C2C5C"
          strokeWidth="10"
        />
        <motion.circle
          cx="112"
          cy="112"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>

      {/* radar sweep signature element */}
      <div className="pointer-events-none absolute inset-6 overflow-hidden rounded-full">
        <motion.div
          className="absolute left-1/2 top-1/2 h-1/2 w-[2px] origin-top"
          style={{
            background: `linear-gradient(180deg, ${color}, transparent)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <span
          className="font-mono text-5xl font-bold"
          style={{ color }}
        >
          {displayScore}
        </span>
        <span className="font-mono text-xs text-mist">/ 100</span>
        <span className="mt-2 text-center text-xs font-medium text-mist-bright">
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
