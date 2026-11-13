import { useTheme } from '@mui/material';
import { useMemo } from 'react';

/** Theme-aware colors for the plugin-owned UI elements. */
export interface StatusColors {
  /** Healthy / compliant / available states. */
  positive: string;
  /** Failing / non-compliant states. */
  negative: string;
  /** Pending / warning states. */
  warning: string;
  /** Error text (e.g. failed loads). */
  error: string;
  /** De-emphasized text. */
  muted: string;
  /** Secondary body text. */
  body: string;
  /** Borders and separators. */
  divider: string;
  /** Subtle background (e.g. YAML blocks). */
  backgroundAlt: string;
}

/** Light-mode fallbacks, used when a theme value is not available. */
const FALLBACK: StatusColors = {
  positive: '#2e7d32',
  negative: '#c62828',
  warning: '#FF9800',
  error: '#c62828',
  muted: '#666',
  body: '#444',
  divider: '#ddd',
  backgroundAlt: '#f8f8f8',
};

/**
 * Returns theme-aware colors for the plugin UI so that it adapts to
 * Headlamp's light and dark modes.
 *
 * Values are read from the active MUI theme palette; any value that is
 * missing (or the `inherit` sentinel) falls back to the original static
 * light-mode color.
 */
export function useStatusColors(): StatusColors {
  const theme = useTheme();

  return useMemo(() => {
    const palette = theme?.palette;
    const resolve = (value: unknown, fallback: string) =>
      typeof value === 'string' && value.length > 0 && value !== 'inherit' ? value : fallback;

    return {
      positive: resolve(palette?.success?.main, FALLBACK.positive),
      negative: resolve(palette?.error?.main, FALLBACK.negative),
      warning: resolve(palette?.warning?.main, FALLBACK.warning),
      error: resolve(palette?.error?.main, FALLBACK.error),
      muted: resolve(palette?.text?.disabled, FALLBACK.muted),
      body: resolve(palette?.text?.secondary, FALLBACK.body),
      divider: resolve(palette?.divider, FALLBACK.divider),
      backgroundAlt: resolve(palette?.background?.muted, FALLBACK.backgroundAlt),
    };
  }, [theme]);
}
