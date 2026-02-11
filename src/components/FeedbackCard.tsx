interface FeedbackCardProps {
  correct: boolean;
  correctAnswer: string | number;
  userAnswer: string | number;
  explanation: string;
  relatedConcepts: string[];
  formula?: string;
}

export default function FeedbackCard({
  correct,
  correctAnswer,
  userAnswer,
  explanation,
  relatedConcepts,
  formula,
}: FeedbackCardProps) {
  return (
    <div
      className={`rounded-xl border-2 p-6 transition-all duration-200 ${
        correct
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-red-500 bg-red-50'
      }`}
      role="region"
      aria-label={correct ? 'Correct answer feedback' : 'Incorrect answer feedback'}
      aria-live="polite"
    >
      {/* Result header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl" aria-hidden="true">{correct ? '\u2713' : '\u2717'}</span>
        <h3 className={`text-xl font-bold ${correct ? 'text-emerald-700' : 'text-red-700'}`}>
          {correct ? 'Correct!' : 'Incorrect'}
        </h3>
      </div>

      {/* Show correct answer when wrong */}
      {!correct && (
        <div className="mb-4 p-3 bg-white/60 rounded-lg">
          <p className="text-sm text-slate-500">Your answer</p>
          <p className="font-medium text-red-700">{String(userAnswer)}</p>
          <p className="text-sm text-slate-500 mt-2">Correct answer</p>
          <p className="font-medium text-emerald-700">{String(correctAnswer)}</p>
        </div>
      )}

      {/* Explanation */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-1">Explanation</h4>
        <p className="text-slate-600 leading-relaxed">{explanation}</p>
      </div>

      {/* Formula */}
      {formula && (
        <div className="bg-white/60 border border-slate-200 rounded-lg px-4 py-3 mb-4 font-mono text-sm text-slate-700">
          {formula}
        </div>
      )}

      {/* Related concepts */}
      {relatedConcepts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Related Concepts</h4>
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((concept) => (
              <span
                key={concept}
                className="px-2 py-1 rounded-full bg-white/80 text-xs font-medium text-slate-600 border border-slate-200"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
