import type { CSSProperties } from 'react';

/** Recharts tooltip / chrome tuned for light vs dark dashboard background.
 *  `variant: 'alt'` uses slightly lighter dark-mode chrome and a smaller font (13px),
 *  suited for bar/line charts with denser data. */
export function chartTooltipContentStyle(
  isDark: boolean,
  variant: 'default' | 'alt' = 'default'
): CSSProperties {
  const isAlt = variant === 'alt';
  const fontSize = isAlt ? '13px' : undefined;
  if (isDark) {
    return {
      backgroundColor: isAlt ? '#1f2937' : '#111827',
      border: `1px solid ${isAlt ? '#4b5563' : '#374151'}`,
      borderRadius: '8px',
      color: '#f9fafb',
      ...(fontSize && { fontSize }),
    };
  }
  return {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#111827',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
    ...(fontSize && { fontSize }),
  };
}

export const chartAxisTickMuted = (isDark: boolean) =>
  isDark ? '#6b7280' : '#6b7280';

export const chartAxisTickSecondary = (isDark: boolean) =>
  isDark ? '#9ca3af' : '#4b5563';

export const chartGridStroke = (isDark: boolean) =>
  isDark ? '#1f2937' : '#e5e7eb';

export const chartLegendTextColor = (isDark: boolean) =>
  isDark ? '#9ca3af' : '#4b5563';
