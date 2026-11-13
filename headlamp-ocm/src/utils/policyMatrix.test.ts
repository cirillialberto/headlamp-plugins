import { describe, expect, it } from 'vitest';
import type { ManagedClusterJson, PolicyJson, PolicyStatusEntry } from '../types/ocm';
import type { ResourceLike } from '../types/ocm';
import { buildPolicyMatrix, policyEntryReason, policyEntryState } from './policyMatrix';

function cluster(name: string, uid = `uid-c-${name}`) {
  return {
    metadata: { name, uid },
    jsonData: { status: {} },
  } as ResourceLike<ManagedClusterJson>;
}

function policy(name: string, namespace: string, status: PolicyJson['status'], uid = `uid-p-${name}`) {
  return {
    metadata: { name, namespace, uid },
    jsonData: { status },
  } as ResourceLike<PolicyJson>;
}

describe('policyEntryState', () => {
  it('normalizes the compliance state of an entry', () => {
    expect(policyEntryState({ complianceState: 'Compliant' })).toBe('compliant');
    expect(policyEntryState({ complianceState: 'NonCompliant' })).toBe('noncompliant');
    expect(policyEntryState({ compliant: 'compliant' })).toBe('compliant');
    expect(policyEntryState({ compliant: 'noncompliant' })).toBe('noncompliant');
    expect(policyEntryState({ complianceState: 'Pending' })).toBe('pending');
    expect(policyEntryState(null)).toBe('pending');
  });
});

describe('policyEntryReason', () => {
  it('prefers the first non-empty clause message', () => {
    const entry: PolicyStatusEntry = {
      clauses: [{ message: '  ' }, { message: 'Pod must exist' }, { reason: 'ignored' }],
      message: 'top level',
    };
    expect(policyEntryReason(entry)).toBe('Pod must exist');
  });

  it('falls back to the entry message, then the state', () => {
    expect(policyEntryReason({ clauses: [], message: 'Something wrong' })).toBe('Something wrong');
    expect(policyEntryReason({ complianceState: 'NonCompliant' })).toBe('NonCompliant');
  });
});

describe('buildPolicyMatrix', () => {
  const c1 = cluster('c1');
  const c2 = cluster('c2');
  const polA = policy(
    'pol-a',
    'gov',
    {
      compliant: 'NonCompliant',
      status: [
        { clusterName: 'c1', complianceState: 'Compliant' },
        { clusterName: 'c2', complianceState: 'NonCompliant', message: 'violation detected' },
      ],
    }
  );

  it('uses the union of managed clusters and reported clusters as columns', () => {
    const polB = policy('pol-b', 'gov', { compliant: 'Compliant', status: [{ clusterName: 'c3', complianceState: 'Compliant' }] });
    const matrix = buildPolicyMatrix([polA, polB], [c1, c2]);
    expect(matrix.clusterNames).toEqual(['c1', 'c2', 'c3']);
  });

  it('fills cells from the per-cluster status entries', () => {
    const matrix = buildPolicyMatrix([polA], [c1, c2]);
    expect(matrix.rows).toHaveLength(1);
    expect(matrix.rows[0].cells.c1).toEqual({ state: 'compliant', reason: 'Compliant' });
    expect(matrix.rows[0].cells.c2.state).toBe('noncompliant');
    expect(matrix.rows[0].cells.c2.reason).toBe('violation detected');
  });

  it('marks unreported clusters as "none"', () => {
    const polC = policy('pol-c', 'gov', { compliant: 'Pending', status: [] });
    const matrix = buildPolicyMatrix([polC], [c1, c2]);
    expect(matrix.rows[0].cells.c1).toEqual({ state: 'none' });
    expect(matrix.rows[0].cells.c2).toEqual({ state: 'none' });
  });

  it('sorts rows by namespace/name and is safe with null inputs', () => {
    const polZ = policy('pol-z', 'zz', { compliant: 'Compliant', status: [] });
    const polG = policy('pol-g', 'aa', { compliant: 'Compliant', status: [] });
    const matrix = buildPolicyMatrix([polZ, polG], null);
    expect(matrix.rows.map(r => r.name)).toEqual(['pol-g', 'pol-z']);
    expect(buildPolicyMatrix(null, null).clusterNames).toEqual([]);
    expect(buildPolicyMatrix(null, null).rows).toEqual([]);
  });
});
