// src/components/ErrorBoundary/ErrorBoundary.tsx
import {
  ErrorBoundary as ReactErrorBoundary,
  type FallbackProps,
} from 'react-error-boundary';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');

  return (
    <div className="px-8 py-12 max-w-screen-2xl mx-auto">
      <div className="rounded-xl border border-red-500/35 bg-red-50 px-6 py-8 space-y-4 dark:border-red-500/30 dark:bg-red-950/40">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Something went wrong in this section
        </h2>
        <p className="text-sm text-gray-600 font-mono break-words dark:text-gray-400">{message}</p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300
                     bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors
                     dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: Props) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error('ErrorBoundary:', error, info.componentStack);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
