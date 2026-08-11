import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { TableSkeleton } from '../components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <AppLayout>
      <div className="w-full flex flex-col space-y-6">
        {/* Skeleton Page Header */}
        <div className="h-20 w-full bg-white border border-border-gray rounded-[12px] p-6 shadow-subtle animate-pulse" />
        
        {/* Skeleton Content Card */}
        <div className="bg-white border border-border-gray rounded-[12px] p-6 shadow-subtle">
          <TableSkeleton rows={6} />
        </div>
      </div>
    </AppLayout>
  );
}
