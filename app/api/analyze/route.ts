import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { extractText, detectFormattingRisks, computeParseQuality } from "@/lib/extractText";
import { analyzeResumeWithClaude } from "@/lib/gemini";
import { encryptPayload } from "@/lib/crypto";
import { jobDescriptionSchema } from "@/lib/schemas";
import { AnalysisResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_SUGGESTION_COUNT = 2;
const RAW_TEXT_PREVIEW_CHARS = 600;
const FREE_BULLET_REWRITE_COUNT = 1;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume");
    const jobDescriptionRaw = formData.get("jobDescription");

    if (!resumeFile || !(resumeFile instanceof File)) {
      return NextResponse.json(
        { error: "Please attach a resume file (PDF, DOCX, or TXT)." },
        { status: 400 }
      );
    }

    if (resumeFile.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Resume file is too large (max 8MB)." },
        { status: 400 }
      );
    }

    const parsedJD = jobDescriptionSchema.safeParse({
      jobDescription: jobDescriptionRaw,
    });
    if (!parsedJD.success) {
      return NextResponse.json(
        { error: parsedJD.error.issues[0]?.message ?? "Invalid job description." },
        { status: 400 }
      );
    }

    const resumeText = await extractText(resumeFile);
    if (resumeText.length < 30) {
      return NextResponse.json(
        {
          error:
            "Couldn't extract meaningful text from that file. If it's a scanned image or heavily designed PDF, try exporting a text-based PDF instead.",
        },
        { status: 422 }
      );
    }

    const formattingRisks = detectFormattingRisks(resumeText);
    const { score: parseQualityScore, flags: parseFlags } = computeParseQuality(resumeText);

    const result: AnalysisResult = await analyzeResumeWithClaude(
      resumeText,
      parsedJD.data.jobDescription
    );

    // Merge in our own heuristic risks alongside the LLM's, de-duplicated by text.
    const existingIssues = new Set(result.formattingIssues?.map((f) => f.issue) ?? []);
    for (const risk of formattingRisks) {
      if (!existingIssues.has(risk)) {
        result.formattingIssues = [
          ...(result.formattingIssues ?? []),
          { issue: risk, risk: "medium" },
        ];
      }
    }

    const sortedSuggestions = [...(result.suggestions ?? [])].sort((a, b) => {
      const weight = { high: 0, medium: 1, low: 2 };
      return weight[a.impact] - weight[b.impact];
    });
    result.suggestions = sortedSuggestions;
    result.bulletRewrites = result.bulletRewrites ?? [];

    const freeSuggestionIds = sortedSuggestions
      .slice(0, FREE_SUGGESTION_COUNT)
      .map((s) => s.id);

    const analysisId = uuid();

    // Full result + full raw resume text, locked. Only decrypted server-side
    // after the (currently demo) unlock flow — see app/api/unlock/route.ts.
    const lockedPayload = encryptPayload({ analysisId, result, rawText: resumeText });

    // Public response: everything EXCEPT suggestions/bullet rewrites beyond the
    // free count, missingKeywords, and formattingIssues detail — those are the
    // paywalled value.
    const freePreview: AnalysisResult = {
      ...result,
      suggestions: sortedSuggestions.slice(0, FREE_SUGGESTION_COUNT),
      bulletRewrites: result.bulletRewrites.slice(0, FREE_BULLET_REWRITE_COUNT),
      missingKeywords: result.missingKeywords?.slice(0, 3) ?? [],
      formattingIssues: [],
    };

    return NextResponse.json({
      analysisId,
      result: freePreview,
      freeSuggestionIds,
      totalSuggestionCount: sortedSuggestions.length,
      totalMissingKeywordCount: result.missingKeywords?.length ?? 0,
      totalBulletRewriteCount: result.bulletRewrites.length,
      lockedPayload,
      role: result.role,
      // "ATS Parse Preview" feature: quality score + flags are free (they're a
      // hook), the full raw text is capped here and unlocked via /api/unlock.
      parsePreview: {
        parseQualityScore,
        flags: parseFlags,
        rawTextPreview: resumeText.slice(0, RAW_TEXT_PREVIEW_CHARS),
        rawTextTruncated: resumeText.length > RAW_TEXT_PREVIEW_CHARS,
      },
    });
  } catch (err: any) {
    console.error("[/api/analyze] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Something went wrong while analyzing the resume." },
      { status: 500 }
    );
  }
}
