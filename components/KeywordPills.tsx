"use client";

import { Check, X, Lock } from "lucide-react";
import { KeywordMatch } from "@/types";

const IMPORTANCE_RING: Record<KeywordMatch["importance"], string> = {
  critical: "ring-1 ring-signal-red/40",
  important: "ring-1 ring-signal-amber/40",
  "nice-to-have": "",
};

export function KeywordPills({
  matched,
  missing,
  unlocked,
  lockedCount,
}: {
  matched: KeywordMatch[];
  missing: KeywordMatch[];
  unlocked: boolean;
  lockedCount: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-mist">
          Matched in your resume
        </p>
        <div className="flex flex-wrap gap-2">
          {matched.map((k) => (
            <span
              key={k.keyword}
              className={`flex items-center gap-1 rounded-full bg-signal-green/10 px-3 py-1 text-xs text-signal-green ${IMPORTANCE_RING[k.importance]}`}
            >
              <Check size={11} /> {k.keyword}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-mist">
          Missing from your resume
        </p>
        <div className="flex flex-wrap gap-2">
          {missing.map((k) => (
            <span
              key={k.keyword}
              className={`flex items-center gap-1 rounded-full bg-signal-red/10 px-3 py-1 text-xs text-signal-red ${IMPORTANCE_RING[k.importance]}`}
            >
              <X size={11} /> {k.keyword}
            </span>
          ))}
          {!unlocked && lockedCount > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-ink-line bg-ink-panel px-3 py-1 text-xs text-mist">
              <Lock size={11} /> +{lockedCount} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
