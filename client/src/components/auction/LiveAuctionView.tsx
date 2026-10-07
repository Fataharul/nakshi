import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuctionService, AuctionResponse } from '../../services/auction.service';
import { socketService } from '../../services/socket.service';

interface LiveAuctionViewProps {
  initialAuction: AuctionResponse;
}

export const LiveAuctionView: React.FC<LiveAuctionViewProps> = ({ initialAuction }) => {
  const { user } = useAuth();
  const [auction, setAuction] = useState<AuctionResponse>(initialAuction);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isBidding, setIsBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Determine if auction is actually active right now
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);
    const isActuallyActive = auction.status === 'ACTIVE' && now >= startTime && now <= endTime;

    if (isActuallyActive) {
      // Connect and join room
      socketService.connect(); // uses token automatically if logged in
      socketService.joinAuctionRoom(auction.id);

      socketService.onNewBid((data: any) => {
        // Someone (or us) placed a new bid
        setAuction(prev => ({
          ...prev,
          currentHighestBid: data.amount
        }));
      });

      socketService.onOutbid((data: any) => {
        // We were outbid
        setNotification(`You were outbid! The new highest bid is ৳${data.amount}`);
        setTimeout(() => setNotification(null), 5000);
      });
    }

    return () => {
      socketService.offNewBid();
      socketService.offOutbid();
      socketService.leaveAuctionRoom(auction.id);
    };
  }, [auction.id, auction.status, auction.startTime, auction.endTime]);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount || isNaN(Number(bidAmount))) return;
    
    setIsBidding(true);
    setError(null);
    try {
      const response = await AuctionService.placeBid(auction.id, Number(bidAmount));
      setAuction(prev => ({
        ...prev,
        currentHighestBid: response.currentHighestBid
      }));
      setBidAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setIsBidding(false);
    }
  };

  const minNextBid = (auction.currentHighestBid || auction.startingBid) + (auction.currentHighestBid ? auction.minIncrement : 0);
  
  const isLive = auction.status === 'ACTIVE';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-surface">
      {/* Left: Image */}
      <div className="rounded-lg overflow-hidden border border-outline/20 bg-surface-container/50">
        <img
          src={auction.artwork?.imageUrl || 'https://via.placeholder.com/600'}
          alt={auction.artwork?.title}
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Right: Details and Bidding */}
      <div className="flex flex-col">
        {/* Status Badge */}
        <div className="mb-4">
          {isLive ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2"></span>
              Live Auction
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
              {auction.status}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-serif font-bold text-on-surface mb-2">{auction.artwork?.title}</h1>
        <p className="text-on-surface-variant mb-8 text-sm">
          {auction.artwork?.medium} • By <span className="font-semibold text-on-surface">{auction.artwork?.artist?.name || 'Unknown Artist'}</span>
        </p>

        {notification && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-md text-sm">
            {notification}
          </div>
        )}

        {/* Bidding Section */}
        <div className="bg-surface-container rounded-lg p-6 border border-outline/10 mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-on-surface-variant mb-1 font-semibold">
                {auction.currentHighestBid ? 'Current Highest Bid' : 'Starting Bid'}
              </p>
              <p className="text-3xl font-bold text-primary">
                ৳{auction.currentHighestBid || auction.startingBid}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Minimum Increment</p>
              <p className="font-medium text-sm">৳{auction.minIncrement}</p>
            </div>
          </div>

          {error && <p className="text-error text-sm mb-4">{error}</p>}

          {isLive ? (
            <form onSubmit={handlePlaceBid} className="flex gap-4">
              <input
                type="number"
                min={minNextBid}
                step={auction.minIncrement}
                placeholder={`Min: ৳${minNextBid}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="flex-1 bg-surface border border-outline/40 rounded px-4 text-sm focus:outline-none focus:border-primary"
                disabled={isBidding || !user || user.role !== 'BUYER'}
                required
              />
              <button
                type="submit"
                disabled={isBidding || !user || user.role !== 'BUYER' || Number(bidAmount) < minNextBid}
                className="bg-primary text-on-primary px-8 py-3 rounded text-sm font-semibold hover:bg-surface-tint disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBidding ? 'Placing...' : 'Place Bid'}
              </button>
            </form>
          ) : (
            <div className="text-center p-4 bg-surface/50 rounded border border-outline/10">
              <p className="text-on-surface-variant text-sm">This auction is not active right now.</p>
            </div>
          )}

          {(!user || user.role !== 'BUYER') && isLive && (
            <p className="text-xs text-on-surface-variant mt-4 text-center">
              You must be logged in as a Buyer to place a bid.
            </p>
          )}
        </div>

        <div className="text-sm text-on-surface-variant">
          <p>Ends: {new Date(auction.endTime).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};
