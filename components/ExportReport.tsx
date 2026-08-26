"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function ExportReport({ targetId }: { targetId: string }) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const el = document.getElementById(targetId);
      if (!el) return;

      const canvas = await html2canvas(el, {
        backgroundColor: "#120b1e",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("ats-report.pdf");
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-panel px-4 py-2 text-xs font-medium text-mist-bright transition-colors hover:border-signal-cyan hover:text-signal-cyan disabled:opacity-60"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      {busy ? "Preparing PDF…" : "Download report as PDF"}
    </button>
  );
}
