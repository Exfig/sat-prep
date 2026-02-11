import type { ConfidenceRating } from '../types';

interface ConfidenceSliderProps {
  onRate: (rating: ConfidenceRating) => void;
}

const ratings: { value: ConfidenceRating; label: string; color: string }[] = [
  { value: 1, label: 'Wild Guess', color: 'bg-red-500 hover:bg-red-600' },
  { value: 2, label: 'Unsure', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: 3, label: 'Maybe', color: 'bg-amber-600 hover:bg-amber-700' },
  { value: 4, label: 'Fairly Sure', color: 'bg-lime-600 hover:bg-lime-700' },
  { value: 5, label: 'Certain', color: 'bg-emerald-500 hover:bg-emerald-600' },
];

export default function ConfidenceSlider({ onRate }: ConfidenceSliderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">How confident are you?</h3>
      <p className="text-xs text-slate-500 mb-3 sm:mb-4">Rate your confidence to track calibration</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="group" aria-label="Confidence rating options">
        {ratings.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => onRate(value)}
            className={`min-h-[44px] py-2.5 px-2 rounded-lg text-white font-medium
              transition-all duration-200 ${color} shadow-sm hover:shadow-md`}
            aria-label={`${value} out of 5: ${label}`}
          >
            <span className="block text-lg leading-none" aria-hidden="true">{value}</span>
            <span className="block text-[0.65rem] mt-0.5 opacity-90">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
