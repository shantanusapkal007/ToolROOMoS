import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-white/10 rounded-md ${className}`} />
  );
};

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'profile' | 'page';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'page' }) => {
  switch (type) {
    case 'card':
      return (
        <div className="glass-panel p-6 space-y-4 w-full">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      );
    case 'table':
      return (
        <div className="glass-panel w-full overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'page':
    default:
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center animate-bounce">
              <div className="w-8 h-8 rounded-full bg-white/20 animate-ping" />
            </div>
          </div>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-sm animate-pulse">Initializing Data Core...</p>
        </div>
      );
  }
};
