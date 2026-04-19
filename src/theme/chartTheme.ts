import type { CSSProperties } from 'react';

/** Recharts tooltip / chrome tuned for light vs dark dashboard background. */

export function chartTooltipContentStyle(isDark: boolean): CSSProperties {
  if (isDark) {
    return {
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '8px',
      color: '#f9fafb',
    };
  }
  return {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#111827',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
  };
}

export function chartTooltipContentStyleAlt(isDark: boolean): CSSProperties {
  if (isDark) {
    return {
      backgroundColor: '#1f2937',
      border: '1px solid #4b5563',
      borderRadius: '8px',
      color: '#f9fafb',
      fontSize: '13px',
    };
  }
  return {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    color: '#111827',
    fontSize: '13px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
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
