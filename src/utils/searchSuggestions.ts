// src/utils/searchSuggestions.ts
import type { Vulnerability } from '../types';

export type SearchSuggestionKind = 'cve' | 'package' | 'group' | 'repo' | 'kai-status' | 'fix-status' | 'cvss';

export interface SearchSuggestionItem {
  id: string;
  kind: SearchSuggestionKind;
  /** Text applied as the search query when chosen */
  primary: string;
  secondary?: string;
}

/**
 * Pre-built lookup structure derived from the vulnerability dataset.
 * Built once when data loads; queried on every keystroke.
 */
export interface SearchIndex {
  cves: string[];
  packages: string[];
  groups: { name: string; secondary: string }[];
  repos: { name: string; secondary: string }[];
  statuses: string[];
  cvssScores: string[];
}

/** Display labels for kaiStatus raw values — mirrors VulnerabilityField and selectors. */
const KAI_STATUS_OPTIONS: { label: string; description: string }[] = [
  { label: 'Manual Clear', description: 'Manually marked as no risk' },
  { label: 'AI Clear', description: 'AI-assessed as no risk' },
];

const DEFAULT_MAX = 10;

/**
 * Build a deduplicated index from the full vulnerability list.
 * Call this once when data changes (e.g. via useMemo), not on every keystroke.
 */
export function buildSearchIndex(data: readonly Vulnerability[]): SearchIndex {
  const cveSet = new Set<string>();
  const packageSet = new Set<string>();
  const groupMap = new Map<string, string>();
  const repoMap = new Map<string, string>();
  const statusSet = new Set<string>();
  const cvssSet = new Set<string>();

  for (const v of data) {
    cveSet.add(v.cve);
    if (v.packageName) packageSet.add(v.packageName);
    if (v.groupName && !groupMap.has(v.groupName)) groupMap.set(v.groupName, v.repoName ?? '');
    if (v.repoName && !repoMap.has(v.repoName)) repoMap.set(v.repoName, v.groupName ?? '');
    if (v.status) statusSet.add(v.status);
    if (v.cvss != null) cvssSet.add(v.cvss.toFixed(1));
  }

  return {
    cves: [...cveSet],
    packages: [...packageSet],
    groups: [...groupMap.entries()].map(([name, secondary]) => ({ name, secondary })),
    repos: [...repoMap.entries()].map(([name, secondary]) => ({ name, secondary })),
    statuses: [...statusSet],
    cvssScores: [...cvssSet].sort((a, b) => parseFloat(b) - parseFloat(a)),
  };
}

/**
 * Query the pre-built index for autocomplete suggestions.
 * Runs on every deferred keystroke against small unique-value sets — O(unique values).
 */
export function buildSearchSuggestions(
  index: SearchIndex,
  rawQuery: string,
  max = DEFAULT_MAX
): SearchSuggestionItem[] {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return [];

  const out: SearchSuggestionItem[] = [];
  const seen = new Set<string>();

  const push = (kind: SearchSuggestionKind, primary: string, secondary?: string) => {
    const key = `${kind}:${primary}`;
    if (seen.has(key) || out.length >= max) return;
    seen.add(key);
    out.push({ id: key, kind, primary, secondary });
  };

  // KAI status: static enum
  for (const opt of KAI_STATUS_OPTIONS) {
    if (out.length >= max) break;
    if (opt.label.toLowerCase().includes(q)) push('kai-status', opt.label, opt.description);
  }

  // CVEs: prefix first, then substring
  for (const cve of index.cves) {
    if (out.length >= max) break;
    if (cve.toLowerCase().startsWith(q)) push('cve', cve);
  }
  for (const cve of index.cves) {
    if (out.length >= max) break;
    const lc = cve.toLowerCase();
    if (!lc.startsWith(q) && lc.includes(q)) push('cve', cve);
  }

  // Packages: prefix first, then substring
  for (const pkg of index.packages) {
    if (out.length >= max) break;
    if (pkg.toLowerCase().startsWith(q)) push('package', pkg);
  }
  for (const pkg of index.packages) {
    if (out.length >= max) break;
    const lc = pkg.toLowerCase();
    if (!lc.startsWith(q) && lc.includes(q)) push('package', pkg);
  }

  // Groups and repos
  for (const g of index.groups) {
    if (out.length >= max) break;
    if (g.name.toLowerCase().includes(q)) push('group', g.name, g.secondary);
  }
  for (const r of index.repos) {
    if (out.length >= max) break;
    if (r.name.toLowerCase().includes(q)) push('repo', r.name, r.secondary);
  }

  // Fix status
  for (const s of index.statuses) {
    if (out.length >= max) break;
    if (s.toLowerCase().includes(q)) push('fix-status', s);
  }

  // CVSS scores (sorted high → low so critical scores surface first)
  for (const score of index.cvssScores) {
    if (out.length >= max) break;
    if (score.includes(q)) push('cvss', score);
  }

  return out;
}
