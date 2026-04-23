export { downloadVulnerabilitiesCsv } from './export';
export type { SearchSuggestionKind, SearchSuggestionItem, SearchIndex } from './searchSuggestions';
export { buildSearchIndex, buildSearchSuggestions } from './searchSuggestions';

/** Capitalizes the first character of a string. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
