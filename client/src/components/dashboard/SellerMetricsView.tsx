import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, PackageCheck, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { sellerApi } from '../../services/seller.service';
import { SellerMetricsResponse } from '../../types/seller';

export const SellerMetricsView: React.FC = () => {
  const [data, setData] = useState<SellerMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sellerApi.getMetrics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div id="seller-metrics-loading" className="p-8 bg-surface-container-lowest rounded-xl border border-outline/20 flex items-center justify-center gap-3 text-on-surface-variant">
        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        <span className="text-xs font-medium">Calculating seller sales performance metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div id="seller-metrics-error" className="p-4 bg-error-container/40 border border-error/20 rounded-xl text-error text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-on-surface"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, recentSales } = data;

  return (
    <div id="seller-metrics-container" className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-on-surface flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Sales & Performance Metrics</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Real-time analytics for your artwork listings and credit earnings.
          </p>
        </div>
        <button
          id="refresh-seller-metrics-btn"
          onClick={fetchMetrics}
          className="p-2 text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline/20 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Total Revenue
            </span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div id="metric-total-revenue" className="font-serif font-bold text-2xl text-on-surface">
            {metrics.totalRevenue.toFixed(2)} <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
          </div>
          <p className="text-[11px] text-on-surface-variant/80 mt-1">
            Gross credits earned from completed sales
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Total Orders
            </span>
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div id="metric-total-orders" className="font-serif font-bold text-2xl text-on-surface">
            {metrics.totalOrders}
          </div>
          <p className="text-[11px] text-on-surface-variant/80 mt-1">
            Successful customer orders completed
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Avg. Order Value
            </span>
            <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div id="metric-avg-order-value" className="font-serif font-bold text-2xl text-on-surface">
            {metrics.averageOrderValue.toFixed(2)} <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
          </div>
          <p className="text-[11px] text-on-surface-variant/80 mt-1">
            Average revenue per artwork purchase
          </p>
        </div>

        {/* Active & Pending Listings */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
              Active Inventory
            </span>
            <div className="p-2 rounded-lg bg-surface-container text-on-surface-variant">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div id="metric-active-listings" className="font-serif font-bold text-2xl text-on-surface">
            {metrics.activeListings} <span className="text-xs font-sans font-normal text-on-surface-variant">Listings</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-on-surface-variant/80 mt-1">
            <span>{metrics.soldArtworks} Sold</span>
            <span>•</span>
            <span>{metrics.pendingArtworks} Pending Moderation</span>
          </div>
        </div>
      </div>

      {/* Recent Sales Activity Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline/20 p-6 ambient-shadow">
        <h3 className="font-serif text-base font-bold text-on-surface mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>Recent Customer Sales</span>
        </h3>

        {recentSales.length === 0 ? (
          <div id="no-recent-sales-msg" className="py-8 text-center text-xs text-on-surface-variant">
            No completed sales recorded yet. Once buyers purchase your artworks, sales logs will appear here.
          </div>
        ) : (
          <div id="recent-sales-list" className="divide-y divide-outline/10">
            {recentSales.map((sale) => (
              <div key={sale.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-surface-container-low shrink-0 overflow-hidden border border-outline/20">
                    {sale.artworkImageUrl ? (
                      <img src={sale.artworkImageUrl} alt={sale.artworkTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary font-serif font-bold text-xs">
                        NK
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-on-surface truncate">
                      {sale.artworkTitle}
                    </div>
                    <div className="text-xs text-on-surface-variant truncate flex items-center gap-1.5">
                      <span>Buyer: {sale.buyerName}</span>
                      <span>•</span>
                      <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-serif font-bold text-sm text-primary">
                    +{sale.amountPaid.toFixed(2)} Credits
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-valid">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
