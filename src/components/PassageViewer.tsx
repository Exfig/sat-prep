import type { ReactNode } from 'react';
import type { PassageData } from '../types';

interface PassageViewerProps {
  passage: PassageData;
}

/** Split text around exact substring(s), returning fragments with matches underlined. */
function renderWithUnderline(text: string, underlineText?: string | string[]): ReactNode {
  if (!underlineText) return text;

  const terms = Array.isArray(underlineText) ? underlineText : [underlineText];
  // Build segments: find all occurrences, sort by position
  const matches: { start: number; end: number }[] = [];
  for (const term of terms) {
    const idx = text.indexOf(term);
    if (idx !== -1) matches.push({ start: idx, end: idx + term.length });
  }
  if (matches.length === 0) return text;
  matches.sort((a, b) => a.start - b.start);

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const { start, end } = matches[i];
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(<span key={i} className="underline decoration-2 underline-offset-2">{text.slice(start, end)}</span>);
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}

export default function PassageViewer({ passage }: PassageViewerProps) {
  const paragraphs = passage.text.split('\n\n');

  // Build lines with optional line numbers
  let globalLineNumber = 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-5 md:p-6" role="region" aria-label="Reading passage" data-question-content>
      <div
        className="font-serif text-sm sm:text-base leading-[1.7] sm:leading-[1.8] text-slate-800"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >
        {paragraphs.map((paragraph, pIdx) => {
          if (!passage.lineNumbers) {
            return (
              <p key={pIdx} className={pIdx > 0 ? 'mt-4' : ''}>
                {renderWithUnderline(paragraph, passage.underlineText)}
              </p>
            );
          }

          // With line numbers: render each line individually
          const lines = paragraph.split('\n');
          return (
            <div key={pIdx} className={pIdx > 0 ? 'mt-4' : ''}>
              {lines.map((line, lIdx) => {
                globalLineNumber++;
                const lineNum = globalLineNumber;
                // Show line number every 5 lines and on line 1
                const showNumber = lineNum === 1 || lineNum % 5 === 0;

                return (
                  <div key={lIdx} className="flex">
                    <span
                      className="mr-4 inline-block w-8 shrink-0 select-none text-right font-mono text-xs leading-[1.8] text-slate-400"
                      aria-hidden="true"
                    >
                      {showNumber ? lineNum : ''}
                    </span>
                    <span className="flex-1">
                      {renderWithUnderline(line, passage.underlineText)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {passage.source && (
        <p className="mt-4 border-t border-slate-200 pt-3 text-sm italic text-slate-500">
          {passage.source}
        </p>
      )}
    </div>
  );
}
