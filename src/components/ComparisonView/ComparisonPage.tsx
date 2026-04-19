// src/components/ComparisonView/ComparisonPage.tsx
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';
import { PreferencesMenu } from '../PreferencesMenu';
import { ComparisonTable } from './ComparisonTable';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCompareVulnerabilities } from '../../store/selectors';
import { compareSelectionCleared } from '../../store/comparisonSlice';

export function ComparisonPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCompareVulnerabilities);
  const compareIds = useAppSelector((s) => s.comparison.ids);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <header className="max-w-screen-2xl mx-auto w-full min-w-0 border-b border-gray-800 px-4 sm:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 bg-gray-950 z-10">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <Link
            to="/"
            className="text-gray-500 hover:text-white transition-colors text-sm shrink-0"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-600 text-sm shrink-0">|</span>
          <span className="text-xl font-bold tracking-tight">
            KAI <span className="text-red-500">Security</span>
          </span>
          <span className="text-gray-600 text-sm hidden sm:inline">|</span>
          <span className="text-gray-400 text-sm">Compare vulnerabilities</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(compareSelectionCleared())}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-700
                         bg-gray-800/80 text-gray-200 hover:bg-gray-800 transition-colors"
            >
              Clear selection
            </button>
          )}
          <PreferencesMenu />
        </div>
      </header>

      <ErrorBoundary>
        <main className="w-full max-w-screen-2xl mx-auto min-w-0 px-4 sm:px-8 py-6 box-border">
          {compareIds.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center space-y-3">
              <p className="text-gray-400">
                Select up to 5 vulnerabilities from the table to compare them side by side.
              </p>
              <Link to="/" className="inline-block text-sm text-blue-400 hover:text-blue-300">
                Back to dashboard
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-3">
              <p className="text-amber-200/90 text-sm">
                Selected items are no longer in the loaded dataset. Clear the selection and pick
                rows again.
              </p>
              <button
                type="button"
                onClick={() => dispatch(compareSelectionCleared())}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-500/40
                           bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
              >
                Clear selection
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6 min-w-0 max-w-full">
              <ComparisonTable items={items} />
            </div>
          )}
        </main>
      </ErrorBoundary>
    </div>
  );
}
