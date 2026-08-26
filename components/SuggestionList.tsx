"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, AlertTriangle, CircleAlert } from "lucide-react";
import { Suggestion } from "@/types";

const IMPACT_STYLES: Record<Suggestion["impact"], { label: string; color: string }> = {
  high: { label: "High impact", color: "text-signal-red border-signal-red/30 bg-signal-red/10" },
  medium: { label: "Medium impact", color: "text-signal-amber border-signal-amber/30 bg-signal-amber/10" },
  low: { label: "Low impact", color: "text-signal-cyan border-signal-cyan/30 bg-signal-cyan/10" },
};

interface Props {
  visibleSuggestions: Suggestion[];
  lockedCount: number;
  unlocked: boolean;
}

export function SuggestionList({ visibleSuggestions, lockedCount, unlocked }: Props) {
  return (
    <div className="space-y-3">
      {visibleSuggestions.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="panel rounded-lg p-4"
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h4 className="font-medium text-mist-bright">{s.title}</h4>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${IMPACT_STYLES[s.impact].color}`}
            >
              {IMPACT_STYLES[s.impact].label}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-mist">{s.detail}</p>
        </motion.div>
      ))}

      {!unlocked && lockedCount > 0 && (
        <div className="space-y-2 pt-1">
          {Array.from({ length: Math.min(lockedCount, 4) }).map((_, i) => (
            <div
              key={i}
              className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-ink-line bg-ink-panel/60 p-4"
            >
              <Lock size={16} className="shrink-0 text-mist/50" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-ink-raised blur-[2px]" />
                <div className="h-2 w-full rounded bg-ink-raised blur-[2px]" />
              </div>
            </div>
          ))}
          {lockedCount > 4 && (
            <p className="pt-1 text-center font-mono text-xs text-mist">
              + {lockedCount - 4} more locked suggestions
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function FormattingIssuesList({
  issues,
  unlocked,
}: {
  issues: { issue: string; risk: string }[];
  unlocked: boolean;
}) {
  if (!unlocked) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-ink-line bg-ink-panel/60 p-4">
        <Lock size={16} className="text-mist/50" />
        <p className="text-sm text-mist">
          Formatting risk report is part of the full unlock.
        </p>
      </div>
    );
  }
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-signal-green/30 bg-signal-green/5 p-4">
        <Sparkles size={16} className="text-signal-green" />
        <p className="text-sm text-mist-bright">No major formatting risks detected.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {issues.map((issue, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-ink-line bg-ink-panel/60 p-3"
        >
          {issue.risk === "high" ? (
            <CircleAlert size={16} className="mt-0.5 shrink-0 text-signal-red" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-signal-amber" />
          )}
          <p className="text-sm text-mist-bright">{issue.issue}</p>
        </div>
      ))}
    </div>
  );
}
