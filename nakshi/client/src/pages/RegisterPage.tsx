import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import { ArrowRight, AlertCircle, ShoppingBag, Palette, Compass, CheckCircle2 } from 'lucide-react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';


export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('BUYER');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    {
      id: 'BUYER' as Role,
      title: 'Art Buyer / Collector',
      description: 'Discover artworks, bid in live auctions, and explore exhibitions.',
      icon: ShoppingBag,
    },
    {
      id: 'ARTIST' as Role,
      title: 'Artisan / Artist',
      description: 'Open your storefront, publish craftworks, and participate in auctions.',
      icon: Palette,
    },
    {
      id: 'ORGANIZER' as Role,
      title: 'Exhibition Curator',
      description: 'Curate virtual exhibitions, configure gallery walls, and issue tickets.',
      icon: Compass,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newFieldErrors: Record<string, string> = {};

    if (name.trim().length < 2) {
      newFieldErrors.name = 'Name must be at least 2 characters.';
    }

    if (!email.includes('@') || !email.includes('.')) {
      newFieldErrors.email = 'Please provide a valid email address.';
    }

    if (password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      newFieldErrors.password = 'Password must contain at least one letter and one number.';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please correct the highlighted errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        bio: bio.trim() || undefined,
      });

      // Redirect directly to the user's role dashboard
      navigate(`/dashboard/${user.role.toLowerCase()}`, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
      if (err.details) {
        setFieldErrors(err.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6">
      {/* Background Watermark */}
      <div
        className="absolute inset-0 z-0 bg-watermark pointer-events-none w-full h-full opacity-30"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCDAe6VSMzCZ34HDXNTiVpU0fgKxHG8tUn3N4Lf3FJP4wtM8arutOHBCGKdBAk31W_yiPzIYAE51MLg6u8lkMNypntieMUxvNV2zatvhc36YfrejG3F0azJy2qFqcaalEW20z9fxiFpc4rdk33k4Ej5Kcu6buWPeLazobn-rIrj1UpFwW-4w--KFSHmlkZ_MBNZDggm4-KZ0pw9hbhxy5VTKjfWjZJPjzlLMOLc2ZQ0CJf9wECZtu4c')",
        }}
      />

      <main className="relative z-10 w-full max-w-lg">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Join Nakshi
          </h1>
          <p className="text-sm text-on-surface-variant mt-2 font-medium tracking-wide">
            Create your account to celebrate Bengali heritage craft
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-10 border border-on-surface/5 backdrop-blur-sm">
          {/* Form-level Error Banner */}
          {error && (
            <div
              id="register-error-banner"
              className="mb-6 p-3.5 bg-error-container/60 border border-error/20 text-error rounded flex items-start gap-2.5 text-xs font-medium"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Account Role Selection */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      id={`role-btn-${r.id.toLowerCase()}`}
                      onClick={() => setRole(r.id)}
                      className={`text-left p-3 rounded border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary-container/10 ring-1 ring-primary'
                          : 'border-outline/20 bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon
                          className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}
                        />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <div>
                        <div
                          className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}
                        >
                          {r.title}
                        </div>
                        <div className="text-[10px] text-on-surface-variant leading-tight mt-0.5">
                          {r.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Field with inline error */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Rokeya Begum"
                className={`w-full bg-surface-container-low border-b-2 px-4 py-3 text-sm text-on-surface transition-colors outline-none rounded-t ${
                  fieldErrors.name
                    ? 'border-error bg-error-container/10 focus:border-error'
                    : 'border-surface-container-highest focus:border-primary'
                }`}
                required
              />
              {fieldErrors.name && (
                <p id="name-field-error" className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="name@example.com"
                className={`w-full bg-surface-container-low border-b-2 px-4 py-3 text-sm text-on-surface transition-colors outline-none rounded-t ${
                  fieldErrors.email
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
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="At least 8 characters (letters & numbers)"
                className={`w-full bg-surface-container-low border-b-2 px-4 py-3 text-sm text-on-surface transition-colors outline-none rounded-t ${
                  fieldErrors.password
                    ? 'border-error bg-error-container/10 focus:border-error'
                    : 'border-surface-container-highest focus:border-primary'
                }`}
                required
              />
              {fieldErrors.password ? (
                <p id="password-field-error" className="text-error text-xs mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              ) : (
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Must contain minimum 8 characters with at least one letter and number.
                </p>
              )}
            </div>

            {/* Bio Field (Optional) */}
            <div>
              <label
                htmlFor="bio"
                className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2"
              >
                Bio / Artistic Background <span className="text-[11px] font-normal lowercase">(optional)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about your craft passion or collection focus..."
                className="w-full bg-surface-container-low border-b-2 border-surface-container-highest focus:border-primary focus:ring-0 px-4 py-2.5 text-sm text-on-surface transition-colors outline-none rounded-t resize-none"
              />
            </div>

            {/* Wallet Initialization Info Note */}
            <div className="bg-surface-container/60 p-3 rounded text-[11px] text-on-surface-variant border border-outline/20">
              💡 <strong>Account Setup Note:</strong> A digital credit wallet with an initial balance of <strong>0.00 Credits</strong> will automatically be initialized for your account to support platform transactions.
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="register-submit-btn"
                disabled={isSubmitting}
                className="w-full bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider py-4 rounded-full hover:bg-surface-tint transition-all duration-300 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create {role} Account</span>
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
                <span className="bg-surface-container-lowest px-2 text-on-surface-variant uppercase tracking-wider font-semibold">Or join with</span>
              </div>
            </div>

            <GoogleLoginButton setError={setError} setIsSubmitting={setIsSubmitting} role={role} text="signup_with" />
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center border-t border-surface-container pt-6">
            <p className="text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link
                to="/login"
                id="goto-login-link"
                className="font-semibold text-primary hover:underline underline-offset-4 decoration-primary/50"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
