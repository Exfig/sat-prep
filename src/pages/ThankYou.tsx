import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type Path = 'choose' | 'student' | 'parent';

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const sessionId = searchParams.get('session_id');

  // Token state
  const [token, setToken] = useState('');
  const [activationUrl, setActivationUrl] = useState('');
  const [tokenLoading, setTokenLoading] = useState(!!sessionId);
  const [tokenError, setTokenError] = useState('');

  // Path selection
  const [path, setPath] = useState<Path>('choose');

  // Student signup form
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

  // Parent email form
  const [studentEmail, setStudentEmail] = useState('');
  const [parentSendLoading, setParentSendLoading] = useState(false);
  const [parentSendError, setParentSendError] = useState('');
  const [parentEmailSent, setParentEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // On page load, create activation token from Stripe session
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-activation-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stripe_checkout_session_id: sessionId }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setTokenError(data.error || 'Failed to create activation token');
        } else {
          setToken(data.token);
          setActivationUrl(data.activation_url);
        }
      } catch {
        setTokenError('Failed to connect to server. Please try refreshing the page.');
      } finally {
        setTokenLoading(false);
      }
    })();
  }, [sessionId]);

  // Student signup + claim token
  const handleStudentSignup = async (e: React.FormEvent) => {
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

    // If we have a token and got a session, claim it
    if (token) {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) {
          const claimRes = await fetch(`${SUPABASE_URL}/functions/v1/claim-activation-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${s.access_token}`,
            },
            body: JSON.stringify({ token }),
          });
          const claimData = await claimRes.json();
          if (claimData.claimed) {
            navigate('/dashboard');
            return;
          }
        }
      } catch {
        // Token claim failed but account was created — still success
      }
    }

    // No token or claim failed — show email confirmation
    setEmailSent(true);
    setSignupLoading(false);
  };

  // Parent sends activation email to student
  const handleSendToStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setParentSendError('');
    setParentSendLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-activation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, student_email: studentEmail }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setParentSendError(data.error || 'Failed to send email');
      } else {
        setParentEmailSent(true);
      }
    } catch {
      setParentSendError('Failed to connect to server. Please try again.');
    } finally {
      setParentSendLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(activationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = activationUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // No session_id — show generic thank you (shouldn't normally happen)
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h1>
          <p className="text-slate-600 mb-6">Your purchase was successful. If you weren't redirected automatically, please contact support@topscore.school for your activation link.</p>
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  // Loading token
  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Verifying your purchase...</span>
        </div>
      </div>
    );
  }

  // Token creation error
  if (tokenError) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Something Went Wrong</h1>
          <p className="text-slate-600 mb-4">{tokenError}</p>
          <p className="text-sm text-slate-500">If your payment went through, please contact <a href="mailto:support@topscore.school" className="text-indigo-600 hover:underline">support@topscore.school</a> and we'll get you set up.</p>
        </div>
      </div>
    );
  }

  // Email confirmation after student signup
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Thank You for Your Purchase!</h1>
          <p className="text-slate-600 mt-2">Your Caliber access is ready.</p>
        </div>

        {/* Path selection */}
        {path === 'choose' && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Student path */}
            <button
              onClick={() => setPath('student')}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">🎓</div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">I'm the student</h2>
              <p className="text-sm text-slate-600 mb-4">Create your account now and start studying today.</p>
              <span className="text-indigo-600 font-medium text-sm group-hover:text-indigo-700">
                Create My Account →
              </span>
            </button>

            {/* Parent path */}
            <button
              onClick={() => setPath('parent')}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-left hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">🎁</div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">I bought this for my student</h2>
              <p className="text-sm text-slate-600 mb-4">Send them an activation link to create their own account.</p>
              <span className="text-indigo-600 font-medium text-sm group-hover:text-indigo-700">
                Send Activation Link →
              </span>
            </button>
          </div>
        )}

        {/* Student signup form */}
        {path === 'student' && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setPath('choose')} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
              ← Back
            </button>

            <form onSubmit={handleStudentSignup} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Create Your Account</h2>

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
        )}

        {/* Parent path — send to student */}
        {path === 'parent' && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setPath('choose')} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
              ← Back
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-800">Send Activation to Your Student</h2>

              {/* Email form */}
              {parentEmailSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">Activation link sent to {studentEmail}!</p>
                  <p className="text-green-700 text-sm mt-1">They'll receive it in a few minutes.</p>
                </div>
              ) : (
                <form onSubmit={handleSendToStudent} className="space-y-3">
                  {parentSendError && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">{parentSendError}</div>
                  )}
                  <div>
                    <label htmlFor="studentEmail" className="block text-sm font-medium text-slate-700 mb-1">Enter your student's email</label>
                    <input id="studentEmail" type="email" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="student@example.com" />
                  </div>
                  <button type="submit" disabled={parentSendLoading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
                    {parentSendLoading ? 'Sending...' : 'Send Activation Link'}
                  </button>
                </form>
              )}

              {/* Divider + copy link */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">or share this link directly</span></div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={activationUrl}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 truncate" />
                  <button onClick={handleCopyLink}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors whitespace-nowrap min-h-[44px]">
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Text or share this link with your student. It can only be used once.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
