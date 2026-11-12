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

/**
 * Returns a color for a boolean-ish condition status.
 */
export function statusColor(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'true' || normalized === 'compliant') return '#2e7d32';
  if (normalized === 'false' || normalized === 'noncompliant') return '#c62828';
  return '#666';
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
