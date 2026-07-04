import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...', fullHeight = true }) => {
  return (
    <div className={`w-full flex items-center justify-center ${fullHeight ? 'h-full min-h-[400px]' : 'py-12'}`}>
      <SkeletonLoader type="page" />
    </div>
  );
};
