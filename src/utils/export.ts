// src/utils/export.ts
import type { Vulnerability } from '../types';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const EXPORT_KEYS: (keyof Vulnerability)[] = [
  'id',
  'cve',
  'severity',
  'cvss',
  'packageName',
  'packageVersion',
  'groupName',
  'repoName',
  'imageName',
  'imageVersion',
  'published',
  'kaiStatus',
  'status',
  'description',
];

const HEADER_LABELS: Record<string, string> = {
  id: 'ID',
  cve: 'CVE',
  severity: 'Severity',
  cvss: 'CVSS',
  packageName: 'Package',
  packageVersion: 'Package Version',
  groupName: 'Group',
  repoName: 'Repo',
  imageName: 'Image',
  imageVersion: 'Image Version',
  published: 'Published',
  kaiStatus: 'KAI Status',
  status: 'Fix Status',
  description: 'Description',
};

/**
 * Triggers a browser download of the given vulnerabilities as CSV (UTF-8).
 * Intended for the currently filtered dataset from `selectFilteredVulnerabilities`.
 */
export function downloadVulnerabilitiesCsv(
  vulnerabilities: Vulnerability[],
  filename = 'kai-vulnerabilities.csv'
): void {
  const headerLine = EXPORT_KEYS.map((k) => escapeCsvCell(HEADER_LABELS[k] ?? String(k))).join(',');

  const lines = vulnerabilities.map((v) =>
    EXPORT_KEYS.map((key) => {
      const raw = v[key];
      if (raw === undefined || raw === null) return '';
      if (typeof raw === 'number') return String(raw);
      return escapeCsvCell(String(raw));
    }).join(',')
  );

  const csv = [headerLine, ...lines].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
