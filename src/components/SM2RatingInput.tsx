import type { SM2Rating } from '../types';

interface SM2RatingInputProps {
  onRate: (rating: SM2Rating) => void;
}

const ratings: { value: SM2Rating; label: string; color: string }[] = [
  { value: 0, label: 'Blackout', color: 'bg-red-500 hover:bg-red-600' },
  { value: 1, label: 'Wrong', color: 'bg-red-400 hover:bg-red-500' },
  { value: 2, label: 'Hard', color: 'bg-orange-400 hover:bg-orange-500' },
  { value: 3, label: 'Struggled', color: 'bg-yellow-400 hover:bg-yellow-500' },
  { value: 4, label: 'Good', color: 'bg-emerald-400 hover:bg-emerald-500' },
  { value: 5, label: 'Perfect', color: 'bg-emerald-500 hover:bg-emerald-600' },
];

export default function SM2RatingInput({ onRate }: SM2RatingInputProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">How well did you know this?</h3>
      <p className="text-xs text-slate-500 mb-4">Rate your recall to optimize review scheduling</p>
      <div className="flex flex-wrap gap-2">
        {ratings.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => onRate(value)}
            className={`flex-1 min-w-[4.5rem] py-2.5 px-2 rounded-lg text-white font-medium
              transition-all duration-200 ${color} shadow-sm hover:shadow-md`}
          >
            <span className="block text-lg leading-none">{value}</span>
            <span className="block text-[0.65rem] mt-0.5 opacity-90">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
