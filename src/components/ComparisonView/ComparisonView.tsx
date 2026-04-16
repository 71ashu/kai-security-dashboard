import type { Vulnerability } from '../../types/vulnerability';

interface Props {
  compareList: Vulnerability[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

const COMPARISON_ROWS: { label: string; key: string }[] = [
  { label: 'Severity',    key: 'severity' },
  { label: 'CVSS',        key: 'cvss' },
  { label: 'Package',     key: 'packageName' },
  { label: 'Version',     key: 'packageVersion' },
  { label: 'Group',       key: 'groupName' },
  { label: 'Repository',  key: 'repoName' },
  { label: 'Published',   key: 'published' },
  { label: 'Fix Date',    key: 'fixDate' },
  { label: 'KAI Status',  key: 'kaiStatus' },
  { label: 'Fix Status',  key: 'status' },
  { label: 'Risk Factors', key: 'riskFactorList' },
];

function CellValue({ vuln, rowKey }: { vuln: Vulnerability; rowKey: string }) {
  if (rowKey === 'severity') {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low:      'bg-green-500/20 text-green-400 border-green-500/30',
      unknown:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[vuln.severity] ?? colors.unknown}`}>
        {vuln.severity?.toUpperCase()}
      </span>
    );
  }

  if (rowKey === 'cvss') {
    const color = vuln.cvss >= 9 ? 'text-red-400' : vuln.cvss >= 7 ? 'text-orange-400' : vuln.cvss >= 4 ? 'text-yellow-400' : 'text-green-400';
    return <span className={`font-mono font-semibold ${color}`}>{vuln.cvss?.toFixed(1) ?? 'N/A'}</span>;
  }

  if (rowKey === 'kaiStatus') {
    if (!vuln.kaiStatus) return <span className="text-gray-600 text-xs">--</span>;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
        ${vuln.kaiStatus === 'invalid - norisk'
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
          : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
        }`}>
        {vuln.kaiStatus === 'invalid - norisk' ? 'Manual Clear' : 'AI Clear'}
      </span>
    );
  }

  if (rowKey === 'riskFactorList') {
    const list = vuln.riskFactorList;
    if (list.length === 0) return <span className="text-gray-600 text-xs">--</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {list.slice(0, 4).map((rf) => (
          <span key={rf} className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            {rf}
          </span>
        ))}
        {list.length > 4 && (
          <span className="text-xs text-gray-500">+{list.length - 4}</span>
        )}
      </div>
    );
  }

  if (rowKey === 'published' || rowKey === 'fixDate') {
    const val = vuln[rowKey as keyof Vulnerability] as string;
    return <span className="font-mono text-xs text-gray-300">{val?.slice(0, 10) || '--'}</span>;
  }

  const val = vuln[rowKey as keyof Vulnerability];
  return <span className="text-sm text-gray-300">{String(val ?? '--') || '--'}</span>;
}

export function ComparisonView({ compareList, onRemove, onClose }: Props) {
  if (compareList.length === 0) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold">CVE Comparison</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
              {compareList.length} / 4
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider w-32 font-normal">
                  Field
                </th>
                {compareList.map((v) => (
                  <th key={v.id} className="px-4 py-3 text-left min-w-[200px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-blue-400 text-sm font-normal">{v.cve}</span>
                      <button
                        onClick={() => onRemove(v.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-xs shrink-0"
                        title="Remove from comparison"
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(({ label, key }) => (
                <tr key={key} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 font-medium whitespace-nowrap">
                    {label}
                  </td>
                  {compareList.map((v) => (
                    <td key={v.id} className="px-4 py-3">
                      <CellValue vuln={v} rowKey={key} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 text-xs text-gray-600">
          Click ✕ on a column header to remove that CVE from the comparison. Maximum 4 CVEs.
        </div>
      </div>
    </div>
  );
}
