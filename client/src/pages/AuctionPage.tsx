import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuctionService, AuctionResponse } from '../services/auction.service';
import { LiveAuctionView } from '../components/auction/LiveAuctionView';

export const AuctionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/marketplace');
      return;
    }

    AuctionService.getAuctionById(id)
      .then((data) => {
        setAuction(data);
      })
      .catch((err) => {
        console.error('Failed to load auction:', err);
        setError('Failed to load auction. It may not exist.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <p className="text-error mb-4">{error}</p>
        <button
          onClick={() => navigate('/marketplace')}
          className="px-4 py-2 border border-outline rounded text-sm hover:bg-surface-container"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <LiveAuctionView initialAuction={auction} />
    </div>
  );
};
