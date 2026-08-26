import { AnalysisResult } from "@/types";

// Free-tier Gemini model. "gemini-3.6-flash" is on Google's free tier
// (generous per-minute/per-day request limits, no billing required).
// Model IDs on the free tier change over time — if this one 404s, check
// https://ai.google.dev/gemini-api/docs/models for the current free row.
// Get a key at https://aistudio.google.com/apikey
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and senior technical recruiter.
You evaluate how well a resume matches a specific job description, the way real ATS software
(Workday, Greenhouse, Taleo, iCIMS) and a human recruiter would, in two passes.

Score fairly and specifically — do not default to a generic 70-85 band. Use the full 0-100 range.

Respond with ONLY a single valid JSON object, no markdown fences, no preamble, matching this exact shape:

{
  "score": number (0-100, overall ATS compatibility + relevance score),
  "summary": string (2-3 sentences, direct and specific, written to the candidate as "you"),
  "role": string (best-guess job title/role the JD is for),
  "seniority": string (e.g. "Entry-level", "Mid-level", "Senior", "Lead/Staff"),
  "sectionScores": {
    "keywordMatch": number (0-100),
    "formatting": number (0-100),
    "structure": number (0-100),
    "experience": number (0-100)
  },
  "matchedKeywords": [ { "keyword": string, "found": true, "importance": "critical"|"important"|"nice-to-have" } ],
  "missingKeywords": [ { "keyword": string, "found": false, "importance": "critical"|"important"|"nice-to-have" } ],
  "suggestions": [
    {
      "id": string (short slug, e.g. "add-quantified-impact"),
      "title": string (short, actionable, under 8 words),
      "detail": string (2-3 sentences of specific, actionable advice referencing THIS resume/JD),
      "impact": "high"|"medium"|"low",
      "category": "keywords"|"formatting"|"structure"|"experience"|"skills"
    }
  ],
  "formattingIssues": [ { "issue": string, "risk": "high"|"medium"|"low" } ]
}

Rules:
- Provide 6 to 9 suggestions, ordered by impact (high first).
- Provide 8 to 15 matchedKeywords and 5 to 12 missingKeywords drawn from the actual job description.
- Base every claim on the actual resume and job description text provided. Never invent employers, titles, or numbers.
- If the resume text looks garbled or too short, reflect that honestly in formattingIssues and lower the formatting score.`;

export async function analyzeResumeWithClaude(
  resumeText: string,
  jobDescriptionText: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey and add it to your environment variables."
    );
  }

  const userPrompt = `RESUME TEXT:
"""
${resumeText.slice(0, 12000)}
"""

JOB DESCRIPTION TEXT:
"""
${jobDescriptionText.slice(0, 8000)}
"""

Analyze the resume against the job description and return the JSON object described in your instructions.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();

  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    throw new Error(
      `Gemini stopped early (${finishReason}). The resume/job description may be too long — try trimming it.`
    );
  }

  const text: string | undefined = candidate?.content?.parts
    ?.map((p: any) => p.text)
    .filter(Boolean)
    .join("");

  if (!text) {
    throw new Error("Gemini API returned no text content.");
  }

  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Failed to parse Gemini's analysis output as JSON.");
  }

  return parsed;
}
