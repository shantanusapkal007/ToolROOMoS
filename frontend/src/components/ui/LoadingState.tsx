import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...', fullHeight = true }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${fullHeight ? 'h-full min-h-[200px]' : 'py-8'}`}>
      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-400 animate-pulse tracking-wide uppercase">
        {message}
      </p>
    </div>
  );
};
