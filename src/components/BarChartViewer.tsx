import type { BarChartData } from '../types';

interface BarChartViewerProps {
  data: BarChartData;
}

export default function BarChartViewer({ data }: BarChartViewerProps) {
  const yMax = data.yMax ?? Math.ceil(Math.max(...data.bars.map(b => b.value)) * 1.15);
  const yStep = data.yStep ?? Math.ceil(yMax / 8);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += yStep) ticks.push(v);
  if (ticks[ticks.length - 1] < yMax) ticks.push(yMax);

  const chartHeight = 220;
  const defaultColors = ['#9ca3af', '#374151', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 inline-block">
      {/* Title */}
      <p className="text-sm font-semibold text-slate-700 text-center mb-3 max-w-xs mx-auto leading-snug">
        {data.title}
      </p>

      <div className="flex items-end gap-0">
        {/* Y-axis label + ticks */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="text-[10px] text-slate-500 font-medium"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
          >
            {data.yAxisLabel}
          </span>
          <div className="flex flex-col-reverse justify-between" style={{ height: chartHeight }}>
            {ticks.map(v => (
              <span key={v} className="text-[10px] text-slate-500 leading-none text-right w-8">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Chart area */}
        <div className="flex flex-col">
          {/* Bars */}
          <div
            className="flex items-end gap-3 border-l border-b border-slate-300 pl-1 pb-0.5"
            style={{ height: chartHeight }}
          >
            {data.bars.map((bar, i) => {
              const barHeight = (bar.value / yMax) * chartHeight;
              return (
                <div key={i} className="flex flex-col items-center justify-end" style={{ minWidth: 48, height: chartHeight }}>
                  <div
                    className="w-10 rounded-t-sm"
                    style={{
                      height: barHeight,
                      backgroundColor: bar.color ?? defaultColors[i % defaultColors.length],
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-3 pl-1 mt-1">
            {data.bars.map((bar, i) => (
              <div key={i} className="text-[10px] text-slate-600 text-center font-medium" style={{ minWidth: 48 }}>
                {bar.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3">
        {data.bars.map((bar, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm border border-slate-300"
              style={{ backgroundColor: bar.color ?? defaultColors[i % defaultColors.length] }}
            />
            <span className="text-xs text-slate-600">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
