'use client';

import DashboardLayout from './DashboardLayout';
import LoadingSpinner from './LoadingSpinner';

export default function PageLoader({ text = 'Loading...' }) {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </DashboardLayout>
  );
}
