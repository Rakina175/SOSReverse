import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'citizen' | 'volunteer' | 'admin'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Glassmorphic modern loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl flex flex-col items-center max-w-sm w-full border border-slate-800">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-brand-red animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-slate-800 border-b-indigo-500 animate-spin animate-reverse"></div>
          </div>
          <p className="text-slate-400 font-medium text-sm animate-pulse tracking-wide">
            VERIFYING CREDENTIALS...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role checking
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect admin to admin dashboard, volunteer to volunteer dashboard, citizen to dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'volunteer') {
      return <Navigate to="/volunteer" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
