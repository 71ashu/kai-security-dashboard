import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectTopCritical } from '../../store/selectors';

export function TopCriticalCard() {
  const items = useAppSelector(selectTopCritical);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest dark:text-gray-300">
        Top Unreviewed Critical CVEs
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-600 py-4 text-center">
          No unreviewed critical CVEs match the current filters.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((v) => (
            <li key={v.id}>
              <Link
                to={`/vulnerability/${encodeURIComponent(v.id)}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
                           bg-red-50 border border-red-200/70 hover:bg-red-100/80
                           transition-colors group
                           dark:bg-red-950/30 dark:border-red-800/40 dark:hover:bg-red-950/50"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs font-semibold text-red-700 group-hover:text-red-800 truncate dark:text-red-400 dark:group-hover:text-red-300">
                    {v.cve}
                  </span>
                  <span className="text-xs text-gray-500 truncate dark:text-gray-500">
                    {v.packageName} · {v.groupName}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold text-red-600 dark:text-red-400">
                  {v.cvss?.toFixed(1) ?? 'N/A'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-700">
        Sorted by CVSS score · Updates with active filters
      </p>
    </div>
  );
}
