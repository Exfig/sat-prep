import * as pdfjsLib from 'pdfjs-dist';
import type { DomainId, PSATScoreData } from '../types';

// Use bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/** Extract all text from a PDF file */
export async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const parts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    parts.push(pageText);
  }

  return parts.join('\n');
}

// Map PSAT report domain names to our DomainIds
const DOMAIN_MAP: Record<string, DomainId> = {
  'Information and Ideas': 'rw-information-and-ideas',
  'Craft and Structure': 'rw-craft-and-structure',
  'Expression of Ideas': 'rw-expression-of-ideas',
  'Standard English Conventions': 'rw-standard-english-conventions',
  'Algebra': 'math-algebra',
  'Advanced Math': 'math-advanced-math',
  'Problem-Solving and Data Analysis': 'math-problem-solving-data-analysis',
  'Geometry and Trigonometry': 'math-geometry-and-trigonometry',
};

/** Parse PSAT score report text into structured data */
export function parsePSATScores(text: string): PSATScoreData | null {
  // Extract total score - look for "TOTAL SCORE" followed by a number
  const totalMatch = text.match(/TOTAL\s*SCORE\s*(\d{3,4})/i);
  const totalScore = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  // Extract section scores
  // Pattern: "Reading and Writing" ... number in 160-760 range
  const rwMatch = text.match(/Reading\s+and\s+Writing\s+(\d{3})/);
  const mathMatch = text.match(/Math\s+(\d{3})\s+\d{3}/);
  // Fallback: look for section score pattern near "SECTION SCORES"
  const sectionBlock = text.match(/SECTION\s*SCORES.*?Reading\s+and\s+Writing\s+(\d{3}).*?Math\s+(\d{3})/is);

  const readingWritingScore = rwMatch
    ? parseInt(rwMatch[1], 10)
    : sectionBlock ? parseInt(sectionBlock[1], 10) : 0;
  const mathScore = mathMatch
    ? parseInt(mathMatch[1], 10)
    : sectionBlock ? parseInt(sectionBlock[2], 10) : 0;

  // Extract domain performance bands
  const domainPerformance: Partial<Record<DomainId, { low: number; high: number }>> = {};

  for (const [name, domainId] of Object.entries(DOMAIN_MAP)) {
    // Pattern: "Domain Name" ... "Performance: NNN-NNN"
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped + '[\\s\\S]*?Performance:\\s*(\\d{3})-(\\d{3})', 'i');
    const match = text.match(pattern);
    if (match) {
      domainPerformance[domainId] = {
        low: parseInt(match[1], 10),
        high: parseInt(match[2], 10),
      };
    }
  }

  // Need at least some data to be valid
  const domainCount = Object.keys(domainPerformance).length;
  if (totalScore === 0 && domainCount === 0) return null;

  return {
    totalScore,
    readingWritingScore,
    mathScore,
    domainPerformance,
    importedAt: Date.now(),
  };
}

/** Rank domains by weakness (lowest midpoint first) */
export function rankDomainsByWeakness(data: PSATScoreData): DomainId[] {
  const entries = Object.entries(data.domainPerformance) as [DomainId, { low: number; high: number }][];
  return entries
    .sort((a, b) => {
      const midA = (a[1].low + a[1].high) / 2;
      const midB = (b[1].low + b[1].high) / 2;
      return midA - midB;
    })
    .map(([id]) => id);
}
