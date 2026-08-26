"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  priceDisplay: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

type Step = "form" | "processing" | "success";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** True if MM/YY is a real month and is this month or later. */
function isExpiryValid(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export function PaymentModal({ open, priceDisplay, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cardDigits = cardNumber.replace(/\D/g, "");
  const cardValid = cardDigits.length >= 12 && cardDigits.length <= 19;
  const nameValid = name.trim().length >= 2;
  const expiryValid = isExpiryValid(expiry);
  const cvvValid = /^\d{3,4}$/.test(cvv);
  const formValid = cardValid && nameValid && expiryValid && cvvValid;

  function resetAndClose() {
    setStep("form");
    setCardNumber("");
    setName("");
    setExpiry("");
    setCvv("");
    setTouched(false);
    setErrorMsg(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setErrorMsg(null);
    if (!formValid) return;

    setStep("processing");
    // Simulated processing delay — this is a demo checkout, no card network is contacted.
    await new Promise((r) => setTimeout(r, 1400));

    try {
      await onSuccess();
      setStep("success");
      setTimeout(() => {
        resetAndClose();
      }, 1600);
    } catch (err) {
      setErrorMsg("Something went wrong unlocking the report. Please try again.");
      setStep("form");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm"
          onClick={step === "form" ? resetAndClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-ink-line bg-ink-panel p-6 shadow-2xl"
          >
            {step === "form" && (
              <button
                onClick={resetAndClose}
                className="absolute right-4 top-4 text-mist hover:text-mist-bright"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}

            {step === "form" && (
              <>
                <div className="mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-signal-cyan" />
                  <h3 className="font-display text-lg font-semibold text-mist-bright">
                    Unlock full report — {priceDisplay}
                  </h3>
                </div>

                <p className="mb-5 rounded-lg border border-signal-amber/30 bg-signal-amber/10 px-3 py-2 text-xs text-signal-amber">
                  Demo checkout — this is not a real payment. Enter any card number,
                  any name, and any future expiry date.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-mist">
                      Card number
                    </label>
                    <input
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-mist-bright outline-none focus:border-signal-cyan"
                      required
                    />
                    {touched && !cardValid && (
                      <p className="mt-1 text-xs text-signal-red">
                        Enter a card number (12–19 digits).
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-mist">
                      Name on card
                    </label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-mist-bright outline-none focus:border-signal-cyan"
                      required
                    />
                    {touched && !nameValid && (
                      <p className="mt-1 text-xs text-signal-red">Enter the name on the card.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-mist">
                        Expiry (MM/YY)
                      </label>
                      <input
                        inputMode="numeric"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-mist-bright outline-none focus:border-signal-cyan"
                        required
                      />
                      {touched && !expiryValid && (
                        <p className="mt-1 text-xs text-signal-red">Must be a future date.</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-widest text-mist">
                        CVV
                      </label>
                      <input
                        inputMode="numeric"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="w-full rounded-lg border border-ink-line bg-ink px-3.5 py-2.5 text-sm text-mist-bright outline-none focus:border-signal-cyan"
                        required
                      />
                      {touched && !cvvValid && (
                        <p className="mt-1 text-xs text-signal-red">3–4 digits.</p>
                      )}
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="rounded-lg border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-sm text-signal-red">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-signal-cyan py-3.5 font-display text-sm font-semibold text-ink transition-transform hover:scale-[1.01]"
                  >
                    Pay {priceDisplay}
                  </button>
                </form>
              </>
            )}

            {step === "processing" && (
              <div className="flex flex-col items-center justify-center gap-4 py-10">
                <Loader2 size={36} className="animate-spin text-signal-cyan" />
                <p className="font-mono text-sm text-mist">Processing payment…</p>
              </div>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center justify-center gap-4 py-10">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <CheckCircle2 size={52} className="text-signal-green" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="font-display text-base font-semibold text-mist-bright"
                >
                  Payment successful
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-mist"
                >
                  Unlocking your full report…
                </motion.p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
