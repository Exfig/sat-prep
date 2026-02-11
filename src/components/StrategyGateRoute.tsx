import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export default function StrategyGateRoute({ children }: { children: React.ReactNode }) {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const strategyGuideCompleted = useAppStore((s) => s.strategyGuideCompleted);

  // Wait for Supabase data to load before deciding
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!strategyGuideCompleted) {
    return <Navigate to="/strategy-guide" replace />;
  }

  return <>{children}</>;
}
