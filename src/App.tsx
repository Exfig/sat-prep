import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StrategyGateRoute from './components/StrategyGateRoute';
import AdminRoute from './components/AdminRoute';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';

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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50">
                <Header />
                <main id="main-content" className="pt-16">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Strategy guide — always accessible, not gated */}
                      <Route path="/strategy-guide" element={<StrategyGuide />} />

                      {/* All other routes gated behind strategy guide completion */}
                      <Route path="/" element={<StrategyGateRoute><Dashboard /></StrategyGateRoute>} />
                      <Route path="/practice" element={<StrategyGateRoute><ErrorBoundary fallbackTitle="Practice session error"><Practice /></ErrorBoundary></StrategyGateRoute>} />
                      <Route path="/mock-test" element={<StrategyGateRoute><ErrorBoundary fallbackTitle="Mock test error"><MockTest /></ErrorBoundary></StrategyGateRoute>} />
                      <Route path="/progress" element={<StrategyGateRoute><Progress /></StrategyGateRoute>} />
                      <Route path="/settings" element={<StrategyGateRoute><Settings /></StrategyGateRoute>} />
                      <Route path="/profile" element={<StrategyGateRoute><Profile /></StrategyGateRoute>} />
                      <Route path="/activity" element={<StrategyGateRoute><ActivityLog /></StrategyGateRoute>} />
                      <Route path="/exam-review" element={<StrategyGateRoute><ErrorBoundary fallbackTitle="Exam review error"><ExamReview /></ErrorBoundary></StrategyGateRoute>} />
                      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                      <Route path="*" element={<Navigate to="/" replace />} />
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
  return (
    <BrowserRouter basename="/sat-prep">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
