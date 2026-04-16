import type { Vulnerability } from '../../types/vulnerability';

interface Props {
  vuln: Vulnerability | null;
  onClose: () => void;
  onCompare: (vuln: Vulnerability) => void;
  compareList: Vulnerability[];
}

function cvssColor(score: number) {
  if (score >= 9) return 'text-red-400';
  if (score >= 7) return 'text-orange-400';
  if (score >= 4) return 'text-yellow-400';
  return 'text-green-400';
}

function cvssBarColor(score: number) {
  if (score >= 9) return 'bg-red-500';
  if (score >= 7) return 'bg-orange-500';
  if (score >= 4) return 'bg-yellow-500';
  return 'bg-green-500';
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs text-gray-300 text-right truncate ${mono ? 'font-mono' : ''}`}>
        {value || '--'}
      </span>
    </div>
  );
}

export function DetailDrawer({ vuln, onClose, onCompare, compareList }: Props) {
  if (!vuln) return null;

  const isInCompare = compareList.some((v) => v.id === vuln.id);
  const compareFull = !isInCompare && compareList.length >= 4;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-[480px] bg-gray-900 border-l border-gray-800 shadow-2xl z-30 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
          <span className="font-mono text-blue-400 font-semibold text-sm">{vuln.cve}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => !compareFull && !isInCompare && onCompare(vuln)}
              disabled={compareFull}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                ${isInCompare
                  ? 'bg-green-500/10 text-green-400 border-green-500/30 cursor-default'
                  : compareFull
                    ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 cursor-pointer'
                }`}
            >
              {isInCompare ? '✓ In Compare' : compareFull ? 'Compare Full (4)' : '+ Compare'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* CVSS Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider">CVSS Score</span>
              <span className={`text-2xl font-bold font-mono ${cvssColor(vuln.cvss)}`}>
                {vuln.cvss != null ? vuln.cvss.toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${cvssBarColor(vuln.cvss)}`}
                style={{ width: `${Math.min((vuln.cvss / 10) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-700">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Severity + NVD link */}
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full font-medium border
              ${vuln.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : vuln.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              : vuln.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
              {vuln.severity?.toUpperCase()}
            </span>
            {vuln.link && (
              <a
                href={vuln.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                NVD ↗
              </a>
            )}
          </div>

          {/* KAI Status */}
          {vuln.kaiStatus && (
            <div className={`rounded-lg border p-3 space-y-1
              ${vuln.kaiStatus === 'invalid - norisk'
                ? 'bg-blue-500/5 border-blue-500/20'
                : 'bg-purple-500/5 border-purple-500/20'
              }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider
                ${vuln.kaiStatus === 'invalid - norisk' ? 'text-blue-400' : 'text-purple-400'}`}>
                {vuln.kaiStatus === 'invalid - norisk' ? 'Manual Analysis: Cleared' : 'AI Analysis: Cleared'}
              </div>
              <div className="text-xs text-gray-400">
                {vuln.kaiStatus === 'invalid - norisk'
                  ? 'Manually reviewed and determined to be no risk.'
                  : 'AI-analyzed and determined to be no risk.'}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider">Description</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {vuln.description || 'No description available.'}
            </p>
          </div>

          {/* Package Info */}
          <div className="space-y-2">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider">Package</h3>
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1.5">
              <Row label="Name" value={vuln.packageName} mono />
              <Row label="Version" value={vuln.packageVersion} mono />
              {vuln.packageType && <Row label="Type" value={vuln.packageType} />}
              {vuln.path && <Row label="Path" value={vuln.path} mono />}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider">Location</h3>
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1.5">
              <Row label="Group" value={vuln.groupName} />
              <Row label="Repository" value={vuln.repoName} />
              <Row label="Image" value={vuln.imageName} />
              <Row label="Image Version" value={vuln.imageVersion} mono />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider">Timeline</h3>
            <div className="bg-gray-800/50 rounded-lg p-3 space-y-1.5">
              <Row label="Published" value={vuln.published?.slice(0, 10) ?? ''} mono />
              <Row label="Fix Available" value={vuln.fixDate?.slice(0, 10) || 'Not yet'} mono />
              <Row label="Fix Status" value={vuln.status} />
            </div>
          </div>

          {/* Risk Factors */}
          {vuln.riskFactorList.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">Risk Factors</h3>
              <div className="flex flex-wrap gap-2">
                {vuln.riskFactorList.map((rf) => (
                  <span
                    key={rf}
                    className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {rf}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
