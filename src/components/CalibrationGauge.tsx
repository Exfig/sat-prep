interface CalibrationGaugeProps {
  label: string;
  score: number; // -1 (overconfident) to 1 (underconfident)
  wellCalibratedPercent: number;
  totalRated: number;
}

export default function CalibrationGauge({
  label,
  score,
  wellCalibratedPercent,
  totalRated,
}: CalibrationGaugeProps) {
  if (totalRated < 10) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500">Not enough data yet</p>
        <p className="text-xs text-slate-400 mt-1">Answer at least 10 rated questions to see calibration</p>
      </div>
    );
  }

  // Map score from [-1, 1] to percentage position [0, 100]
  const markerPosition = ((score + 1) / 2) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Calibration</h3>
        <span className="text-xs text-slate-500">{totalRated} rated</span>
      </div>

      <div className="relative mb-2">
        {/* Bar with 3 zones */}
        <div className="flex h-6 rounded-full overflow-hidden">
          <div className="flex-1 bg-red-200" title="Overconfident" />
          <div className="flex-1 bg-emerald-200" title="Well-calibrated" />
          <div className="flex-1 bg-blue-200" title="Underconfident" />
        </div>

        {/* Marker */}
        <div
          className="absolute top-0 h-6 w-1 bg-slate-800 rounded-full"
          style={{ left: `${Math.min(Math.max(markerPosition, 0), 100)}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <div className="flex justify-between text-[0.6rem] text-slate-400 mb-3">
        <span>Overconfident</span>
        <span>Well-calibrated</span>
        <span>Underconfident</span>
      </div>

      <div className="text-center">
        <p className="text-2xl font-bold text-slate-800">{Math.round(wellCalibratedPercent)}%</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
