"use client";

import { Terminal, AlertTriangle, Lock } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 80) return "text-signal-green";
  if (score >= 50) return "text-signal-amber";
  return "text-signal-red";
}

interface Props {
  parseQualityScore: number;
  flags: string[];
  rawText: string;
  truncated: boolean;
  unlocked: boolean;
}

export function ParsePreview({ parseQualityScore, flags, rawText, truncated, unlocked }: Props) {
  return (
    <div className="panel rounded-xl p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-signal-cyan" />
          <h3 className="font-display text-lg font-semibold text-mist-bright">
            How an ATS actually reads your resume
          </h3>
          <span className="rounded-full bg-signal-cyan/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-signal-cyan">
            New
          </span>
        </div>
        <span className={`font-mono text-xs font-semibold ${scoreColor(parseQualityScore)}`}>
          Parse quality: {parseQualityScore}/100
        </span>
      </div>
      <p className="mb-4 text-sm text-mist">
        Most ATS software never sees your design — it sees raw extracted text, in
        whatever order the parser found it. This is exactly what ours pulled from
        your file.
      </p>

      {flags.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {flags.map((flag, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-signal-amber">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-ink-line bg-ink px-4 py-3 font-mono text-[11px] leading-relaxed text-mist-bright/90">
          {rawText}
          {truncated && !unlocked ? "\n…" : ""}
        </pre>
        {truncated && !unlocked && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center rounded-b-lg bg-gradient-to-t from-ink-panel to-transparent pb-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-mist">
              <Lock size={11} /> Unlock the full report to see the complete parsed text
            </span>
          </div>
        )}
      </div>
    </div>
  );
}