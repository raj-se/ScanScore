"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, Unlock } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";

const PRICE_DISPLAY = process.env.NEXT_PUBLIC_FULL_REPORT_PRICE_DISPLAY || "₹49";

interface Props {
  analysisId: string;
  lockedPayload: string;
  lockedSuggestionCount: number;
  onUnlocked: (result: any) => void;
}

export function PaywallCard({
  analysisId,
  lockedPayload,
  lockedSuggestionCount,
  onUnlocked,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock() {
    setError(null);
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId, lockedPayload }),
    });
    const data = await res.json();
    if (!res.ok || !data.unlocked) {
      const message = data.error ?? "Could not unlock the report.";
      setError(message);
      throw new Error(message);
    }
    onUnlocked(data.result);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-signal-cyan/30 bg-gradient-to-br from-signal-cyan/10 via-ink-panel to-ink-panel p-6"
      >
        <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-signal-cyan">
          <Sparkles size={14} /> Full report locked
        </div>
        <h3 className="mb-2 font-display text-xl font-semibold text-mist-bright">
          Unlock {lockedSuggestionCount}+ more fixes, every missing keyword & your formatting risk report
        </h3>
        <p className="mb-5 text-sm text-mist">
          One-time payment. No subscription. See exactly what to change before you apply.
        </p>

        <div className="mb-5 flex flex-wrap gap-4 text-xs text-mist">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-signal-green" /> Secure checkout
          </span>
          <span className="flex items-center gap-1.5">
            <Unlock size={14} className="text-signal-green" /> Instant unlock
          </span>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-sm text-signal-red">
            {error}
          </p>
        )}

        <button
          onClick={() => setModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-signal-cyan py-3.5 font-display text-sm font-semibold text-ink transition-transform hover:scale-[1.01]"
        >
          {`Unlock full report — ${PRICE_DISPLAY}`}
        </button>
      </motion.div>

      <PaymentModal
        open={modalOpen}
        priceDisplay={PRICE_DISPLAY}
        onClose={() => setModalOpen(false)}
        onSuccess={handleUnlock}
      />
    </>
  );
}
