export interface Suggestion {
  id: string;
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
  category: "keywords" | "formatting" | "structure" | "experience" | "skills";
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  importance: "critical" | "important" | "nice-to-have";
}

export interface FormattingIssue {
  issue: string;
  risk: "high" | "medium" | "low";
}

export interface AnalysisResult {
  score: number;
  summary: string;
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  suggestions: Suggestion[];
  formattingIssues: FormattingIssue[];
  sectionScores: {
    keywordMatch: number;
    formatting: number;
    structure: number;
    experience: number;
  };
  role: string;
  seniority: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  postedAt: string | null;
  source: string;
  matchPercent: number;
  salary?: string | null;
}

export interface AnalyzeApiResponse {
  analysisId: string;
  result: AnalysisResult;
  freeSuggestionIds: string[];
}

export interface ParsePreview {
  parseQualityScore: number;
  flags: string[];
  rawTextPreview: string;
  rawTextTruncated: boolean;
  rawText?: string; // present only after unlock (full extracted text)
}
