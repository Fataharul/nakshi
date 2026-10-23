import React, { useState } from 'react';
import { X, CheckCircle2, Ticket, Crown, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ExhibitionDetail, ExhibitionTicket, ExhibitionService } from '../../services/exhibition.service';

interface BuyTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: ExhibitionDetail;
  onTicketPurchased: (ticket: ExhibitionTicket) => void;
}

export const BuyTicketModal: React.FC<BuyTicketModalProps> = ({
  isOpen,
  onClose,
  exhibition,
  onTicketPurchased,
}) => {
  const { user, refreshUser } = useAuth();
  const [isVipSelected, setIsVipSelected] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedTicket, setIssuedTicket] = useState<ExhibitionTicket | null>(null);

  if (!isOpen) return null;

  const basePrice = Number(exhibition.ticketPrice);
  const vipPrice = basePrice + Math.round(basePrice * 0.5 || 25);
  const selectedPrice = isVipSelected ? vipPrice : basePrice;
  const userBalance = Number(user?.walletBalance ?? 0);
  const hasSufficientCredits = userBalance >= selectedPrice;

  const handlePurchase = async () => {
    if (!user) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await ExhibitionService.purchaseTicket(exhibition.id, isVipSelected);
      setIssuedTicket(response.ticket);
      await refreshUser();
      onTicketPurchased(response.ticket);
    } catch (err: any) {
      setError(err.message || 'Failed to complete ticket reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="buy-ticket-modal"
        className="bg-surface rounded-2xl max-w-lg w-full overflow-hidden border border-outline/20 shadow-2xl relative flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-surface-container-low border-b border-outline/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-on-surface">Exhibition Pass Reservation</h2>
              <p className="text-xs text-on-surface-variant">Instant digital ticket issued via internal credits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {issuedTicket ? (
            <div id="ticket-success-view" className="text-center py-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-status-valid/20 text-status-valid flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-on-surface mb-1">Access Pass Confirmed!</h3>
              <p className="text-xs text-on-surface-variant mb-6">
                Your admission token has been generated and credited to your collector profile.
              </p>

              {/* Museum Pass Graphic */}
              <div
                id="digital-pass-card"
                className="w-full bg-gradient-to-br from-surface-container-highest via-surface-container to-surface-container-low rounded-xl p-6 border-2 border-dashed border-primary/30 relative text-left shadow-md mb-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      Virtual Gallery Pass
                    </span>
                    <h4 className="font-serif font-bold text-base text-on-surface">{exhibition.title}</h4>
                  </div>
                  {issuedTicket.isVip ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-on-primary flex items-center gap-1 shadow-xs">
                      <Crown className="w-3 h-3" /> VIP Pass
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary text-on-primary">
                      General Pass
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase">Attendee</p>
                    <p className="font-semibold text-on-surface">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase">Curator</p>
                    <p className="font-semibold text-on-surface">{exhibition.organizer.name}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-outline/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-on-surface-variant">Ticket Verification Token</p>
                    <code
                      id="ticket-token-badge"
                      className="text-xs font-mono font-bold tracking-wider text-primary"
                    >
                      {issuedTicket.ticketToken}
                    </code>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-status-valid">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                  </div>
                </div>
              </div>

              <button
                id="enter-hall-from-modal-btn"
                onClick={onClose}
                className="w-full py-3.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Enter Virtual Exhibition Hall</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Exhibition Overview Banner */}
              <div className="mb-6 p-4 rounded-xl bg-surface-container-low border border-outline/10 flex items-center gap-4">
                {exhibition.bannerUrl ? (
                  <img
                    src={exhibition.bannerUrl}
                    alt={exhibition.title}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-outline/15"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-sm text-on-surface truncate">{exhibition.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mb-1">
                    Curated by {exhibition.organizer.name}
                  </p>
                  <p className="text-[11px] text-primary font-semibold">
                    {exhibition.artworksCount} Masterpiece exhibits on display
                  </p>
                </div>
              </div>

              {/* Pass Tier Selection */}
              <div className="mb-6 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Select Admission Tier
                </label>

                {/* Standard Pass Card */}
                <div
                  id="select-standard-pass-btn"
                  onClick={() => setIsVipSelected(false)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    !isVipSelected
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-outline/20 hover:border-outline/40 bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !isVipSelected ? 'border-primary' : 'border-outline'
                      }`}
                    >
                      {!isVipSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">General Admission</p>
                      <p className="text-xs text-on-surface-variant">Full virtual hall walkthrough & catalog</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-base text-primary">
                      {basePrice === 0 ? 'Free' : `${basePrice} Credits`}
                    </span>
                  </div>
                </div>

                {/* VIP Pass Card */}
                <div
                  id="select-vip-pass-btn"
                  onClick={() => setIsVipSelected(true)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    isVipSelected
                      ? 'border-amber-600 bg-amber-500/5 shadow-xs'
                      : 'border-outline/20 hover:border-outline/40 bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isVipSelected ? 'border-amber-600' : 'border-outline'
                      }`}
                    >
                      {isVipSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-on-surface">VIP Collector Pass</p>
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Includes exclusive early VIP access window & digital badge
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-base text-amber-600">
                      {vipPrice} Credits
                    </span>
                  </div>
                </div>
              </div>

              {/* Wallet Balance Summary */}
              <div className="p-4 rounded-xl bg-surface-container-high/40 border border-outline/10 mb-6 text-xs flex items-center justify-between">
                <div>
                  <span className="text-on-surface-variant">Your Available Credits:</span>
                  <p id="modal-wallet-balance" className="font-bold text-sm text-on-surface">
                    {userBalance.toFixed(2)} Credits
                  </p>
                </div>
                {!hasSufficientCredits && (
                  <span className="text-error font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Insufficient balance
                  </span>
                )}
              </div>

              {error && (
                <div
                  id="ticket-error-banner"
                  className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                id="confirm-ticket-purchase-btn"
                onClick={handlePurchase}
                disabled={isSubmitting || (!hasSufficientCredits && selectedPrice > 0)}
                className="w-full py-3.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-surface-tint disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    Issuing Pass...
                  </span>
                ) : (
                  <span>
                    Confirm {isVipSelected ? 'VIP' : 'Standard'} Pass ({selectedPrice} Credits)
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
