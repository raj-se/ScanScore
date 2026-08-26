"use client";

import { motion } from "framer-motion";
import { Briefcase, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { JobListing } from "@/types";

function matchColor(pct: number): string {
  if (pct >= 70) return "text-signal-green border-signal-green/40 bg-signal-green/10";
  if (pct >= 45) return "text-signal-amber border-signal-amber/40 bg-signal-amber/10";
  return "text-mist border-ink-line bg-ink-panel";
}

export function JobsList({
  jobs,
  isLoading,
  error,
}: {
  jobs: JobListing[];
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-mist">
        <Loader2 size={16} className="animate-spin" /> Searching live listings…
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 px-4 py-3 text-sm text-signal-amber">
        {error}
      </p>
    );
  }

  if (jobs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-mist">
        No matching listings found right now — try again later.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {jobs.map((job, i) => (
        <motion.a
          key={job.id}
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="panel group flex flex-col gap-2 rounded-lg p-4 transition-colors hover:border-signal-cyan/50"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium leading-snug text-mist-bright group-hover:text-signal-cyan">
              {job.title}
            </h4>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] ${matchColor(job.matchPercent)}`}
            >
              {job.matchPercent}% match
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-mist">
            <Briefcase size={12} /> {job.company}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-mist">
            <MapPin size={12} /> {job.location}
          </p>
          {job.salary && (
            <p className="font-mono text-xs text-signal-green">{job.salary}</p>
          )}
          <span className="mt-1 flex items-center gap-1 font-mono text-[11px] text-mist/70 group-hover:text-signal-cyan">
            View listing <ExternalLink size={11} />
          </span>
        </motion.a>
      ))}
    </div>
  );
}
