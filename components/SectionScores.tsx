"use client";

import { motion } from "framer-motion";

const LABELS: Record<string, string> = {
  keywordMatch: "Keyword match",
  formatting: "Formatting",
  structure: "Structure",
  experience: "Experience relevance",
};

function barColor(v: number) {
  if (v >= 75) return "#3ED9B6";
  if (v >= 50) return "#FDB870";
  return "#FF6E8E";
}

export function SectionScores({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between font-mono text-xs text-mist">
            <span>{LABELS[key] ?? key}</span>
            <span style={{ color: barColor(value) }}>{value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-raised">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor(value) }}
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
