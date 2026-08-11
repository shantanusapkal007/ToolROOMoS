'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full bg-canvas text-ink rounded-md border border-red-900/30 p-8">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Module Error</h2>
      <p className="text-mute mb-6 text-center">
        Something went wrong while loading this module.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md font-medium transition-colors border border-slate-700 text-sm text-ink"
      >
        Try again
      </button>
    </div>
  );
}
