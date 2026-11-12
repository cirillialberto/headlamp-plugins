import { describe, expect, it } from 'vitest';
import type {
  ManagedClusterJson,
  PlacementBindingJson,
  PlacementJson,
  PolicyJson,
  PolicySetJson,
} from '../types/ocm';
import {
  buildPlacementBindingEdges,
  buildPlacementEdges,
  buildPolicySetEdges,
  GraphKubeObject,
  makeKubeToKubeEdge,
  managedClusterNodeStatus,
  nodeIdentity,
  placementNodeStatus,
  policyNodeStatus,
} from './ocmGraph';

function kubeObject<T>(kind: string, name: string, namespace: string | null, jsonData: T, uid?: string) {
  return {
    kind,
    metadata: {
      name,
      namespace: namespace ?? undefined,
      uid,
    },
    jsonData,
  } as GraphKubeObject<T>;
}

const cluster = (name: string, available: boolean, uid = `uid-cluster-${name}`) =>
  kubeObject<ManagedClusterJson>(
    'ManagedCluster',
    name,
    null,
    {
      status: {
        conditions: [{ type: 'Available', status: available ? 'True' : 'False' }],
      },
    },
    uid
  );

const placement = (
  name: string,
  namespace: string,
  data: { desired?: number; selected?: number; decisions?: { clusterName?: string }[] },
  uid = `uid-placement-${name}`
) =>
  kubeObject<PlacementJson>(
    'Placement',
    name,
    namespace,
    {
      spec: { numberOfClusters: data.desired ?? 0 },
      status: { numberOfSelectedClusters: data.selected ?? 0, decisions: data.decisions ?? [] },
    },
    uid
  );

const binding = (
  name: string,
  namespace: string,
  data: { placementRef?: { name?: string; namespace?: string }; subjects?: { kind?: string; name?: string; namespace?: string }[] },
  uid = `uid-binding-${name}`
) => kubeObject<PlacementBindingJson>('PlacementBinding', name, namespace, data as PlacementBindingJson, uid);

const policy = (name: string, namespace: string, compliant: string, uid = `uid-policy-${name}`) =>
  kubeObject<PolicyJson>('Policy', name, namespace, { status: { compliant } }, uid);

describe('nodeIdentity', () => {
  it('prefers the uid when present', () => {
    expect(nodeIdentity(kubeObject('X', 'a', 'ns', {}, 'u1'))).toBe('u1');
  });

  it('falls back to namespace/name without a uid', () => {
    expect(nodeIdentity(kubeObject('X', 'a', 'ns', {}))).toBe('ns/a');
  });

  it('falls back to name alone for cluster-scoped objects', () => {
    expect(nodeIdentity(kubeObject('X', 'a', null, {}))).toBe('a');
  });

  it('returns "unknown" for empty objects', () => {
    expect(nodeIdentity(null)).toBe('unknown');
    expect(nodeIdentity({ metadata: {}, jsonData: {} })).toBe('unknown');
  });
});

describe('makeKubeToKubeEdge', () => {
  it('creates an edge between the object uids', () => {
    const from = kubeObject('A', 'a', 'ns', {}, 'f1');
    const to = kubeObject('B', 'b', 'ns', {}, 't1');
    expect(makeKubeToKubeEdge(from, to)).toEqual({ id: 'f1-t1', source: 'f1', target: 't1' });
  });
});

describe('buildPlacementEdges', () => {
  it('links each selected cluster decision to the matching ManagedCluster', () => {
    const p = placement('p1', 'ocm', { desired: 2, selected: 2, decisions: [{ clusterName: 'c1' }, { clusterName: 'c2' }] });
    const edges = buildPlacementEdges([p], [cluster('c1', true), cluster('c2', true), cluster('c3', true)]);
    expect(edges).toHaveLength(2);
    expect(edges.map(e => e.target).sort()).toEqual(['uid-cluster-c1', 'uid-cluster-c2']);
    expect(edges.every(e => e.source === 'uid-placement-p1')).toBe(true);
  });

  it('skips decisions whose cluster is not in the list', () => {
    const p = placement('p1', 'ocm', { decisions: [{ clusterName: 'missing' }, { clusterName: undefined }] });
    expect(buildPlacementEdges([p], [cluster('c1', true)])).toEqual([]);
  });

  it('is safe with null or missing inputs', () => {
    expect(buildPlacementEdges(null, null)).toEqual([]);
    expect(buildPlacementEdges([{}], null)).toEqual([]);
  });
});

