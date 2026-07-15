'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We could log this to an external service here
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#FBFBFC] text-zinc-900">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
          <h1 className="text-2xl font-bold mb-2">Critical Application Error</h1>
          <p className="text-zinc-500 mb-6 max-w-md text-center">
            The application encountered an unrecoverable error. Please try reloading the page or contact system administration.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors border border-slate-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
