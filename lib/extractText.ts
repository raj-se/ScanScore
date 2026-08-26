import mammoth from "mammoth";

/**
 * Extracts plain text from an uploaded file buffer based on its mime type / extension.
 * Supports PDF, DOCX, and plain text. Throws a descriptive error for unsupported types.
 */
export async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    // Lazy import: pdf-parse touches the filesystem at module load in some setups,
    // so we only import it when actually needed (server-side route).
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return cleanText(data.text);
  }

  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  }

  if (type === "text/plain" || name.endsWith(".txt")) {
    return cleanText(buffer.toString("utf-8"));
  }

  throw new Error(
    "Unsupported file type. Please upload a PDF, DOCX, or plain text file."
  );
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Rough heuristic flags for ATS-hostile formatting, used to sanity-check the LLM's read. */
export function detectFormattingRisks(text: string): string[] {
  const risks: string[] = [];
  if (text.length < 200) {
    risks.push("Very little extractable text — resume may be image-based or heavily graphical.");
  }
  const tableLikeLines = text.split("\n").filter((l) => /\t{2,}|\s{4,}\S+\s{4,}/.test(l));
  if (tableLikeLines.length > 5) {
    risks.push("Layout suggests multi-column or table formatting, which many ATS parsers misread.");
  }
  if (!/@/.test(text)) {
    risks.push("No email address detected in extracted text.");
  }
  return risks;
}
