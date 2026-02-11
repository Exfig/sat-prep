import { addDays, format, startOfDay, isSameDay } from 'date-fns';
import type { QuestionProgress } from '../types';

interface ReviewForecastProps {
  progress: Record<string, QuestionProgress>;
}

export default function ReviewForecast({ progress }: ReviewForecastProps) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const dueCounts = days.map((day) => {
    let count = 0;
    for (const qp of Object.values(progress)) {
      if (qp.sm2.nextReviewDate) {
        const reviewDate = startOfDay(new Date(qp.sm2.nextReviewDate));
        if (isSameDay(reviewDate, day)) {
          count++;
        }
        // Items overdue count towards today
        if (isSameDay(day, today) && reviewDate < today) {
          count++;
        }
      }
    }
    return count;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Review Forecast</h3>
      <div className="flex gap-2" role="list" aria-label="Questions due for review per day">
        {days.map((day, i) => {
          const isToday = i === 0;
          return (
            <div
              key={i}
              role="listitem"
              aria-label={`${format(day, 'EEEE')}: ${dueCounts[i]} questions due${isToday ? ' (today)' : ''}`}
              className={`flex-1 flex flex-col items-center p-2 rounded-lg
                ${isToday ? 'border-2 border-indigo-500 bg-indigo-50' : 'border border-slate-200 bg-slate-50'}`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`text-lg font-bold mt-1 ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                {dueCounts[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
