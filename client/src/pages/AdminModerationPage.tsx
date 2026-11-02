import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AdminModerationQueue } from '../components/admin/AdminModerationQueue';


export const AdminModerationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-on-surface-variant">
          <Link
            to="/dashboard/admin"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </Link>
          <span className="opacity-40">/</span>
          <span className="font-semibold text-on-surface">Moderation Review Console</span>
        </nav>

        {/* Administrator Moderation Queue Component */}
        <AdminModerationQueue />
      </div>
    </div>
  );
};

export default AdminModerationPage;
