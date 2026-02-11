interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export default function StatsCard({ label, value, icon, color = 'text-indigo-600' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6" aria-label={`${label}: ${value}`}>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="text-xs sm:text-sm font-medium text-slate-500 truncate">{label}</span>
        {icon && <span className="text-xl sm:text-2xl shrink-0 ml-1" aria-hidden="true">{icon}</span>}
      </div>
      <p className={`text-2xl sm:text-3xl font-bold ${color} truncate`}>{value}</p>
    </div>
  );
}
