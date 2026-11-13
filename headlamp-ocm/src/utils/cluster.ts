import type {
  ManagedClusterJson,
  PlacementDecision,
  PlacementJson,
  ResourceLike,
} from '../types/ocm';

/**
 * Returns the status of a condition of the given type, or "Unknown".
 */
export function getConditionStatus(item: ResourceLike<ManagedClusterJson>, type: string): string {
  const condition = (item?.jsonData?.status?.conditions || []).find(
    (c: { type?: string }) => c?.type === type
  );
  return String(condition?.status || 'Unknown');
}

/** Optional theme colors for {@link statusColor}. */
export interface StatusColorPalette {
  positive?: string;
  negative?: string;
  muted?: string;
}

/**
 * Returns a color for a boolean-ish condition status.
 * When `colors` is provided (e.g. from `useStatusColors`) those values are
 * used, so the result adapts to the active light/dark theme.
 */
export function statusColor(status: string, colors?: StatusColorPalette): string {
  const positive = colors?.positive ?? '#2e7d32';
  const negative = colors?.negative ?? '#c62828';
  const muted = colors?.muted ?? '#666';
  const normalized = status.toLowerCase();
  if (normalized === 'true' || normalized === 'compliant') return positive;
  if (normalized === 'false' || normalized === 'noncompliant') return negative;
  return muted;
}

/**
 * Returns the names of the clusters selected by a Placement
 * (at most 8, for preview purposes).
 */
export function getPlacementDecisionNames(placement: ResourceLike<PlacementJson>): string[] {
  return (placement?.jsonData?.status?.decisions || [])
    .map((d: PlacementDecision) => d?.clusterName)
    .filter((name): name is string => Boolean(name))
    .slice(0, 8);
}
