import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  display_name: string | null;
  approved: boolean;
  created_at: string;
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('user_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setReviews(data);
      setLoading(false);
    })();
  }, []);

  const toggleApproved = async (review: Review) => {
    const newVal = !review.approved;
    const { error } = await supabase
      .from('user_reviews')
      .update({ approved: newVal })
      .eq('id', review.id);
    if (!error) {
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, approved: newVal } : r)),
      );
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    const { error } = await supabase.from('user_reviews').delete().eq('id', id);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const approvedCount = reviews.filter((r) => r.approved).length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  if (loading) {
    return <p className="text-slate-500 py-8 text-center">Loading reviews...</p>;
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="bg-slate-100 rounded-lg px-4 py-2 text-sm">
          <span className="text-slate-500">Total:</span>{' '}
          <span className="font-semibold text-slate-900">{reviews.length}</span>
        </div>
        <div className="bg-emerald-50 rounded-lg px-4 py-2 text-sm">
          <span className="text-emerald-600">Approved:</span>{' '}
          <span className="font-semibold text-emerald-800">{approvedCount}</span>
        </div>
        <div className="bg-amber-50 rounded-lg px-4 py-2 text-sm">
          <span className="text-amber-600">Avg Rating:</span>{' '}
          <span className="font-semibold text-amber-800">{avgRating}</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-slate-400 py-8 text-center text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg border p-4 ${
                r.approved
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-amber-500 text-lg tracking-wide">
                      {stars(r.rating)}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {r.display_name || 'Anonymous'}
                    </span>
                    {r.approved && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {r.review_text}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString()} &middot;{' '}
                    <span className="font-mono">{r.user_id.slice(0, 8)}</span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleApproved(r)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      r.approved
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {r.approved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
