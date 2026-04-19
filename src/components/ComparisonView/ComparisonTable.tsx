// src/components/ComparisonView/ComparisonTable.tsx
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { Vulnerability } from '../../types/vulnerability';

function detailPath(v: Vulnerability): string {
  return `/vulnerability/${encodeURIComponent(v.id)}`;
}

type RowDef = {
  label: string;
  get: (v: Vulnerability) => string;
};

const ROWS: RowDef[] = [
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
];

const headerLinkClass =
  'block font-mono font-semibold text-blue-400 hover:text-blue-300 transition-colors ' +
  'break-words [overflow-wrap:anywhere] focus-visible:outline focus-visible:ring-2 ' +
  'focus-visible:ring-blue-500 rounded-sm';

const valueLinkClass =
  'block whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-gray-300 ' +
  'hover:text-white transition-colors focus-visible:outline focus-visible:ring-2 ' +
  'focus-visible:ring-blue-500 rounded-sm';

interface Props {
  items: Vulnerability[];
}

export function ComparisonTable({ items }: Props) {
  if (items.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">No items selected.</p>;
  }

  return (
    <div
      className="w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x"
      style={{ '--compare-cols': items.length } as CSSProperties}
    >
      <table
        className="border-collapse text-sm table-fixed
          max-md:w-max max-md:min-w-[calc(9rem+var(--compare-cols)*11rem)]
          md:w-full md:min-w-0"
      >
        <colgroup className="max-md:hidden">
          <col className="w-36 sm:w-40" />
          {items.map((v) => (
            <col key={v.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              className="sticky left-0 z-10 bg-gray-900 border border-gray-800 px-3 py-2 text-left text-xs uppercase tracking-wider text-gray-500
                w-36 max-md:min-w-36 max-md:max-w-36 md:w-auto md:max-w-none"
            >
              Field
            </th>
            {items.map((v) => (
              <th
                key={v.id}
                className="border border-gray-800 px-3 py-2 text-left align-top
                  max-md:w-[11rem] max-md:min-w-[11rem] max-md:max-w-[11rem]
                  min-w-0"
              >
                <Link to={detailPath(v)} className={headerLinkClass}>
                  {v.cve}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <td
                className="sticky left-0 z-10 bg-gray-900/95 border border-gray-800 px-3 py-2 text-gray-500 text-xs uppercase tracking-wider align-top
                  w-36 max-md:min-w-36 max-md:max-w-36 md:w-auto md:max-w-none"
              >
                <span className="block whitespace-normal break-words [overflow-wrap:anywhere]">
                  {row.label}
                </span>
              </td>
              {items.map((v) => (
                <td
                  key={`${v.id}-${row.label}`}
                  className="border border-gray-800 px-3 py-2 align-top
                    max-md:w-[11rem] max-md:min-w-[11rem] max-md:max-w-[11rem]
                    md:min-w-0 md:max-w-0"
                >
                  <Link to={detailPath(v)} className={valueLinkClass}>
                    {row.get(v)}
                  </Link>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
