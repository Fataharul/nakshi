import React, { useState, useEffect } from 'react';
import { CreditTransaction, TransactionType } from '../../types/wallet';
import { walletApi } from '../../services/wallet.service';
import { useAuth } from '../../context/AuthContext';
import { TopUpCreditsModal } from './TopUpCreditsModal';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  PlusCircle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TransactionLedgerViewProps {
  onBalanceUpdated?: (newBalance: number) => void;
}

export const TransactionLedgerView: React.FC<TransactionLedgerViewProps> = ({
  onBalanceUpdated,
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [balance, setBalance] = useState<number>(user?.walletBalance ?? 0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async (targetPage = 1) => {
    setIsLoading(true);
    try {
      const data = await walletApi.getTransactions(targetPage, 15);
      setTransactions(data.transactions);
      setBalance(data.balance);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load transaction ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const handleTopUpSuccess = (newBalance: number) => {
    setBalance(newBalance);
    if (onBalanceUpdated) {
      onBalanceUpdated(newBalance);
    }
    fetchTransactions(1);
  };

  const getTransactionBadge = (type: TransactionType) => {
    switch (type) {
      case 'TOP_UP':
        return {
          label: 'Credit Top-Up',
          icon: ArrowDownLeft,
          bgClass: 'bg-status-valid/10 text-status-valid border-status-valid/30',
          isCredit: true,
        };
      case 'SALE_CREDIT':
        return {
          label: 'Artwork Sale',
          icon: ArrowDownLeft,
          bgClass: 'bg-status-valid/10 text-status-valid border-status-valid/30',
          isCredit: true,
        };
      case 'AUCTION_BID_REFUND':
        return {
          label: 'Outbid Refund',
          icon: ArrowDownLeft,
          bgClass: 'bg-status-valid/10 text-status-valid border-status-valid/30',
          isCredit: true,
        };
      case 'AUCTION_WIN_PAYOUT':
        return {
          label: 'Auction Payout',
          icon: ArrowDownLeft,
          bgClass: 'bg-status-valid/10 text-status-valid border-status-valid/30',
          isCredit: true,
        };
      case 'PURCHASE_DEBIT':
        return {
          label: 'Artwork Purchase',
          icon: ArrowUpRight,
          bgClass: 'bg-primary/10 text-primary border-primary/30',
          isCredit: false,
        };
      case 'AUCTION_BID_HOLD':
        return {
          label: 'Auction Bid Hold',
          icon: ArrowUpRight,
          bgClass: 'bg-surface-container text-on-surface-variant border-outline/30',
          isCredit: false,
        };
      case 'EXHIBITION_TICKET':
        return {
          label: 'Exhibition Pass',
          icon: ArrowUpRight,
          bgClass: 'bg-primary/10 text-primary border-primary/30',
          isCredit: false,
        };
      default:
        return {
          label: type,
          icon: FileText,
          bgClass: 'bg-surface-container text-on-surface-variant border-outline/20',
          isCredit: false,
        };
    }
  };

  return (
    <div id="transaction-ledger-section" className="space-y-6">
      {/* Wallet Balance Summary Card */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Internal Simulated Credits
          </span>
          <div className="flex items-baseline gap-3 mt-1.5">
            <h2 id="ledger-wallet-balance" className="font-serif text-3xl sm:text-4xl font-bold text-on-surface">
              {balance.toFixed(2)}
            </h2>
            <span className="text-sm uppercase tracking-wider font-semibold text-on-surface-variant">
              Credits Available
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-2 max-w-lg leading-relaxed">
            Credits are fictional tokens strictly used to bid in live auctions, acquire artisan crafts, and reserve exhibition viewing passes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="refresh-ledger-btn"
            onClick={() => fetchTransactions(page)}
            disabled={isLoading}
            className="p-3 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors border border-outline/20"
            title="Refresh transaction history"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="ledger-topup-btn"
            onClick={() => setIsTopUpOpen(true)}
            className="px-6 py-3 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-all shadow-sm flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Top Up Credits</span>
          </button>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
              Transaction Ledger
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Auditable atomic history of credit top-ups, purchases, and auction bid holds.
            </p>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">
            {transactions.length} Records Shown
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div
            id="no-transactions-banner"
            className="text-center py-12 px-4 rounded-xl border border-dashed border-outline/40 bg-surface-container/30"
          >
            <Wallet className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
            <h4 className="font-serif text-lg font-semibold text-on-surface">
              No Transactions Yet
            </h4>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-5">
              Your wallet history is currently empty. Use the simulated dummy top-up to add test credits to your balance.
            </p>
            <button
              id="empty-state-topup-btn"
              onClick={() => setIsTopUpOpen(true)}
              className="px-5 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-all"
            >
              Add First Dummy Top-Up
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="transaction-ledger-table" className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline/20 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  <th className="pb-3 pr-4 font-semibold">Type & Reference</th>
                  <th className="pb-3 px-4 font-semibold">Description</th>
                  <th className="pb-3 px-4 font-semibold">Timestamp</th>
                  <th className="pb-3 pl-4 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {transactions.map((tx) => {
                  const badge = getTransactionBadge(tx.type);
                  const Icon = badge.icon;
                  const formattedDate = new Date(tx.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bgClass}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        {tx.referenceId && (
                          <div className="text-[10px] text-on-surface-variant/70 font-mono mt-1">
                            {tx.referenceId}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-on-surface max-w-md font-medium">
                        {tx.description}
                      </td>
                      <td className="py-4 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-on-surface-variant/60" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td
                        className={`py-4 pl-4 text-right font-semibold whitespace-nowrap text-sm ${
                          badge.isCredit ? 'text-status-valid' : 'text-primary'
                        }`}
                      >
                        {badge.isCredit ? '+' : '-'}
                        {tx.amount.toFixed(2)}{' '}
                        <span className="text-[11px] font-normal text-on-surface-variant">Credits</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls if multiple pages */}
        {totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-outline/20 flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTransactions(page - 1)}
                disabled={page <= 1 || isLoading}
                className="px-3 py-1.5 border border-outline/30 rounded hover:bg-surface-container disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => fetchTransactions(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="px-3 py-1.5 border border-outline/30 rounded hover:bg-surface-container disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      <TopUpCreditsModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
};
