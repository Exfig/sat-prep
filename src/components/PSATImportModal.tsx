import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { extractTextFromPDF, parsePSATScores, rankDomainsByWeakness } from '../utils/psatParser';
import { DOMAIN_NAMES } from '../types';
import type { DomainId, PSATScoreData } from '../types';

const ALL_DOMAINS: { id: DomainId; label: string }[] = [
  { id: 'rw-information-and-ideas', label: 'Information and Ideas' },
  { id: 'rw-craft-and-structure', label: 'Craft and Structure' },
  { id: 'rw-expression-of-ideas', label: 'Expression of Ideas' },
  { id: 'rw-standard-english-conventions', label: 'Standard English Conventions' },
  { id: 'math-algebra', label: 'Algebra' },
  { id: 'math-advanced-math', label: 'Advanced Math' },
  { id: 'math-problem-solving-data-analysis', label: 'Problem-Solving & Data Analysis' },
  { id: 'math-geometry-and-trigonometry', label: 'Geometry & Trigonometry' },
];

interface Props {
  onClose: () => void;
}

export default function PSATImportModal({ onClose }: Props) {
  const setPSATScores = useAppStore((s) => s.setPSATScores);
  const [tab, setTab] = useState<'upload' | 'manual'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<PSATScoreData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manualTotal, setManualTotal] = useState('');
  const [manualRW, setManualRW] = useState('');
  const [manualMath, setManualMath] = useState('');
  const [manualDomains, setManualDomains] = useState<Record<string, { low: string; high: string }>>(
    Object.fromEntries(ALL_DOMAINS.map((d) => [d.id, { low: '', high: '' }])),
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const text = await extractTextFromPDF(file);
      const result = parsePSATScores(text);
      if (!result) {
        setError('Could not parse PSAT scores from this PDF. Try entering scores manually.');
        return;
      }
      setParsed(result);
    } catch {
      setError('Error reading PDF. Try entering scores manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    const total = parseInt(manualTotal, 10) || 0;
    const rw = parseInt(manualRW, 10) || 0;
    const math = parseInt(manualMath, 10) || 0;

    const domainPerformance: Partial<Record<DomainId, { low: number; high: number }>> = {};
    for (const d of ALL_DOMAINS) {
      const low = parseInt(manualDomains[d.id].low, 10);
      const high = parseInt(manualDomains[d.id].high, 10);
      if (low > 0 && high > 0) {
        domainPerformance[d.id] = { low, high };
      }
    }

    if (total === 0 && Object.keys(domainPerformance).length === 0) {
      setError('Please enter at least your total score or domain scores.');
      return;
    }

    const data: PSATScoreData = {
      totalScore: total,
      readingWritingScore: rw,
      mathScore: math,
      domainPerformance,
      importedAt: Date.now(),
    };
    setParsed(data);
  };

  const handleConfirm = () => {
    if (!parsed) return;
    setPSATScores(parsed);
    onClose();
  };

  const ranked = parsed ? rankDomainsByWeakness(parsed) : [];

  // Score band color based on midpoint
  const getBandColor = (low: number, high: number) => {
    const mid = (low + high) / 2;
    if (mid >= 600) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (mid >= 500) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (mid >= 400) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-200 text-red-900 border-red-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Import PSAT/NMSQT Scores</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Show preview if we have parsed data */}
          {parsed ? (
            <div>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-2xl font-bold text-slate-800">{parsed.totalScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Reading & Writing</p>
                    <p className="text-2xl font-bold text-indigo-600">{parsed.readingWritingScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Math</p>
                    <p className="text-2xl font-bold text-indigo-600">{parsed.mathScore}</p>
                  </div>
                </div>

                {ranked.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Domain Performance (weakest first)</p>
                    {ranked.map((domainId, i) => {
                      const band = parsed.domainPerformance[domainId];
                      if (!band) return null;
                      return (
                        <div
                          key={domainId}
                          className={`flex items-center justify-between p-2 rounded-lg border ${getBandColor(band.low, band.high)}`}
                        >
                          <div className="flex items-center gap-2">
                            {i === 0 && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">Weakest</span>}
                            <span className="text-sm font-medium">{DOMAIN_NAMES[domainId]}</span>
                          </div>
                          <span className="text-sm font-mono">{band.low}-{band.high}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium
                    hover:bg-indigo-700 transition-colors min-h-[44px]"
                >
                  Save Scores
                </button>
                <button
                  onClick={() => setParsed(null)}
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium
                    hover:bg-slate-200 transition-colors min-h-[44px]"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => { setTab('upload'); setError(''); }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    tab === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  onClick={() => { setTab('manual'); setError(''); }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    tab === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Enter Manually
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {tab === 'upload' ? (
                <div>
                  <p className="text-sm text-slate-600 mb-3">
                    Upload your PSAT/NMSQT score report PDF from College Board.
                  </p>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer
                      hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {loading ? (
                      <p className="text-sm text-slate-500">Parsing PDF...</p>
                    ) : (
                      <>
                        <svg className="w-10 h-10 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-slate-700">Click to upload PDF</p>
                        <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 mb-3">
                    Enter scores from your PSAT/NMSQT score report.
                  </p>

                  {/* Section scores */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Total Score</label>
                      <input
                        type="number"
                        min="320"
                        max="1520"
                        value={manualTotal}
                        onChange={(e) => setManualTotal(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="960"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">R&W Score</label>
                      <input
                        type="number"
                        min="160"
                        max="760"
                        value={manualRW}
                        onChange={(e) => setManualRW(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="450"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Math Score</label>
                      <input
                        type="number"
                        min="160"
                        max="760"
                        value={manualMath}
                        onChange={(e) => setManualMath(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="510"
                      />
                    </div>
                  </div>

                  {/* Domain performance bands */}
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Domain Performance Bands
                  </p>
                  <div className="space-y-2 mb-4">
                    {ALL_DOMAINS.map((d) => (
                      <div key={d.id} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-40 shrink-0 truncate" title={d.label}>
                          {d.label}
                        </span>
                        <input
                          type="number"
                          min="160"
                          max="760"
                          value={manualDomains[d.id].low}
                          onChange={(e) =>
                            setManualDomains((prev) => ({
                              ...prev,
                              [d.id]: { ...prev[d.id], low: e.target.value },
                            }))
                          }
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm text-center
                            focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Low"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="number"
                          min="160"
                          max="760"
                          value={manualDomains[d.id].high}
                          onChange={(e) =>
                            setManualDomains((prev) => ({
                              ...prev,
                              [d.id]: { ...prev[d.id], high: e.target.value },
                            }))
                          }
                          className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm text-center
                            focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="High"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleManualSubmit}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium
                      hover:bg-indigo-700 transition-colors min-h-[44px]"
                  >
                    Preview Scores
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
