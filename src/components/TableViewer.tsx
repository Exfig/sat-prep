import type { TableData } from '../types';

interface TableViewerProps {
  tableData: TableData;
}

export default function TableViewer({ tableData }: TableViewerProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-x-auto">
      {tableData.caption && (
        <p className="px-4 pt-3 text-sm font-medium text-slate-600">{tableData.caption}</p>
      )}
      <table className="text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-100">
            {tableData.headers.map((header, i) => (
              <th key={i} className="px-4 py-2.5 font-semibold text-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx < tableData.rows.length - 1 ? 'border-b border-slate-100' : ''}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-4 py-2 text-slate-700 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