describe('buildPlacementBindingEdges', () => {
  const p = placement('place-a', 'governance', {});
  const pol = policy('my-policy', 'governance', 'Compliant');

  it('links the binding to the placement in the same namespace', () => {
    const b = binding('b1', 'governance', { placementRef: { name: 'place-a' } });
    const edges = buildPlacementBindingEdges([b], [p], [pol]);
    expect(edges).toContainEqual({ id: 'uid-binding-b1-uid-placement-place-a', source: 'uid-binding-b1', target: 'uid-placement-place-a' });
  });

  it('respects an explicit placementRef namespace mismatch', () => {
    const otherNsPlacement = placement('place-a', 'other-ns', {}, 'uid-other');
    const b = binding('b1', 'governance', { placementRef: { name: 'place-a', namespace: 'other-ns' } });
    const edges = buildPlacementBindingEdges([b], [p, otherNsPlacement], [pol]);
    expect(edges.map(e => e.target)).toEqual(['uid-other']);
  });

  it('links the binding to Policy subjects only', () => {
    const b = binding('b1', 'governance', {
      subjects: [
        { kind: 'Policy', name: 'my-policy' },
        { kind: 'ConfigMap', name: 'my-policy' },
      ],
    });
    const edges = buildPlacementBindingEdges([b], [p], [pol]);
    expect(edges).toContainEqual({ id: 'uid-binding-b1-uid-policy-my-policy', source: 'uid-binding-b1', target: 'uid-policy-my-policy' });
    expect(edges).toHaveLength(1);
  });

  it('is safe with null or missing inputs', () => {
    expect(buildPlacementBindingEdges(null, null, null)).toEqual([]);
    expect(buildPlacementBindingEdges([{}], null, null)).toEqual([]);
  });
});

describe('buildPolicySetEdges', () => {
  const pol = policy('pol-a', 'governance', 'Compliant');

  it('links the policy set to its bundled policies', () => {
    const ps = kubeObject<PolicySetJson>(
      'PolicySet',
      'set-a',
      'governance',
      { spec: { policies: [{ name: 'pol-a' }] } },
      'uid-set-a'
    );
    const edges = buildPolicySetEdges([ps], [pol]);
    expect(edges).toEqual([{ id: 'uid-set-a-uid-policy-pol-a', source: 'uid-set-a', target: 'uid-policy-pol-a' }]);
  });

  it('defaults the policy namespace to the policy set namespace', () => {
    const polOther = policy('pol-a', 'elsewhere', 'Compliant', 'uid-other');
    const ps = kubeObject<PolicySetJson>('PolicySet', 'set-a', 'governance', { spec: { policies: [{ name: 'pol-a' }] } });
    const edges = buildPolicySetEdges([ps], [polOther]);
    expect(edges).toHaveLength(0);
  });

  it('is safe with null or missing inputs', () => {
    expect(buildPolicySetEdges(null, null)).toEqual([]);
    expect(buildPolicySetEdges([{}], null)).toEqual([]);
  });
});

describe('node status helpers', () => {
  it('maps the ManagedCluster Available condition', () => {
    expect(managedClusterNodeStatus([{ type: 'Available', status: 'True' }])).toBe('success');
    expect(managedClusterNodeStatus([{ type: 'Available', status: 'False' }])).toBe('warning');
    expect(managedClusterNodeStatus([{ type: 'Joined', status: 'True' }])).toBeUndefined();
    expect(managedClusterNodeStatus(null)).toBeUndefined();
  });

  it('maps the Placement selection state', () => {
    expect(placementNodeStatus(placement('p', 'ns', { desired: 1, selected: 1 }))).toBe('success');
    expect(placementNodeStatus(placement('p', 'ns', { desired: 1, selected: 0 }))).toBe('warning');
    expect(placementNodeStatus(placement('p', 'ns', { desired: 0, selected: 0 }))).toBeUndefined();
    expect(placementNodeStatus(null)).toBeUndefined();
  });

  it('maps the Policy compliance state', () => {
    expect(policyNodeStatus(policy('a', 'ns', 'Compliant'))).toBe('success');
    expect(policyNodeStatus(policy('a', 'ns', 'NonCompliant'))).toBe('error');
    expect(policyNodeStatus(policy('a', 'ns', 'Pending'))).toBeUndefined();
    expect(policyNodeStatus(null)).toBeUndefined();
  });
});
