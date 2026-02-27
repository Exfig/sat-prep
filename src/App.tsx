import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StrategyGateRoute from './components/StrategyGateRoute';
import AdminRoute from './components/AdminRoute';
import Header from './components/Header';
import NotificationBell from './components/NotificationBell';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore } from './store/useAppStore';

const IS_CALIBER = import.meta.env.VITE_THEME === 'caliber';
const Sidebar = IS_CALIBER ? lazy(() => import('./components/Sidebar')) : null;

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Practice = lazy(() => import('./pages/Practice'));
const Progress = lazy(() => import('./pages/Progress'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const ExamReview = lazy(() => import('./pages/ExamReview'));
const MockTest = lazy(() => import('./pages/MockTest'));
const Admin = lazy(() => import('./pages/Admin'));
const StrategyGuide = lazy(() => import('./pages/StrategyGuide'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const ActivateToken = lazy(() => import('./pages/ActivateToken'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/activate/:token" element={<ActivateToken />} />
        <Route path="/review" element={<ReviewPage />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className={`min-h-screen bg-slate-50 ${IS_CALIBER ? 'flex' : ''}`}>
                {IS_CALIBER && Sidebar ? <><Suspense fallback={null}><Sidebar /></Suspense><NotificationBell /></> : <Header />}
                <main id="main-content" className={IS_CALIBER ? 'flex-1 ml-[3.05rem]' : 'pt-16'}>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Strategy guide — always accessible, not gated */}
                      <Route path="/strategy-guide" element={<StrategyGuide />} />

                      {/* All other routes gated behind strategy guide completion */}
                      <Route path="/dashboard" element={<StrategyGateRoute><Dashboard /></StrategyGateRoute>} />
                      <Route path="/practice" element={<StrategyGateRoute><ErrorBoundary fallbackTitle="Practice session error"><Practice /></ErrorBoundary></StrategyGateRoute>} />
                      <Route path="/mock-test" element={<StrategyGateRoute><ErrorBoundary fallbackTitle="Mock test error"><MockTest /></ErrorBoundary></StrategyGateRoute>} />
                      <Route path="/progress" element={<StrategyGateRoute><Progress /></StrategyGateRoute>} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<StrategyGateRoute><Profile /></StrategyGateRoute>} />
                      <Route path="/activity" element={<StrategyGateRoute><ActivityLog /></StrategyGateRoute>} />
                      <Route path="/exam-review" element={<StrategyGateRoute><ErrorBoundary fallbackTitle="Exam review error"><ExamReview /></ErrorBoundary></StrategyGateRoute>} />
                      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  const themeMode = useAppStore((s) => s.themeMode);

  useEffect(() => {
    if (IS_CALIBER) {
      document.documentElement.setAttribute(
        'data-theme',
        themeMode === 'light' ? 'caliber-light' : 'caliber',
      );
    }
  }, [themeMode]);

  return (
    <ErrorBoundary fallbackTitle="Application error">
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
