import type { Vulnerability } from '../types';

/** Returns the detail page path for a given vulnerability. */
export function vulnerabilityPath(v: Vulnerability): string {
  return `/vulnerability/${encodeURIComponent(v.id)}`;
}
