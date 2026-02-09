import type { SectionId } from '../types';

interface SectionToggleProps {
  selected: SectionId | null; // null = "All"
  onChange: (section: SectionId | null) => void;
}

const OPTIONS: { label: string; value: SectionId | null }[] = [
  { label: 'All', value: null },
  { label: 'Reading & Writing', value: 'reading-writing' },
  { label: 'Math', value: 'math' },
];

export default function SectionToggle({ selected, onChange }: SectionToggleProps) {
  return (
    <div className="inline-flex w-full rounded-lg bg-slate-100 p-1 sm:w-auto">
      {OPTIONS.map((option) => {
        const isActive = selected === option.value;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all sm:flex-none ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
