import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, Shield, CheckCircle, AlertCircle, Save } from 'lucide-react';

export const AccountSetupPage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSaving(true);

    try {
      await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        ...(newPassword
          ? {
              currentPassword,
              newPassword,
            }
          : {}),
      });

      setSuccessMessage('Profile and account settings updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update account.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest font-semibold text-primary">
          Account Management
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-on-surface mt-1">
          Profile & Account Setup
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Configure your gallery persona, bio, and security settings.
        </p>
      </div>

      {successMessage && (
        <div
          id="setup-success-banner"
          className="mb-6 p-4 bg-status-valid/10 border border-status-valid/30 text-status-valid rounded flex items-center gap-2.5 text-sm font-medium"
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          id="setup-error-banner"
          className="mb-6 p-4 bg-error-container/60 border border-error/20 text-error rounded flex items-center gap-2.5 text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Account Overview Card */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border border-outline/20 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-surface-container flex items-center justify-center text-primary font-serif text-2xl font-bold border border-outline/20 mb-3 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h2 className="font-serif text-xl font-bold text-on-surface">{user.name}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">{user.email}</p>

            <div className="mt-4 flex justify-center">
              <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary-container/20 text-primary border border-primary/20">
                {user.role}
              </span>
            </div>
          </div>

          {/* Internal Wallet Card */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border border-outline/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-primary" /> Internal Wallet
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-status-valid/10 text-status-valid rounded-full font-semibold">
                Active
              </span>
            </div>
            <div className="text-3xl font-serif font-bold text-on-surface my-2">
              {user.walletBalance.toFixed(2)} <span className="text-sm font-sans font-normal text-on-surface-variant">Credits</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Fictional internal credits used for simulated purchases, live auction bidding, and virtual exhibition tickets.
            </p>
          </div>
        </div>

        {/* Right: Form Settings */}
        <div className="md:col-span-2">
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20">
            <h3 className="font-serif text-xl font-semibold text-on-surface mb-6">
              Personal Information
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Display Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-surface-container-highest focus:border-primary focus:ring-0 px-4 py-3 text-sm text-on-surface outline-none rounded-t"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Email Address <span className="text-[10px] lowercase text-on-surface-variant">(read-only)</span>
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-surface-container-high/40 border-b-2 border-surface-container-highest px-4 py-3 text-sm text-on-surface-variant outline-none rounded-t cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Bio / Artist Statement
                </label>
                <textarea
                  id="profile-bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio or artisan statement with the Nakshi community..."
                  className="w-full bg-surface-container-low border-b-2 border-surface-container-highest focus:border-primary focus:ring-0 px-4 py-2.5 text-sm text-on-surface outline-none rounded-t resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2">
                  Avatar Image URL
                </label>
                <input
                  id="profile-avatar"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-surface-container-low border-b-2 border-surface-container-highest focus:border-primary focus:ring-0 px-4 py-3 text-sm text-on-surface outline-none rounded-t"
                />
              </div>

              {/* Security / Password section */}
              <div className="pt-4 border-t border-surface-container">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-on-surface mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" /> Change Password
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-low border-b-2 border-surface-container-highest focus:border-primary focus:ring-0 px-3 py-2 text-sm text-on-surface outline-none rounded-t"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 chars"
                      className="w-full bg-surface-container-low border-b-2 border-surface-container-highest focus:border-primary focus:ring-0 px-3 py-2 text-sm text-on-surface outline-none rounded-t"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={isSaving}
                  className="px-6 py-3 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSetupPage;
