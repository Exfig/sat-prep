import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  product: string;
  created_at: string;
}

export default function WaitlistTab() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'litmus' | 'act'>('all');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setEntries(data);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.product === filter);
  const litmusCount = entries.filter((e) => e.product === 'litmus').length;
  const actCount = entries.filter((e) => e.product === 'act').length;

  const exportCSV = () => {
    const rows = [['Email', 'Name', 'Product', 'Date']];
    for (const e of filtered) {
      rows.push([e.email, e.name || '', e.product, new Date(e.created_at).toLocaleDateString()]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="text-slate-500 py-8 text-center">Loading waitlist...</p>;
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="bg-slate-100 rounded-lg px-4 py-2 text-sm">
          <span className="text-slate-500">Total:</span>{' '}
          <span className="font-semibold text-slate-900">{entries.length}</span>
        </div>
        <div className="bg-emerald-50 rounded-lg px-4 py-2 text-sm">
          <span className="text-emerald-600">Litmus:</span>{' '}
          <span className="font-semibold text-emerald-800">{litmusCount}</span>
        </div>
        <div className="bg-violet-50 rounded-lg px-4 py-2 text-sm">
          <span className="text-violet-600">ACT:</span>{' '}
          <span className="font-semibold text-violet-800">{actCount}</span>
        </div>
      </div>

      {/* Filter + Export */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'litmus' | 'act')}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Products</option>
          <option value="litmus">Litmus only</option>
          <option value="act">ACT only</option>
        </select>
        <button
          onClick={exportCSV}
          className="ml-auto rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-slate-400 py-8 text-center text-sm">No waitlist entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 font-medium text-slate-600">Product</th>
                <th className="px-4 py-3 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{e.email}</td>
                  <td className="px-4 py-3 text-slate-500">{e.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.product === 'litmus'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-violet-50 text-violet-700'
                      }`}
                    >
                      {e.product === 'litmus' ? 'Litmus' : 'ACT'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
