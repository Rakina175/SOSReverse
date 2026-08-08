// React import not required in modern JSX runtimes
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SOSProvider } from './context/SOSContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Registration } from './pages/Registration';
import { Dashboard } from './pages/Dashboard';
import { SendSOS } from './pages/SendSOS';
import { EmergencyContacts } from './pages/EmergencyContacts';
import { LiveTracking } from './pages/LiveTracking';
import { EmergencyChat } from './pages/EmergencyChat';
import { EmergencyHistory } from './pages/EmergencyHistory';
import { UserProfile } from './pages/UserProfile';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { VerifyEmailPending } from './pages/VerifyEmailPending';
import { Settings } from './pages/Settings';

// Components
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
//import { RoleSwitcher } from './components/RoleSwitcher';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SOSProvider>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Registration />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-email-pending" element={<VerifyEmailPending />} />

              {/* Protected Citizen Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-sos"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <SendSOS />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <EmergencyContacts />
                  </ProtectedRoute>
                }
              />

              {/* Protected Shared Tracking & Chat Routes (Citizen & Volunteer) */}
              <Route
                path="/tracking"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'volunteer']}>
                    <LiveTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'volunteer']}>
                    <EmergencyChat />
                  </ProtectedRoute>
                }
              />

              {/* Protected Volunteer Specific Routes */}
              <Route
                path="/volunteer"
                element={
                  <ProtectedRoute allowedRoles={['volunteer']}>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Specific Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Universal Routes (Any Logged-in User) */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <EmergencyHistory />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>

          {/* Floating simulator panel overlay */}
          {/* <RoleSwitcher /> */}
        </SOSProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
