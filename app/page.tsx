"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Sparkles, ArrowRight, RotateCcw, Lock } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { ScanBeam } from "@/components/ScanBeam";
import { ScoreGauge } from "@/components/ScoreGauge";
import { SectionScores } from "@/components/SectionScores";
import { KeywordPills } from "@/components/KeywordPills";
import { SuggestionList, FormattingIssuesList } from "@/components/SuggestionList";
import { PaywallCard } from "@/components/PaywallCard";
import { JobsList } from "@/components/JobsList";
import { ExportReport } from "@/components/ExportReport";
import { ParsePreview } from "@/components/ParsePreview";
import { AnalysisResult, JobListing, ParsePreview as ParsePreviewType } from "@/types";

type Stage = "landing" | "scanning" | "results";

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [lockedPayload, setLockedPayload] = useState<string | null>(null);
  const [totalSuggestionCount, setTotalSuggestionCount] = useState(0);
  const [totalMissingKeywordCount, setTotalMissingKeywordCount] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [parsePreview, setParsePreview] = useState<ParsePreviewType | null>(null);

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobsFetched, setJobsFetched] = useState(false);

  async function handleSubmit() {
    if (!resumeFile) return;
    setError(null);
    setStage("scanning");
    try {
      const form = new FormData();
      form.append("resume", resumeFile);
      form.append("jobDescription", jobDescription);

      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");

      setResult(data.result);
      setAnalysisId(data.analysisId);
      setLockedPayload(data.lockedPayload);
      setTotalSuggestionCount(data.totalSuggestionCount);
      setTotalMissingKeywordCount(data.totalMissingKeywordCount);
      setParsePreview(data.parsePreview);
      setUnlocked(false);
      setStage("results");
    } catch (e: any) {
      setError(e.message);
      setStage("landing");
    }
  }

  function handleUnlocked(fullResult: AnalysisResult, rawText: string) {
    setResult(fullResult);
    setParsePreview((prev) => (prev ? { ...prev, rawText } : prev));
    setUnlocked(true);
  }

  async function handleFindJobs() {
    if (!result) return;
    setJobsLoading(true);
    setJobsError(null);
    setJobsFetched(true);
    try {
      const keywords = [...result.matchedKeywords, ...result.missingKeywords]
        .map((k) => k.keyword)
        .slice(0, 15)
        .join(",");
      const params = new URLSearchParams({ role: result.role, keywords });
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not fetch jobs.");
      setJobs(data.jobs);
    } catch (e: any) {
      setJobsError(e.message);
    } finally {
      setJobsLoading(false);
    }
  }

  function reset() {
    setStage("landing");
    setResumeFile(null);
    setJobDescription("");
    setResult(null);
    setAnalysisId(null);
    setLockedPayload(null);
    setUnlocked(false);
    setParsePreview(null);
    setJobs([]);
    setJobsFetched(false);
    setError(null);
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 grid-overlay opacity-[0.15]" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Radar size={20} className="text-signal-cyan" />
          <span className="font-display text-lg font-semibold tracking-tight text-mist-bright">
            ScanScore
          </span>
        </div>
        {stage !== "landing" && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full border border-ink-line px-3 py-1.5 font-mono text-xs text-mist hover:border-signal-cyan hover:text-signal-cyan"
          >
            <RotateCcw size={12} /> New scan
          </button>
        )}
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.section
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-8"
            >
              <div className="mb-14 text-center">
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-signal-cyan/30 bg-signal-cyan/5 px-3 py-1 font-mono text-[11px] text-signal-cyan">
                  <Sparkles size={11} /> Built for real ATS parsers, not guesswork
                </span>
                <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight text-mist-bright sm:text-5xl">
                  Find out if your resume gets{" "}
                  <span className="text-signal-cyan text-glow">seen</span> — before you hit apply.
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-mist">
                  Upload your resume and a job description. Get an instant compatibility
                  score, exactly which keywords you're missing, and live job openings
                  ranked by fit.
                </p>
              </div>

              <UploadZone
                resumeFile={resumeFile}
                onResumeChange={setResumeFile}
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                onSubmit={handleSubmit}
                isBusy={false}
                error={error}
              />
            </motion.section>
          )}

          {stage === "scanning" && (
            <motion.section
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[60vh] items-center justify-center"
            >
              <ScanBeam fileName={resumeFile?.name ?? "resume"} />
            </motion.section>
          )}

          {stage === "results" && result && (
            <motion.section
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10 pt-4"
            >
              <div className="space-y-10">
                {/* Score overview */}
                <div className="grid gap-8 md:grid-cols-[auto,1fr] md:items-center">
                  <ScoreGauge score={result.score} />
                  <div>
                    <p className="mb-1 font-mono text-xs uppercase tracking-widest text-mist">
                      {result.role} · {result.seniority}
                    </p>
                    <p className="mb-4 text-mist-bright">{result.summary}</p>
                    <SectionScores scores={result.sectionScores} />
                  </div>
                </div>

                {/* ATS Parse Preview — new standout feature */}
                {parsePreview && (
                  <ParsePreview
                    parseQualityScore={parsePreview.parseQualityScore}
                    flags={parsePreview.flags}
                    rawText={unlocked && parsePreview.rawText ? parsePreview.rawText : parsePreview.rawTextPreview}
                    truncated={parsePreview.rawTextTruncated}
                    unlocked={unlocked}
                  />
                )}

                {/* Keywords */}
                <div className="panel rounded-xl p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold text-mist-bright">
                    Keyword breakdown
                  </h3>
                  <KeywordPills
                    matched={result.matchedKeywords}
                    missing={result.missingKeywords}
                    unlocked={unlocked}
                    lockedCount={Math.max(0, totalMissingKeywordCount - result.missingKeywords.length)}
                  />
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className="mb-4 font-display text-lg font-semibold text-mist-bright">
                    Suggestions to improve your score
                  </h3>
                  <SuggestionList
                    visibleSuggestions={result.suggestions}
                    lockedCount={Math.max(0, totalSuggestionCount - result.suggestions.length)}
                    unlocked={unlocked}
                  />
                </div>

                {/* Formatting issues */}
                <div>
                  <h3 className="mb-4 font-display text-lg font-semibold text-mist-bright">
                    Formatting risk report
                  </h3>
                  <FormattingIssuesList issues={result.formattingIssues} unlocked={unlocked} />
                </div>
              </div>

              {/* Paywall */}
              {!unlocked && analysisId && lockedPayload && (
                <PaywallCard
                  analysisId={analysisId}
                  lockedPayload={lockedPayload}
                  lockedSuggestionCount={Math.max(0, totalSuggestionCount - result.suggestions.length)}
                  onUnlocked={handleUnlocked}
                />
              )}

              {unlocked && parsePreview?.rawText && (
                <div className="flex justify-center">
                  <ExportReport result={result} rawText={parsePreview.rawText} />
                </div>
              )}

              {/* Jobs */}
              <div className="border-t border-ink-line pt-10">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-mist-bright">
                    Live openings matching your resume
                  </h3>
                  {unlocked && !jobsFetched && (
                    <button
                      onClick={handleFindJobs}
                      className="flex items-center gap-1.5 rounded-full bg-signal-cyan px-4 py-2 font-mono text-xs font-semibold text-ink"
                    >
                      Find matching jobs <ArrowRight size={13} />
                    </button>
                  )}
                </div>
                {unlocked ? (
                  jobsFetched && (
                    <JobsList jobs={jobs} isLoading={jobsLoading} error={jobsError} />
                  )
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-ink-line bg-ink-panel/60 px-5 py-6 text-sm text-mist">
                    <Lock size={16} className="shrink-0 text-signal-cyan" />
                    Unlock the full report above to see live job openings ranked by fit.
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <footer className="relative z-10 border-t border-ink-line py-8 text-center font-mono text-[11px] text-mist/50">
        ScanScore — your files are analyzed on request and never stored.
      </footer>
    </main>
  );
}
