import { describe, expect, it } from 'vitest';
import { getConditionStatus, getPlacementDecisionNames, statusColor } from './cluster';

const cluster = (conditions: any[]) => ({
  metadata: { name: 'c1' },
  jsonData: { status: { conditions } },
});

describe('getConditionStatus', () => {
  it('returns the status of the condition with the given type', () => {
    const item = cluster([
      { type: 'ManagedClusterConditionAvailable', status: 'True' },
      { type: 'HubAcceptedManagedCluster', status: 'False' },
    ]);
    expect(getConditionStatus(item, 'ManagedClusterConditionAvailable')).toBe('True');
    expect(getConditionStatus(item, 'HubAcceptedManagedCluster')).toBe('False');
  });

  it('returns "Unknown" when the condition type is not present', () => {
    expect(getConditionStatus(cluster([]), 'ManagedClusterConditionJoined')).toBe('Unknown');
    expect(getConditionStatus(cluster(undefined as any), 'ManagedClusterConditionJoined')).toBe('Unknown');
  });

  it('returns "Unknown" when the condition has no status', () => {
    expect(getConditionStatus(cluster([{ type: 'ManagedClusterConditionJoined' }]), 'ManagedClusterConditionJoined')).toBe('Unknown');
  });
});

describe('statusColor', () => {
  it('maps True/Compliant to green', () => {
    expect(statusColor('True')).toBe('#2e7d32');
    expect(statusColor('COMPLIANT')).toBe('#2e7d32');
    expect(statusColor('compliant')).toBe('#2e7d32');
  });

  it('maps False/NonCompliant to red', () => {
    expect(statusColor('False')).toBe('#c62828');
    expect(statusColor('NonCompliant')).toBe('#c62828');
  });

  it('maps anything else to gray', () => {
    expect(statusColor('Unknown')).toBe('#666');
    expect(statusColor('Pending')).toBe('#666');
  });
});

describe('getPlacementDecisionNames', () => {
  it('collects cluster names from the placement decisions', () => {
    const placement = {
      metadata: { name: 'p', namespace: 'ns' },
      jsonData: {
        status: {
          decisions: [
            { clusterName: 'a' },
            { clusterName: 'b' },
            { clusterName: '' },
            {},
          ],
        },
      },
    };
    expect(getPlacementDecisionNames(placement)).toEqual(['a', 'b']);
  });

  it('returns at most 8 names', () => {
    const decisions = Array.from({ length: 12 }, (_, i) => ({ clusterName: `c${i}` }));
    const placement = {
      metadata: { name: 'p' },
      jsonData: { status: { decisions } },
    };
    const names = getPlacementDecisionNames(placement);
    expect(names).toHaveLength(8);
    expect(names[0]).toBe('c0');
    expect(names[7]).toBe('c7');
  });

  it('returns an empty list when there are no decisions', () => {
    expect(getPlacementDecisionNames({ jsonData: {} } as any)).toEqual([]);
    expect(getPlacementDecisionNames({} as any)).toEqual([]);
  });
});
