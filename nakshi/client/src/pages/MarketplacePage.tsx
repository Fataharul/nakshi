import React from 'react';
import { ArtworkSearchInterface } from '../components/marketplace/ArtworkSearchInterface';

export const MarketplacePage: React.FC = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ArtworkSearchInterface />
    </main>
  );
};

export default MarketplacePage;
