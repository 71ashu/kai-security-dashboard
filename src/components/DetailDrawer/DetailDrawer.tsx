// src/components/DetailDrawer/DetailDrawer.tsx
import type { Vulnerability } from '../../types/vulnerability';

interface Props {
  vuln: Vulnerability;
  onClose: () => void;
  onAddToCompare: () => void;
  isInCompareList: boolean;
}

export function DetailDrawer({ vuln, onClose, onAddToCompare, isInCompareList }: Props) {
  return (
    <div
      className="fixed inset-y-0 right-0 w-[480px] bg-gray-900 border-l border-gray-800
                 shadow-2xl z-20 overflow-y-auto flex flex-col"
      role="dialog"
      aria-labelledby="drawer-cve-title"
    >
      <div className="p-6 space-y-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="drawer-cve-title" className="font-mono text-blue-400 font-semibold text-lg">
              {vuln.cve}
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono truncate" title={vuln.id}>
              {vuln.id}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onAddToCompare}
              disabled={isInCompareList}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-500/40
                         bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-500/10"
            >
              {isInCompareList ? 'In compare' : '+ Compare'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <DetailField label="Severity" value={vuln.severity?.toUpperCase() ?? '—'} />
          <DetailField label="CVSS" value={vuln.cvss != null ? vuln.cvss.toFixed(1) : '—'} />
          <DetailField label="Package" value={`${vuln.packageName} ${vuln.packageVersion}`} />
          <DetailField label="Group" value={vuln.groupName} />
          <DetailField label="Repo" value={vuln.repoName} />
          <DetailField label="Image" value={`${vuln.imageName}:${vuln.imageVersion}`} />
          <DetailField label="Published" value={vuln.published?.slice(0, 10) ?? '—'} />
          <DetailField
            label="KAI Status"
            value={
              vuln.kaiStatus === 'invalid - norisk'
                ? 'Manual Clear'
                : vuln.kaiStatus === 'ai-invalid-norisk'
                  ? 'AI Clear'
                  : '—'
            }
          />
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fix status</div>
          <div className="text-sm text-gray-300">{vuln.status || '—'}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</div>
          <div className="text-sm text-gray-400 leading-relaxed">{vuln.description}</div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-gray-300 truncate" title={value}>
        {value}
      </div>
    </div>
  );
}
