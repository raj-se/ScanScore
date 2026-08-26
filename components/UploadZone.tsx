"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, X, ClipboardPaste } from "lucide-react";

interface UploadZoneProps {
  resumeFile: File | null;
  onResumeChange: (file: File | null) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  isBusy: boolean;
  error: string | null;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export function UploadZone({
  resumeFile,
  onResumeChange,
  jobDescription,
  onJobDescriptionChange,
  onSubmit,
  isBusy,
  error,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onResumeChange(file);
    },
    [onResumeChange]
  );

  const canSubmit = resumeFile && jobDescription.trim().length >= 50 && !isBusy;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Resume dropzone */}
      <div>
        <label className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-mist">
          <FileText size={14} className="text-signal-cyan" />
          01 · Resume
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative flex h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? "border-signal-cyan bg-signal-cyan/5"
              : resumeFile
              ? "border-signal-green/50 bg-signal-green/5"
              : "border-ink-line bg-ink-panel/50 hover:border-mist/50"
          }`}
        >
          {resumeFile ? (
            <div className="flex flex-col items-center gap-2">
              <FileText size={28} className="text-signal-green" />
              <p className="max-w-[220px] truncate font-medium text-mist-bright">
                {resumeFile.name}
              </p>
              <p className="font-mono text-xs text-mist">
                {(resumeFile.size / 1024).toFixed(0)} KB
              </p>
              <button
                onClick={() => onResumeChange(null)}
                className="mt-1 flex items-center gap-1 text-xs text-signal-red hover:underline"
              >
                <X size={12} /> Remove
              </button>
            </div>
          ) : (
            <>
              <Upload size={26} className="mb-3 text-mist" />
              <p className="text-sm text-mist-bright">
                Drag & drop your resume, or{" "}
                <label className="cursor-pointer text-signal-cyan underline underline-offset-2">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => onResumeChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </p>
              <p className="mt-2 font-mono text-[11px] text-mist/70">
                PDF · DOCX · TXT — up to 8MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Job description */}
      <div>
        <label className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-mist">
          <ClipboardPaste size={14} className="text-signal-cyan" />
          02 · Job description
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the full job description here — the more complete, the more accurate your score."
          className="h-56 w-full resize-none rounded-xl border border-ink-line bg-ink-panel/50 p-4 text-sm text-mist-bright placeholder:text-mist/50 focus:border-signal-cyan focus:outline-none focus:ring-1 focus:ring-signal-cyan"
        />
        <p className="mt-1 text-right font-mono text-[11px] text-mist/60">
          {jobDescription.trim().length} / 50 min chars
        </p>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="md:col-span-2 rounded-lg border border-signal-red/30 bg-signal-red/10 px-4 py-3 text-sm text-signal-red"
        >
          {error}
        </motion.p>
      )}

      <div className="md:col-span-2 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="group relative overflow-hidden rounded-full bg-signal-cyan px-10 py-3.5 font-display text-sm font-semibold text-ink transition-all disabled:cursor-not-allowed disabled:bg-ink-line disabled:text-mist"
        >
          <span className="relative z-10">
            {isBusy ? "Scanning…" : "Run ATS scan"}
          </span>
        </button>
      </div>
    </div>
  );
}
