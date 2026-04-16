import Papa from 'papaparse';
import type { Vulnerability } from '../types/vulnerability';

export function exportToCSV(data: Vulnerability[], filename = 'vulnerabilities.csv') {
  const rows = data.map((v) => ({
    id: v.id,
    cve: v.cve,
    severity: v.severity,
    cvss: v.cvss,
    status: v.status,
    kaiStatus: v.kaiStatus ?? '',
    description: v.description,
    packageName: v.packageName,
    packageVersion: v.packageVersion,
    packageType: v.packageType,
    groupName: v.groupName,
    repoName: v.repoName,
    imageName: v.imageName,
    imageVersion: v.imageVersion,
    published: v.published,
    fixDate: v.fixDate,
    path: v.path,
    riskFactors: v.riskFactorList.join(', '),
    link: v.link,
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
