import type { ReactNode } from 'react';
import type { PassageData } from '../types';

interface PassageViewerProps {
  passage: PassageData;
}

/** Split text around an exact substring, returning fragments with the match underlined. */
function renderWithUnderline(text: string, underlineText?: string): ReactNode {
  if (!underlineText) return text;

  const idx = text.indexOf(underlineText);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const after = text.slice(idx + underlineText.length);

  return (
    <>
      {before}
      <span className="underline decoration-2 underline-offset-2">{underlineText}</span>
      {after}
    </>
  );
}

export default function PassageViewer({ passage }: PassageViewerProps) {
  const paragraphs = passage.text.split('\n\n');

  // Build lines with optional line numbers
  let globalLineNumber = 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-5 md:p-6" role="region" aria-label="Reading passage">
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
