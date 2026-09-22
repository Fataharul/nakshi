import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-lg text-on-surface">Connecting to Nakshi Gallery...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <main className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-container-lowest rounded-xl ambient-shadow p-8 text-center border border-outline/20">
          <div className="w-12 h-12 bg-error-container/40 rounded-full flex items-center justify-center mx-auto mb-4 text-error">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase tracking-widest font-semibold text-error mb-1 block">
            403 — Access Restricted
          </span>
          <h1 className="font-serif text-2xl font-bold text-on-surface mb-2">
            Insufficient Permissions
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            This section is restricted to authorized roles. Your current account role is{' '}
            <strong className="text-on-surface font-semibold">{user.role}</strong>.
          </p>
          <div className="space-y-3">
            <Link
              to={`/dashboard/${user.role.toLowerCase()}`}
              id="return-to-dashboard-btn"
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to {user.role} Dashboard</span>
            </Link>
            <Link
              to="/"
              className="block text-xs text-on-surface-variant hover:text-on-surface hover:underline transition-colors"
            >
              Back to Gallery Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return children;
};

export default ProtectedRoute;
