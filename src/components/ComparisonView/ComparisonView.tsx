// src/components/ComparisonView/ComparisonView.tsx
import type { Vulnerability } from '../../types/vulnerability';

interface Props {
  open: boolean;
  items: Vulnerability[];
  onClose: () => void;
}

const ROWS: { label: string; get: (v: Vulnerability) => string }[] = [
  { label: 'CVE', get: (v) => v.cve },
  { label: 'Severity', get: (v) => v.severity?.toUpperCase() ?? '—' },
  { label: 'CVSS', get: (v) => (v.cvss != null ? v.cvss.toFixed(1) : '—') },
  { label: 'Package', get: (v) => `${v.packageName} ${v.packageVersion}` },
  { label: 'Group', get: (v) => v.groupName },
  { label: 'Repo', get: (v) => v.repoName },
  { label: 'Image', get: (v) => `${v.imageName}:${v.imageVersion}` },
  { label: 'Published', get: (v) => v.published?.slice(0, 10) ?? '—' },
  {
    label: 'KAI Status',
    get: (v) =>
      v.kaiStatus === 'invalid - norisk'
        ? 'Manual Clear'
        : v.kaiStatus === 'ai-invalid-norisk'
          ? 'AI Clear'
          : '—',
  },
  { label: 'Fix status', get: (v) => v.status || '—' },
  {
    label: 'Description',
    get: (v) => v.description,
  },
];

export function ComparisonView({ open, items, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-[min(96vw,1400px)] w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 id="compare-modal-title" className="text-lg font-semibold text-white">
            Compare vulnerabilities
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto flex-1 p-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No items selected.</p>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th
                      className="sticky left-0 z-10 bg-gray-900 border border-gray-800 px-3 py-2 text-left text-xs uppercase tracking-wider text-gray-500 w-40"
                    >
                      Field
                    </th>
                    {items.map((v) => (
                      <th
                        key={v.id}
                        className="border border-gray-800 px-3 py-2 text-left font-mono text-blue-400 font-semibold min-w-[200px]"
                      >
                        {v.cve}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label}>
                      <td
                        className="sticky left-0 z-10 bg-gray-900/95 border border-gray-800 px-3 py-2 text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap"
                      >
                        {row.label}
                      </td>
                      {items.map((v) => (
                        <td
                          key={`${v.id}-${row.label}`}
                          className="border border-gray-800 px-3 py-2 text-gray-300 align-top"
                        >
                          <span className="whitespace-pre-wrap break-words">{row.get(v)}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
