import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, AlertCircle, CheckCircle2, Wallet, Plus, Sparkles } from 'lucide-react';
import { orderApi } from '../../services/order.service';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types/order';

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    medium: string;
    artistName?: string;
  };
  onSuccess: (order: Order, newBalance: number) => void;
  onOpenTopUp: () => void;
}

export const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  isOpen,
  onClose,
  artwork,
  onSuccess,
  onOpenTopUp,
}) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const currentBalance = user?.walletBalance ?? 0;
  const price = Number(artwork.price);
  const hasSufficientBalance = currentBalance >= price;
  const remainingBalance = Math.max(0, currentBalance - price);
  const shortage = Math.max(0, price - currentBalance);

  const handleConfirmPurchase = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await orderApi.checkout(artwork.id);
      setCompletedOrder(response.order);
      await refreshUser();
      onSuccess(response.order, response.newWalletBalance);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      id="purchase-modal-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        id="purchase-confirmation-modal"
        className="bg-surface rounded-xl ambient-shadow max-w-lg w-full p-6 sm:p-8 border border-outline/30 relative text-on-surface my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-purchase-modal-btn"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          /* Success Confirmation View */
          <div className="text-center py-4 space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-status-valid/10 border border-status-valid/30 flex items-center justify-center text-status-valid mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-widest font-semibold text-status-valid">
                Purchase Order Confirmed
              </span>
              <h2 className="font-serif text-2xl font-bold text-on-surface">
                Acquisition Successful!
              </h2>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                You are now the proud custodian of this authentic single-edition heritage piece.
              </p>
            </div>

            <div
              id="purchase-success-banner"
              className="p-4 rounded-xl bg-surface-container-low border border-outline/20 text-left space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                <span className="text-on-surface-variant font-medium">Order Reference:</span>
                <span className="font-mono text-on-surface font-semibold text-[11px]">{completedOrder.id.slice(0, 13)}...</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                <span className="text-on-surface-variant font-medium">Artwork Piece:</span>
                <span className="font-serif text-on-surface font-semibold">{artwork.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                <span className="text-on-surface-variant font-medium">Amount Deducted:</span>
                <span className="text-primary font-bold">{price.toFixed(2)} Credits</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-on-surface-variant font-medium">Updated Wallet Balance:</span>
                <span className="text-on-surface font-bold">{(user?.walletBalance ?? 0).toFixed(2)} Credits</span>
              </div>
            </div>

            <button
              id="purchase-done-btn"
              onClick={onClose}
              className="w-full py-3 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-colors shadow-sm"
            >
              Done & Return to Artwork
            </button>
          </div>
        ) : (
          /* Confirmation & Review View */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-primary">
                  Fixed-Price Marketplace Order
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-on-surface">
                  Acquire Heritage Piece
                </h2>
              </div>
            </div>

            {/* Artwork Summary Card */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-container-lowest border border-outline/20">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-16 h-16 rounded-lg object-cover border border-outline/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary px-2 py-0.5 rounded-full bg-primary-container/20">
                  {artwork.medium}
                </span>
                <h3 className="font-serif font-bold text-sm text-on-surface truncate mt-1">
                  {artwork.title}
                </h3>
                {artwork.artistName && (
                  <p className="text-xs text-on-surface-variant">by {artwork.artistName}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block font-medium">Price</span>
                <span className="font-serif text-lg font-bold text-primary">{price.toFixed(2)}</span>
                <span className="text-[10px] text-on-surface-variant block">Credits</span>
              </div>
            </div>

            {/* Credit Transaction Calculation */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline/20 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Available Wallet Balance:</span>
                <span id="purchase-current-balance" className="font-semibold text-on-surface">
                  {currentBalance.toFixed(2)} Credits
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Artwork Purchase Cost:</span>
                <span id="purchase-cost-amount" className="font-semibold text-primary">
                  - {price.toFixed(2)} Credits
                </span>
              </div>
              <div className="pt-2 border-t border-outline/15 flex items-center justify-between text-xs font-bold">
                <span className="text-on-surface">Remaining Balance:</span>
                <span
                  id="purchase-remaining-balance"
                  className={hasSufficientBalance ? 'text-status-valid' : 'text-error'}
                >
                  {remainingBalance.toFixed(2)} Credits
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                id="purchase-error-banner"
                className="p-3.5 rounded-lg bg-error-container/20 border border-error/30 text-error text-xs flex items-center gap-2 animate-shake"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Insufficient Balance Notice & Top-Up CTA */}
            {!hasSufficientBalance && (
              <div
                id="insufficient-balance-notice"
                className="p-4 rounded-xl bg-primary-container/10 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <strong className="text-on-surface font-semibold block">Insufficient Credit Balance</strong>
                    <span className="text-on-surface-variant">
                      You need <strong>{shortage.toFixed(2)}</strong> more Credits to complete this checkout.
                    </span>
                  </div>
                </div>
                <button
                  id="purchase-topup-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTopUp();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-surface-tint flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Top Up Now</span>
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="cancel-purchase-btn"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-purchase-btn"
                type="button"
                disabled={!hasSufficientBalance || isSubmitting}
                onClick={handleConfirmPurchase}
                className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm Purchase ({price.toFixed(2)} Credits)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
