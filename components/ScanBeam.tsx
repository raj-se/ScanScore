"use client";

import { motion } from "framer-motion";

const STEPS = [
  "Extracting resume text…",
  "Parsing job description requirements…",
  "Cross-referencing keywords…",
  "Scoring formatting & structure…",
  "Compiling suggestions…",
];

export function ScanBeam({ fileName }: { fileName: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-xl border border-ink-line bg-ink-panel p-8">
        {/* faux document lines */}
        <div className="space-y-3 opacity-60">
          <div className="h-3 w-2/3 rounded bg-ink-raised" />
          <div className="h-2 w-full rounded bg-ink-raised" />
          <div className="h-2 w-5/6 rounded bg-ink-raised" />
          <div className="h-2 w-full rounded bg-ink-raised" />
          <div className="h-2 w-3/4 rounded bg-ink-raised" />
          <div className="h-2 w-full rounded bg-ink-raised" />
          <div className="h-2 w-2/3 rounded bg-ink-raised" />
        </div>

        {/* sweeping beam */}
        <motion.div
          className="absolute inset-x-0 top-0 h-16"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(76,201,240,0.35), transparent)",
          }}
          animate={{ y: ["-4rem", "260px"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 grid-overlay opacity-30" />
      </div>

      <p className="mt-4 truncate text-center font-mono text-xs text-mist">
        {fileName}
      </p>

      <div className="mt-6 space-y-2">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 2,
              delay: i * 0.4,
              repeat: Infinity,
              repeatDelay: STEPS.length * 0.4 - 2 < 0 ? 0 : STEPS.length * 0.4 - 2,
            }}
            className="flex items-center gap-3 font-mono text-xs text-mist"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-signal-cyan" />
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
