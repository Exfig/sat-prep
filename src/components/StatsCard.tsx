interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export default function StatsCard({ label, value, icon, color = 'text-indigo-600' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
