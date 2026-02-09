import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await resetPassword(email);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">📝</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Reset Password</h1>
          <p className="text-slate-500 mt-1">We'll send you a reset link</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                Check your email for a password reset link.
              </div>
              <Link
                to="/login"
                className="inline-block text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium
                  hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-slate-500">
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
                  Back to Sign In
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
