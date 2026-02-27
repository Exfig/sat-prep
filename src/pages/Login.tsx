import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const IS_CALIBER = import.meta.env.VITE_THEME === 'caliber';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {IS_CALIBER
            ? <img src={`${import.meta.env.BASE_URL}caliber-icon.png`} className="w-24 h-24 mx-auto rounded-2xl" alt="Caliber" />
            : <span className="text-4xl">📝</span>
          }
          {!IS_CALIBER && <h1 className="text-2xl font-bold text-slate-800 mt-2">SAT Prep</h1>}
          <p className="text-slate-500 mt-1">{IS_CALIBER ? 'Sign in to your Caliber account' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${
              IS_CALIBER
                ? 'bg-gradient-to-r from-[#c8a24e] to-[#e4c36e] text-[#08090d] hover:shadow-[0_4px_20px_rgba(200,162,78,0.35)]'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-sm">
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 py-2 min-h-[44px] inline-flex items-center">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
