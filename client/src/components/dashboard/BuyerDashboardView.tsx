import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  ShoppingBag,
  Sparkles,
  ExternalLink,
  Clock,
  Layers,
  Receipt,
  ArrowRight,
  Package,
} from 'lucide-react';
import { orderApi } from '../../services/order.service';
import { Order } from '../../types/order';
import { User } from '../../types/auth';
import { TransactionLedgerView } from '../wallet/TransactionLedgerView';

interface BuyerDashboardViewProps {
  user: User;
  onOpenTopUp: () => void;
}

type TabType = 'collection' | 'orders' | 'ledger';

export const BuyerDashboardView: React.FC<BuyerDashboardViewProps> = ({
  user,
  onOpenTopUp,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    orderApi
      .getMyOrders(1, 50)
      .then((data) => {
        if (isMounted) {
          setOrders(data.orders || []);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load purchased artworks');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user.walletBalance]);

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.amountPaid || 0), 0);
  const distinctMediums = new Set(orders.map((o) => o.artwork?.medium).filter(Boolean)).size;

  return (
    <div id="buyer-dashboard-view" className="space-y-8 animate-fade-in">
      {/* Buyer Studio Header Banner */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary border border-primary/20 flex items-center justify-center font-serif text-2xl font-bold overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="dashboard-user-name" className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                {user.name}
              </h1>
              <span
                id="dashboard-role-badge"
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-primary-container/20 text-primary border border-primary/20"
              >
                {user.role}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {user.bio || 'Heritage Art Collector & Patron'} • {user.email}
            </p>
          </div>
        </div>

        {/* Credit Balance & Top-Up Card */}
        <div className="flex items-center justify-between sm:justify-end gap-4 bg-surface-container-low px-5 py-3.5 rounded-xl border border-outline/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                Available Wallet Balance
              </span>
              <span id="dashboard-wallet-balance" className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
                {user.walletBalance.toFixed(2)}{' '}
                <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            id="dashboard-topup-btn"
            onClick={onOpenTopUp}
            className="px-3.5 py-2 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-all shadow-xs cursor-pointer"
          >
            + Top Up
          </button>
        </div>
      </div>

      {/* Collector Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Artworks Acquired</span>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </div>
          <div id="buyer-kpi-artworks-count" className="font-serif text-3xl font-bold text-on-surface">
            {orders.length}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Single-edition curated pieces</p>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Credits Invested</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div id="buyer-kpi-total-spent" className="font-serif text-3xl font-bold text-primary">
            {totalSpent.toFixed(2)}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Direct artisan support volume</p>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Heritage Craft Mediums</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div id="buyer-kpi-craft-mediums" className="font-serif text-3xl font-bold text-on-surface">
            {distinctMediums}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Distinct regional techniques</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-outline/20 pb-2">
        <button
          id="tab-btn-collection"
          onClick={() => setActiveTab('collection')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'collection'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>My Acquired Artworks ({orders.length})</span>
        </button>

        <button
          id="tab-btn-orders"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Purchase History</span>
        </button>

        <button
          id="tab-btn-ledger"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Transaction Ledger</span>
        </button>
      </div>

      {/* Tab 1: Collection Grid */}
      {activeTab === 'collection' && (
        <section id="buyer-purchased-artworks" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-on-surface">
                My Acquired Heritage Pieces
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Authentic masterworks you have acquired through fixed-price purchases.
              </p>
            </div>
            <Link
              to="/gallery"
              id="dashboard-explore-gallery-link"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              <span>Explore Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div
              id="orders-loading-spinner"
              className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-on-surface-variant"
            >
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading your collection...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs">
              {error}
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div
              id="no-purchased-artworks-banner"
              className="text-center py-12 px-6 bg-surface-container-low rounded-xl border border-dashed border-outline/30"
            >
              <Package className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-50" />
              <h3 className="font-serif text-lg font-bold text-on-surface mb-1">
                No Artworks Acquired Yet
              </h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-5 leading-relaxed">
                Discover mastercrafted handloom Jamdani sarees, Nakshi Kantha tapestries, bell metal crafts, and folk pottery from verified rural artisans.
              </p>
              <Link
                to="/gallery"
                id="explore-gallery-cta"
                className="px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all inline-flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Curated Gallery</span>
              </Link>
            </div>
          ) : (
            /* Populated Collection Grid */
            <div id="purchased-artworks-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <article
                  key={order.id}
                  id={`purchased-artwork-card-${order.id}`}
                  className="bg-surface-container-lowest rounded-xl border border-outline/20 ambient-shadow overflow-hidden flex flex-col hover:border-outline/40 transition-all hover:scale-[1.01] duration-300 group"
                >
                  {/* Matted Thumbnail */}
                  <div className="h-48 bg-surface-container-high relative overflow-hidden">
                    <img
                      src={order.artwork?.imageUrl}
                      alt={order.artwork?.title || 'Purchased Artwork'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        id={`purchased-artwork-medium-${order.id}`}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-container-lowest/90 text-primary border border-primary/20 backdrop-blur-xs"
                      >
                        {order.artwork?.medium || 'Heritage Craft'}
                      </span>
                      <span
                        id={`acquired-badge-${order.id}`}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-status-valid/90 text-on-primary backdrop-blur-xs"
                      >
                        Acquired
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3
                        id={`purchased-artwork-title-${order.id}`}
                        className="font-serif text-lg font-bold text-on-surface line-clamp-1"
                      >
                        {order.artwork?.title}
                      </h3>
                      {order.seller && (
                        <p
                          id={`purchased-artwork-artist-${order.id}`}
                          className="text-xs text-on-surface-variant font-medium"
                        >
                          by {order.seller.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant pt-1">
                        <Clock className="w-3.5 h-3.5 text-outline" />
                        <span id={`purchased-artwork-date-${order.id}`}>
                          Acquired on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>
                    </div>

                    {/* Footer / Price & Details */}
                    <div className="pt-3 border-t border-outline/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block">
                          Acquisition Value
                        </span>
                        <span
                          id={`purchased-artwork-price-${order.id}`}
                          className="font-serif text-base font-bold text-primary"
                        >
                          {Number(order.amountPaid).toFixed(2)}{' '}
                          <span className="text-[11px] font-sans font-normal text-on-surface-variant">Credits</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        id={`view-artwork-btn-${order.id}`}
                        onClick={() => navigate(`/artworks/${order.artworkId}`)}
                        className="px-3.5 py-1.5 rounded-lg border border-outline/30 text-on-surface hover:text-primary hover:border-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>View Piece</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Orders Receipts List */}
      {activeTab === 'orders' && (
        <section id="buyer-order-history" className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-on-surface">
              Purchase Order Receipts
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Official acquisition receipts and credit settlement records.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 px-6 bg-surface-container-low rounded-xl border border-dashed border-outline/30 text-xs text-on-surface-variant">
              No orders found in your purchase history.
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl border border-outline/20 ambient-shadow overflow-x-auto">
              <table id="buyer-order-history-table" className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline/20 bg-surface-container-low text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Artwork</th>
                    <th className="py-3.5 px-4">Artisan</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Credits Paid</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10 text-on-surface">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-on-surface-variant">
                        #{order.id.slice(0, 10)}...
                      </td>
                      <td className="py-3.5 px-4 font-semibold font-serif">
                        {order.artwork?.title}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        {order.seller?.name}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-primary">
                        {Number(order.amountPaid).toFixed(2)} C
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/artworks/${order.artworkId}`}
                          className="text-primary hover:underline font-medium text-xs inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Embedded Credit Ledger */}
      {activeTab === 'ledger' && (
        <section id="buyer-ledger-section" className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-on-surface">
              Credit Transaction History
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Complete audit ledger of credit top-ups, purchases, and bidding holds.
            </p>
          </div>
          <TransactionLedgerView key={user.walletBalance} />
        </section>
      )}
    </div>
  );
};
