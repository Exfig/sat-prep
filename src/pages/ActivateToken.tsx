import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type TokenStatus = 'loading' | 'valid' | 'already_used' | 'expired' | 'invalid_token' | 'revoked' | 'rate_limited' | 'error';

export default function ActivateToken() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [status, setStatus] = useState<TokenStatus>('loading');

  // Signup form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid_token');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/validate-activation-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (res.status === 429) {
          setStatus('rate_limited');
          return;
        }

        const data = await res.json();
        if (data.valid) {
          setStatus('valid');
        } else {
          setStatus(data.reason === 'already_used' ? 'already_used'
            : data.reason === 'expired' ? 'expired'
            : data.reason === 'revoked' ? 'revoked'
            : data.reason === 'rate_limited' ? 'rate_limited'
            : 'invalid_token');
        }
      } catch {
        setStatus('error');
      }
    })();
  }, [token]);

  // Handle signup + claim token
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (password !== confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    setSignupLoading(true);

    const sanitizedName = fullName.trim().slice(0, 200);
    const sanitizedSchool = school.trim().slice(0, 200);
    const gradeNum = gradeLevel ? parseInt(gradeLevel) : undefined;
    const validGrade = gradeNum !== undefined && gradeNum >= 1 && gradeNum <= 13 ? gradeNum : undefined;

    const { error: err } = await signUp(email, password, sanitizedName, {
      school: sanitizedSchool || undefined,
      gradeLevel: validGrade,
      targetTestDate: targetTestDate || undefined,
    });

    if (err) {
      setSignupError(err);
      setSignupLoading(false);
      return;
    }

    // Claim the token (no session required — token + email is the auth)
    try {
      const claimRes = await fetch(`${SUPABASE_URL}/functions/v1/claim-activation-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });
      const claimData = await claimRes.json();
      if (!claimData.claimed) {
        setSignupError(claimData.error || 'Failed to claim activation token. Contact support at support@topscore.school');
        setSignupLoading(false);
        return;
      }
    } catch {
      // Token claim failed — account was still created, continue to confirmation
    }

    // Check if we have a session (email confirmation may be required)
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s) {
      navigate('/dashboard');
      return;
    }

    // No session — email confirmation required
    setEmailSent(true);
    setSignupLoading(false);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Validating your activation link...</span>
        </div>
      </div>
    );
  }

  // Error states
  if (status !== 'valid') {
    const messages: Record<Exclude<TokenStatus, 'loading' | 'valid'>, { title: string; body: string }> = {
      already_used: {
        title: 'Already Used',
        body: 'This activation link has already been used. If this is an error, contact support at support@topscore.school',
      },
      expired: {
        title: 'Link Expired',
        body: 'This activation link has expired. Contact the person who purchased TopScore for you, or reach out to support@topscore.school',
      },
      invalid_token: {
        title: 'Invalid Link',
        body: "This activation link isn't valid. Please check the link and try again.",
      },
      revoked: {
        title: 'Link Revoked',
        body: 'This activation link has been revoked. Contact support@topscore.school for assistance.',
      },
      rate_limited: {
        title: 'Too Many Attempts',
        body: 'Too many attempts. Please wait a moment and try again.',
      },
      error: {
        title: 'Something Went Wrong',
        body: 'We couldn\'t validate this link. Please try again or contact support@topscore.school',
      },
    };

    const msg = messages[status];

    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{msg.title}</h1>
          <p className="text-slate-600 mb-6">{msg.body}</p>
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  // Email confirmation after signup
  if (emailSent) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="max-w-md text-center bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h2>
          <p className="text-slate-600 mb-6">
            We've sent a confirmation link to <span className="font-medium text-slate-800">{email}</span>. Click the link to verify your account and start studying.
          </p>
          <p className="text-sm text-slate-500 mb-6">Didn't receive it? Check your spam folder.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors min-h-[44px]">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Valid token — show signup form
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Your Account</h1>
          <p className="text-slate-600 mt-1">Someone got you Caliber! Set up your account to start studying.</p>
        </div>

        <form onSubmit={handleSignup} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          {signupError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">{signupError}</div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Your full name" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="you@example.com" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="At least 6 characters" />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Confirm your password" />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500 mb-3">Optional information</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="school" className="block text-sm font-medium text-slate-700 mb-1">School</label>
                <input id="school" type="text" value={school} onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Your school name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-slate-700 mb-1">Grade Level</label>
                  <select id="grade" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">Select</option>
                    <option value="9">9th</option>
                    <option value="10">10th</option>
                    <option value="11">11th</option>
                    <option value="12">12th</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="testDate" className="block text-sm font-medium text-slate-700 mb-1">Target Test Date</label>
                  <input id="testDate" type="date" value={targetTestDate} onChange={(e) => setTargetTestDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={signupLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
            {signupLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
