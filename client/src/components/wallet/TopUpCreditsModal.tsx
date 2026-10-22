import React, { useState } from 'react';
import { X, Wallet, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { walletApi } from '../../services/wallet.service';
import { useAuth } from '../../context/AuthContext';

interface TopUpCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

const PRESET_PACKAGES = [
  { amount: 250, label: '250 Credits', description: 'Curated Craft Starter' },
  { amount: 500, label: '500 Credits', description: 'Heritage Collector' },
  { amount: 1000, label: '1,000 Credits', description: 'Masterwork Bidding' },
  { amount: 2500, label: '2,500 Credits', description: 'Imperial Gallery Patron' },
];

export const TopUpCreditsModal: React.FC<TopUpCreditsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ amount: number; newBalance: number } | null>(null);

  if (!isOpen) return null;

  const currentBalance = user?.walletBalance ?? 0;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrorMessage(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedAmount(parsed);
    }
    setErrorMessage(null);
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountToTopUp = customAmount.trim() !== '' ? parseFloat(customAmount) : selectedAmount;

    if (isNaN(amountToTopUp) || amountToTopUp <= 0) {
      setErrorMessage('Please enter a valid credit amount greater than 0.');
      return;
    }

    if (amountToTopUp > 100000) {
      setErrorMessage('Maximum single top-up is 100,000 Credits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await walletApi.topUp(amountToTopUp);
      await refreshUser();
      setSuccessInfo({
        amount: amountToTopUp,
        newBalance: response.balance,
      });
      if (onSuccess) {
        onSuccess(response.balance);
      }
      setTimeout(() => {
        setSuccessInfo(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to top up credits. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="topup-credits-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="topup-credits-modal"
        className="bg-surface rounded-xl ambient-shadow max-w-lg w-full p-6 sm:p-8 border border-outline/30 relative text-on-surface my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-topup-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest font-semibold text-primary">
              Internal Simulated Currency
            </span>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-on-surface">
              Top Up Platform Credits
            </h2>
          </div>
        </div>

        {/* Current Balance Banner */}
        <div className="mb-6 p-4 rounded-lg bg-surface-container-low border border-outline/20 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
              Current Available Balance
            </span>
            <div id="modal-current-wallet-balance" className="font-serif text-2xl font-bold text-on-surface mt-0.5">
              {currentBalance.toFixed(2)}{' '}
              <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-status-valid bg-status-valid/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fictional Ledger</span>
          </div>
        </div>

        {/* Success Banner */}
        {successInfo && (
          <div
            id="topup-success-banner"
            className="mb-6 p-4 rounded-lg bg-status-valid/10 border border-status-valid/30 text-status-valid text-sm flex items-center gap-3 animate-fade-in"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Successfully credited +{successInfo.amount.toFixed(2)} Credits!
              </p>
              <p className="text-xs opacity-90">
                New wallet balance: {successInfo.newBalance.toFixed(2)} Credits
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div
            id="topup-error-banner"
            className="mb-6 p-4 rounded-lg bg-error-container/60 border border-error/20 text-error text-sm flex items-center gap-2.5"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top-up Form */}
        <form onSubmit={handleTopUpSubmit} noValidate className="space-y-6">
          {/* Preset Packages */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-2.5">
              Select Preset Credit Package
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {PRESET_PACKAGES.map((pkg) => {
                const isSelected = !customAmount && selectedAmount === pkg.amount;
                return (
                  <button
                    key={pkg.amount}
                    type="button"
                    id={`preset-package-${pkg.amount}-btn`}
                    onClick={() => handleSelectPreset(pkg.amount)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary'
                        : 'border-outline/30 bg-surface-container-lowest hover:border-outline text-on-surface'
                    }`}
                  >
                    <div className="font-serif font-bold text-base">{pkg.label}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">{pkg.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Field */}
          <div>
            <label
              htmlFor="topup-amount-input"
              className="block text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-1.5"
            >
              Or Specify Custom Amount (Credits)
            </label>
            <div className="relative">
              <input
                id="topup-amount-input"
                type="number"
                min="1"
                max="100000"
                step="any"
                placeholder="e.g. 750"
                value={customAmount}
                onChange={handleCustomChange}
                className="w-full bg-surface-container-lowest border border-outline/40 rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors font-medium"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Credits
              </span>
            </div>
          </div>

          {/* Mandatory Requirement Note */}
          <div className="p-3.5 rounded-lg bg-surface-container text-xs text-on-surface-variant leading-relaxed border border-outline/10">
            <strong>Simulation Notice:</strong> No real currency, bank, or card processing is involved.
            Credits are fictional tokens strictly for bidding, purchasing, and exhibition passes.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              id="topup-submit-btn"
              type="submit"
              disabled={isSubmitting || !!successInfo}
              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Dummy Top-Up</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
