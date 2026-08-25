import React from 'react';
import { TableSkeleton } from './SkeletonLoader';

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...', fullHeight = true }) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${fullHeight ? 'h-full min-h-[400px]' : 'py-12'}`} aria-busy="true">
      <span className="sr-only">{message}</span>
      <TableSkeleton rows={6} />
    </div>
  );
};
