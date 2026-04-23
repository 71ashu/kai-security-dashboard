import { Link } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppHeader } from '../components/Layout';
import { ComparisonTable } from '../components/ComparisonView';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCompareVulnerabilities } from '../store/selectors';
import { compareSelectionCleared, MAX_COMPARE_SELECTION } from '../store/comparisonSlice';

export function ComparisonPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCompareVulnerabilities);
  const compareIds = useAppSelector((s) => s.comparison.ids);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden dark:bg-gray-950 dark:text-white">
      <AppHeader
        backLink={{ to: '/', label: '← Dashboard' }}
        subtitle="Compare vulnerabilities"
        actions={
          compareIds.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(compareSelectionCleared())}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300
                         bg-gray-100/90 text-gray-800 hover:bg-gray-200 transition-colors
                         dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Clear selection
            </button>
          )
        }
      />

      <ErrorBoundary>
        <main className="w-full max-w-screen-2xl mx-auto min-w-0 px-4 sm:px-8 py-6 box-border">
          {compareIds.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center space-y-3 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400">
                Select up to {MAX_COMPARE_SELECTION} vulnerabilities from the table to compare them side by side.
              </p>
              <Link to="/" className="inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Back to dashboard
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-amber-600/35 bg-amber-500/10 p-8 text-center space-y-3 dark:border-amber-500/30 dark:bg-amber-500/5">
              <p className="text-amber-900 text-sm dark:text-amber-200/90">
                Selected items are no longer in the loaded dataset. Clear the selection and pick
                rows again.
              </p>
              <button
                type="button"
                onClick={() => dispatch(compareSelectionCleared())}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-600/40
                           bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 transition-colors
                           dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
              >
                Clear selection
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 min-w-0 max-w-full dark:bg-gray-900 dark:border-gray-800">
              <ComparisonTable items={items} />
            </div>
          )}
        </main>
      </ErrorBoundary>
    </div>
  );
}
