import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/auth.service';
import { ArrowRight, ArrowLeft, AlertCircle, Sparkles, KeyRound, X, CheckCircle } from 'lucide-react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'VERIFY' | 'SET_PASSWORD'>('REQUEST');
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ success?: string; error?: string }>({});
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Destination after login
  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};
    if (!email.trim()) newFieldErrors.email = 'Email address is required.';
    if (!password) newFieldErrors.password = 'Password is required.';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        navigate(`/dashboard/${user.role.toLowerCase()}`, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      if (err.details) {
        setFieldErrors(err.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
    setFieldErrors({});
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus({});
    if (!forgotEmail.trim()) {
      setForgotStatus({ error: 'Please enter your account email.' });
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail.trim());
      setForgotStatus({ success: res.message });
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setForgotStep('VERIFY');
    } catch (err: any) {
      setForgotStatus({ error: err.message || 'Failed to request reset.' });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleVerifyResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus({});
    if (!resetToken.trim()) {
      setForgotStatus({ error: 'Reset token is required to verify.' });
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await authApi.verifyResetToken(resetToken.trim());
      setIsTokenVerified(true);
      setForgotStatus({ success: res.message || 'Token verified successfully. You may now set a new password.' });
      setForgotStep('SET_PASSWORD');
    } catch (err: any) {
      setIsTokenVerified(false);
      setForgotStatus({ error: err.message || 'Invalid or expired password reset token.' });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus({});

    if (!isTokenVerified) {
      setForgotStatus({ error: 'Token verification is required before setting a new password.' });
      setForgotStep('VERIFY');
      return;
    }

    if (!resetToken.trim() || !newPassword) {
      setForgotStatus({ error: 'Both token and new password are required.' });
      return;
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setForgotStatus({ error: 'Password must be at least 8 characters long and contain both letters and numbers.' });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      setForgotStatus({ error: 'Passwords do not match.' });
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await authApi.resetPassword(resetToken.trim(), newPassword);
      setForgotStatus({ success: res.message });
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('REQUEST');
        setIsTokenVerified(false);
        setPassword(newPassword);
        setEmail(forgotEmail);
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotStatus({});
      }, 1500);
    } catch (err: any) {
      setForgotStatus({ error: err.message || 'Failed to reset password.' });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('REQUEST');
    setIsTokenVerified(false);
    setForgotStatus({});
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6">
      {/* Background Watermark */}
      <div
        className="absolute inset-0 z-0 bg-watermark pointer-events-none w-full h-full opacity-30"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCDAe6VSMzCZ34HDXNTiVpU0fgKxHG8tUn3N4Lf3FJP4wtM8arutOHBCGKdBAk31W_yiPzIYAE51MLg6u8lkMNypntieMUxvNV2zatvhc36YfrejG3F0azJy2qFqcaalEW20z9fxiFpc4rdk33k4Ej5Kcu6buWPeLazobn-rIrj1UpFwW-4w--KFSHmlkZ_MBNZDggm4-KZ0pw9hbhxy5VTKjfWjZJPjzlLMOLc2ZQ0CJf9wECZtu4c')",
        }}
      />

      <main className="relative z-10 w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Nakshi
          </h1>
          <p className="text-sm text-on-surface-variant mt-2 font-medium tracking-wide">
            Curated Digital Gallery & Marketplace
          </p>
        </div>

        {/* Authentication Card */}
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-8 md:p-10 border border-on-surface/5 backdrop-blur-sm">
          <h2 className="font-serif text-2xl font-semibold text-on-surface mb-6 text-center">
            Welcome Back
          </h2>

          {/* Form-level Error Banner */}
          {error && (
            <div
              id="login-error-banner"
              className="mb-6 p-3.5 bg-error-container/60 border border-error/20 text-error rounded flex items-start gap-2.5 text-xs font-medium"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Email Field with inline error */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="name@example.com"
                className={`w-full bg-surface-container-low border-b-2 px-4 py-3 text-sm text-on-surface transition-colors outline-none rounded-t ${fieldErrors.email
                    ? 'border-error bg-error-container/10 focus:border-error'
                    : 'border-surface-container-highest focus:border-primary'
                  }`}
                required
              />
              {fieldErrors.email && (
                <p id="email-field-error" className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field with inline error */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant"
                >
                  Password
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(email);
                    setForgotStatus({});
                  }}
                  className="text-xs text-primary hover:text-surface-tint cursor-pointer hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                className={`w-full bg-surface-container-low border-b-2 px-4 py-3 text-sm text-on-surface transition-colors outline-none rounded-t ${fieldErrors.password
                    ? 'border-error bg-error-container/10 focus:border-error'
                    : 'border-surface-container-highest focus:border-primary'
                  }`}
                required
              />
              {fieldErrors.password && (
                <p id="password-field-error" className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider py-4 rounded-full hover:bg-surface-tint transition-all duration-300 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="relative mt-6 pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-container-highest"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface-container-lowest px-2 text-on-surface-variant uppercase tracking-wider font-semibold">Or continue with</span>
              </div>
            </div>

            <GoogleLoginButton setError={setError} setIsSubmitting={setIsSubmitting} />
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-6 pt-6 border-t border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> Demo Quick Login:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="demo-buyer-btn"
                onClick={() => handleDemoFill('buyer@nakshi.test')}
                className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium rounded border border-outline/20 transition-colors text-center"
              >
                Buyer
              </button>
              <button
                type="button"
                id="demo-artist-btn"
                onClick={() => handleDemoFill('artist@nakshi.test')}
                className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium rounded border border-outline/20 transition-colors text-center"
              >
                Artist
              </button>
              <button
                type="button"
                id="demo-organizer-btn"
                onClick={() => handleDemoFill('organizer@nakshi.test')}
                className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium rounded border border-outline/20 transition-colors text-center"
              >
                Organizer
              </button>
              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => handleDemoFill('admin@nakshi.test')}
                className="py-1.5 px-2 bg-surface-container-low hover:bg-surface-container text-on-surface text-[11px] font-medium rounded border border-outline/20 transition-colors text-center"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Create Account Link */}
          <div className="mt-6 text-center border-t border-surface-container pt-5">
            <p className="text-sm text-on-surface-variant">
              New to the gallery?{' '}
              <Link
                to="/register"
                id="goto-register-link"
                className="font-semibold text-primary hover:underline underline-offset-4 decoration-primary/50"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-xl ambient-shadow p-6 border border-outline/20 relative">
            <button
              id="reset-modal-close-btn"
              onClick={handleCloseForgotModal}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-xl font-bold text-on-surface">
                {forgotStep === 'REQUEST' && 'Forgot Password'}
                {forgotStep === 'VERIFY' && 'Verify Reset Token'}
                {forgotStep === 'SET_PASSWORD' && 'Set New Password'}
              </h3>
            </div>

            {/* Stepper progress indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`flex-1 h-1 rounded-full ${
                  forgotStep === 'REQUEST' || forgotStep === 'VERIFY' || forgotStep === 'SET_PASSWORD'
                    ? 'bg-primary'
                    : 'bg-outline/20'
                }`}
              />
              <div
                className={`flex-1 h-1 rounded-full ${
                  forgotStep === 'VERIFY' || forgotStep === 'SET_PASSWORD'
                    ? 'bg-primary'
                    : 'bg-outline/20'
                }`}
              />
              <div
                className={`flex-1 h-1 rounded-full ${
                  forgotStep === 'SET_PASSWORD' ? 'bg-primary' : 'bg-outline/20'
                }`}
              />
            </div>

            <p className="text-xs text-on-surface-variant mb-4">
              {forgotStep === 'REQUEST' && 'Enter your account email to receive a password reset token.'}
              {forgotStep === 'VERIFY' && 'Enter your reset token to verify your identity before setting a new password.'}
              {forgotStep === 'SET_PASSWORD' && 'Token verified! Enter your new password below.'}
            </p>

            {forgotStatus.error && (
              <div id="forgot-error-banner" className="mb-4 p-3 bg-error-container/60 border border-error/20 text-error rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotStatus.error}</span>
              </div>
            )}

            {forgotStatus.success && (
              <div id="forgot-success-banner" className="mb-4 p-3 bg-status-valid/10 border border-status-valid/30 text-status-valid rounded text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{forgotStatus.success}</span>
              </div>
            )}

            {forgotStep === 'REQUEST' && (
              <form onSubmit={handleRequestResetToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Account Email
                  </label>
                  <input
                    id="forgot-email-input"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>
                <button
                  id="request-token-btn"
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all"
                >
                  {isForgotLoading ? 'Generating Token...' : 'Generate Reset Token'}
                </button>
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStatus({});
                      setForgotStep('VERIFY');
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Already have a token? Verify it here
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'VERIFY' && (
              <form onSubmit={handleVerifyResetToken} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Reset Token
                  </label>
                  <input
                    id="reset-token-input"
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste reset token"
                    className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                    required
                  />
                </div>
                <button
                  id="verify-token-btn"
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all flex items-center justify-center gap-1.5"
                >
                  {isForgotLoading ? 'Verifying...' : 'Verify Token'}
                </button>
                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStatus({});
                      setForgotStep('REQUEST');
                    }}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Email
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'SET_PASSWORD' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    id="new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 chars (letters & numbers)"
                    className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full bg-surface-container-low border border-outline/30 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>
                <button
                  id="reset-password-btn"
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all"
                >
                  {isForgotLoading ? 'Resetting...' : 'Save New Password'}
                </button>
                <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStatus({});
                      setForgotStep('VERIFY');
                    }}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
