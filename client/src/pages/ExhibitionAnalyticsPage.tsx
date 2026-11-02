import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ExhibitionAnalyticsReport } from '../components/exhibition/ExhibitionAnalyticsReport';

export const ExhibitionAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/dashboard/organizer"
        id="analytics-back-link"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Organizer Dashboard</span>
      </Link>

      {id ? (
        <ExhibitionAnalyticsReport exhibitionId={id} />
      ) : (
        <p className="text-sm text-on-surface-variant">Exhibition not specified.</p>
      )}
    </main>
  );
};