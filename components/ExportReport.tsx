"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { AnalysisResult } from "@/types";

/**
 * PDF export — rewritten to draw the report natively with jsPDF instead of
 * screenshotting the live (animated, dark-themed) dashboard with html2canvas.
 *
 * The old html2canvas approach was unreliable: it captured whatever the
 * browser window happened to be sized to at export time (causing cropped/cut
 * off content on narrower windows), froze mid-animation (the score gauge's
 * radar sweep, count-up), and struggled with SVG drop-shadow filters — all
 * visible as broken/partial renders in the exported file.
 *
 * Drawing the PDF directly avoids all of that: it's pixel-exact regardless of
 * window size, has no animations to freeze mid-frame, and paginates properly
 * across as many A4 pages as the content needs. It also uses a light,
 * print-friendly layout (dark backgrounds waste ink and print poorly) while
 * keeping the app's accent colors for headers and score bars.
 */

const COLORS = {
  violet: [124, 92, 252] as [number, number, number],
  teal: [46, 176, 148] as [number, number, number],
  amber: [217, 138, 30] as [number, number, number],
  red: [214, 60, 90] as [number, number, number],
  textDark: [30, 24, 46] as [number, number, number],
  textMuted: [110, 100, 130] as [number, number, number],
  track: [230, 226, 240] as [number, number, number],
};

function scoreRgb(score: number): [number, number, number] {
  if (score >= 75) return COLORS.teal;
  if (score >= 50) return COLORS.amber;
  return COLORS.red;
}

interface Props {
  result: AnalysisResult;
  rawText: string;
}

export function ExportReport({ result, rawText }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      function ensureSpace(height: number) {
        if (y + height > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      }

      function heading(text: string, size = 13) {
        ensureSpace(size + 14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(...COLORS.textDark);
        doc.text(text, margin, y);
        y += size + 10;
      }

      function paragraph(text: string, size = 10, color: [number, number, number] = COLORS.textDark) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines: string[] = doc.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          ensureSpace(size + 4);
          doc.text(line, margin, y);
          y += size + 4;
        }
        y += 4;
      }

      function bar(label: string, value: number) {
        ensureSpace(28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...COLORS.textMuted);
        doc.text(label, margin, y);
        doc.text(`${value}/100`, margin + contentWidth - 30, y);
        y += 6;
        doc.setFillColor(...COLORS.track);
        doc.roundedRect(margin, y, contentWidth, 6, 3, 3, "F");
        doc.setFillColor(...scoreRgb(value));
        doc.roundedRect(margin, y, contentWidth * (Math.max(0, Math.min(100, value)) / 100), 6, 3, 3, "F");
        y += 18;
      }

      // --- Header ---
      doc.setFillColor(...COLORS.violet);
      doc.rect(0, 0, pageWidth, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...COLORS.textDark);
      doc.text("ATS Compatibility Report", margin, y + 16);
      y += 32;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(
        `${result.role} · ${result.seniority}  ·  Generated ${new Date().toLocaleDateString()}`,
        margin,
        y
      );
      y += 26;

      // --- Score ---
      const [sr, sg, sb] = scoreRgb(result.score);
      doc.setFillColor(sr, sg, sb);
      doc.circle(margin + 30, y + 20, 30, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text(String(result.score), margin + 30, y + 26, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("/ 100", margin + 30, y + 38, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.textDark);
      const summaryLines: string[] = doc.splitTextToSize(result.summary, contentWidth - 90);
      doc.text(summaryLines, margin + 76, y + 12);
      y += Math.max(76, summaryLines.length * 13 + 20);

      // --- Section scores ---
      heading("Section scores", 12);
      bar("Keyword match", result.sectionScores.keywordMatch);
      bar("Formatting", result.sectionScores.formatting);
      bar("Structure", result.sectionScores.structure);
      bar("Experience relevance", result.sectionScores.experience);
      y += 6;

      // --- Keywords ---
      heading("Matched keywords");
      paragraph(
        result.matchedKeywords.map((k) => k.keyword).join(", ") || "None detected.",
        9.5,
        COLORS.textMuted
      );
      heading("Missing keywords");
      paragraph(
        result.missingKeywords.map((k) => k.keyword).join(", ") || "None — great coverage.",
        9.5,
        COLORS.textMuted
      );

      // --- Suggestions ---
      heading("Suggestions to improve your score");
      result.suggestions.forEach((s, i) => {
        ensureSpace(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(...COLORS.textDark);
        doc.text(`${i + 1}. ${s.title}  [${s.impact.toUpperCase()} IMPACT]`, margin, y);
        y += 14;
        paragraph(s.detail, 9.5, COLORS.textMuted);
      });

      // --- Bullet rewrites ---
      if (result.bulletRewrites?.length) {
        heading("Rewrite these bullets");
        result.bulletRewrites.forEach((r, i) => {
          ensureSpace(24);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.red);
          doc.text(`${i + 1}. BEFORE`, margin, y);
          y += 12;
          paragraph(r.before, 9.5, COLORS.textMuted);

          ensureSpace(16);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.teal);
          doc.text("AFTER", margin, y);
          y += 12;
          paragraph(r.after, 9.5, COLORS.textDark);
          paragraph(r.reason, 8.5, COLORS.textMuted);
        });
      }

      // --- Formatting issues ---
      if (result.formattingIssues?.length) {
        heading("Formatting risk report");
        result.formattingIssues.forEach((f) => {
          paragraph(`• (${f.risk.toUpperCase()}) ${f.issue}`, 9.5, COLORS.textMuted);
        });
      }

      // --- ATS Parse Preview (new feature) ---
      doc.addPage();
      y = margin;
      heading("How an ATS actually reads your resume", 13);
      paragraph(
        "This is the raw text our parser extracted from your file — the same kind of text a real ATS engine works with, stripped of all visual formatting.",
        9.5,
        COLORS.textMuted
      );
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textDark);
      const rawLines: string[] = doc.splitTextToSize(rawText, contentWidth);
      for (const line of rawLines) {
        ensureSpace(11);
        doc.text(line, margin, y);
        y += 10.5;
      }

      doc.save("ats-report.pdf");
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
