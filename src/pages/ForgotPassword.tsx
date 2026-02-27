import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const IS_CALIBER = import.meta.env.VITE_THEME === 'caliber';
const COOLDOWN_SECONDS = 60;

function friendlyError(msg: string): string {
  if (msg.toLowerCase().includes('rate limit')) {
    return 'Too many requests. Please wait a minute before trying again.';
  }
  if (msg.toLowerCase().includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  return msg;
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await resetPassword(email);
    if (err) {
      setError(friendlyError(err));
      if (err.toLowerCase().includes('rate limit')) {
        startCooldown();
      }
    } else {
      setSuccess(true);
      startCooldown();
    }
    setLoading(false);
  };

  const btnClass = IS_CALIBER
    ? 'bg-gradient-to-r from-[#c8a24e] to-[#e4c36e] text-[#08090d] hover:shadow-[0_4px_20px_rgba(200,162,78,0.35)]'
    : 'bg-indigo-600 text-white hover:bg-indigo-700';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {IS_CALIBER
            ? <img src={`${import.meta.env.BASE_URL}caliber-icon.png`} className="w-16 h-16 mx-auto rounded-xl" alt="Caliber" />
            : <span className="text-4xl">📝</span>
          }
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Reset Password</h1>
          <p className="text-slate-500 mt-1">We'll send you a reset link</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-sm" role="status">
                Check your email for a password reset link.
              </div>
              <Link
                to="/login"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium py-2 min-h-[44px]"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
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
                disabled={loading || cooldown > 0}
                className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${btnClass}`}
              >
                {loading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-slate-500">
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 py-2 min-h-[44px] inline-flex items-center justify-center">
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
