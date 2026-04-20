// src/utils/searchSuggestions.ts
import type { Vulnerability } from '../types';

export type SearchSuggestionKind = 'cve' | 'package' | 'group' | 'repo';

export interface SearchSuggestionItem {
  id: string;
  kind: SearchSuggestionKind;
  /** Text applied as the search query when chosen */
  primary: string;
  secondary?: string;
}

const DEFAULT_MAX = 10;

/**
 * Lightweight hints for the search field: prefix matches first, then substring matches.
 * Several passes stop early once the list is full.
 */
export function buildSearchSuggestions(
  data: readonly Vulnerability[],
  rawQuery: string,
  max = DEFAULT_MAX
): SearchSuggestionItem[] {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) return [];

  const out: SearchSuggestionItem[] = [];
  const seen = new Set<string>();

  const push = (kind: SearchSuggestionKind, primary: string, secondary?: string) => {
    const key = `${kind}:${primary}`;
    if (seen.has(key)) return;
    if (out.length >= max) return;
    seen.add(key);
    out.push({ id: key, kind, primary, secondary });
  };

  for (const v of data) {
    if (out.length >= max) break;
    if (v.cve.toLowerCase().startsWith(q)) push('cve', v.cve);
  }

  for (const v of data) {
    if (out.length >= max) break;
    if (v.packageName.toLowerCase().startsWith(q)) push('package', v.packageName);
  }

  for (const v of data) {
    if (out.length >= max) break;
    const c = v.cve.toLowerCase();
    if (c.startsWith(q)) continue;
    if (c.includes(q)) push('cve', v.cve);
  }

  for (const v of data) {
    if (out.length >= max) break;
    const p = v.packageName.toLowerCase();
    if (p.startsWith(q)) continue;
    if (p.includes(q)) push('package', v.packageName);
  }

  for (const v of data) {
    if (out.length >= max) break;
    const g = v.groupName.toLowerCase();
    if (g.includes(q) || g.startsWith(q)) push('group', v.groupName, v.repoName);
  }

  for (const v of data) {
    if (out.length >= max) break;
    const r = v.repoName.toLowerCase();
    if (r.includes(q) || r.startsWith(q)) push('repo', v.repoName, v.groupName);
  }

  return out;
}
