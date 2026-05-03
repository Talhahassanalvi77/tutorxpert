import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TutorsPage from './pages/TutorsPage';
import TutorDetailPage from './pages/TutorDetailPage';
import BecomeTutorPage from './pages/BecomeTutorPage';
import NotFoundPage from './pages/NotFoundPage';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import BookingsPage from './pages/BookingsPage';
import SessionsPage from './pages/SessionsPage';
import SessionRoomPage from './pages/SessionRoomPage';
import MessagesPage from './pages/MessagesPage';
import ProgressPage from './pages/ProgressPage';
import CommunityPage from './pages/CommunityPage';
import SettingsPage from './pages/SettingsPage';
import TutorProfilePage from './pages/TutorProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminPage from './pages/AdminPage';
import HelpPage from './pages/HelpPage';

// Protected Route Component
const ProtectedRoute = ({ children, requireRole = null }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            borderRadius: '12px',
            boxShadow: '0 4px 25px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="tutors" element={<TutorsPage />} />
          <Route path="tutors/:id" element={<TutorDetailPage />} />
          <Route path="become-a-tutor" element={<BecomeTutorPage />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="signup" element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="session/:id" element={<SessionRoomPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Tutor-specific routes */}
          <Route path="tutor-profile" element={
            <ProtectedRoute requireRole="tutor">
              <TutorProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="admin" element={
            <ProtectedRoute requireRole="admin">
              <AdminPage />
            </ProtectedRoute>
          } />
          
          {/* Help Center */}
          <Route path="help" element={<HelpPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
