"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Check, Copy, ArrowRight } from "lucide-react";
import { BulletRewrite } from "@/types";

function RewriteCard({ rewrite, index }: { rewrite: BulletRewrite; index: number }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rewrite.after);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore, copy button just won't confirm.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="panel rounded-lg p-4"
    >
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-full border border-signal-red/30 bg-signal-red/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-signal-red">
          Before
        </span>
        <p className="text-sm leading-relaxed text-mist line-through decoration-signal-red/40">
          {rewrite.before}
        </p>
      </div>

      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-full border border-signal-green/30 bg-signal-green/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-signal-green">
          After
        </span>
        <p className="flex-1 text-sm font-medium leading-relaxed text-mist-bright">
          {rewrite.after}
        </p>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-ink-line p-1.5 text-mist transition-colors hover:border-signal-cyan hover:text-signal-cyan"
          aria-label="Copy rewritten bullet"
        >
          {copied ? <Check size={13} className="text-signal-green" /> : <Copy size={13} />}
        </button>
      </div>

      <p className="flex items-start gap-1.5 border-t border-ink-line pt-2.5 text-xs text-mist">
        <ArrowRight size={12} className="mt-0.5 shrink-0 text-signal-cyan" />
        {rewrite.reason}
      </p>
    </motion.div>
  );
}

interface Props {
  visibleRewrites: BulletRewrite[];
  lockedCount: number;
  unlocked: boolean;
}

export function BulletRewrites({ visibleRewrites, lockedCount, unlocked }: Props) {
  if (visibleRewrites.length === 0 && lockedCount === 0) {
    return (
      <p className="rounded-lg border border-ink-line bg-ink-panel/60 p-4 text-sm text-mist">
        No weak bullets flagged — your existing phrasing already reads well.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visibleRewrites.map((rewrite, i) => (
        <RewriteCard key={rewrite.id} rewrite={rewrite} index={i} />
      ))}

      {!unlocked && lockedCount > 0 && (
        <div className="space-y-2 pt-1">
          {Array.from({ length: Math.min(lockedCount, 3) }).map((_, i) => (
            <div
              key={i}
              className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-ink-line bg-ink-panel/60 p-4"
            >
              <Lock size={16} className="shrink-0 text-mist/50" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-ink-raised blur-[2px]" />
                <div className="h-3 w-1/2 rounded bg-ink-raised blur-[2px]" />
              </div>
            </div>
          ))}
          {lockedCount > 3 && (
            <p className="pt-1 text-center font-mono text-xs text-mist">
              + {lockedCount - 3} more rewritten bullets
            </p>
          )}
        </div>
      )}
    </div>
  );
}