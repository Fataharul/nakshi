export type TransactionType =
  | 'TOP_UP'
  | 'PURCHASE_DEBIT'
  | 'SALE_CREDIT'
  | 'AUCTION_BID_HOLD'
  | 'AUCTION_BID_REFUND'
  | 'AUCTION_WIN_PAYOUT'
  | 'EXHIBITION_TICKET';

export interface CreditTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TopUpResponse {
  message: string;
  balance: number;
  transaction: CreditTransaction;
}

export interface TransactionLedgerResponse {
  balance: number;
  transactions: CreditTransaction[];
  pagination: PaginationMeta;
}
