import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ActivityLog from './pages/ActivityLog';
import ExamReview from './pages/ExamReview';
import MockTest from './pages/MockTest';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

function AppRoutes() {
  return (
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
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/practice" element={<Practice />} />
                  <Route path="/mock-test" element={<MockTest />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/activity" element={<ActivityLog />} />
                  <Route path="/exam-review" element={<ExamReview />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
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
