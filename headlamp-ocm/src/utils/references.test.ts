import { describe, expect, it } from 'vitest';
import type { PlacementBindingJson, PlacementJson, PolicyJson } from '../types/ocm';
import type { GraphKubeObject } from './ocmGraph';
import {
  bindingsReferencingPlacement,
  bindingsReferencingPolicy,
  placementsForBinding,
  policiesForBinding,
} from './references';

function kubeObject<T>(kind: string, name: string, namespace: string | null, jsonData: T, uid?: string) {
  return {
    kind,
    metadata: { name, namespace: namespace ?? undefined, uid },
    jsonData,
  } as GraphKubeObject<T>;
}

const policy = (name: string, ns: string, uid = `uid-p-${name}`) =>
  kubeObject<PolicyJson>('Policy', name, ns, { spec: {} }, uid);

const placement = (name: string, ns: string, uid = `uid-pl-${name}`) =>
  kubeObject<PlacementJson>('Placement', name, ns, { spec: {} }, uid);

const binding = (name: string, ns: string, data: PlacementBindingJson, uid = `uid-b-${name}`) =>
  kubeObject<PlacementBindingJson>('PlacementBinding', name, ns, data, uid);

describe('bindingsReferencingPolicy', () => {
  const bindingWithPolicy = binding('b1', 'gov', {
    subjects: [{ kind: 'Policy', name: 'pol-a' }],
  });
  const bindingOtherPolicy = binding('b2', 'gov', {
    subjects: [{ kind: 'Policy', name: 'pol-b' }],
  });
  const bindingOtherKind = binding('b3', 'gov', {
    subjects: [{ kind: 'ConfigMap', name: 'pol-a' }],
  });
  const otherNsBinding = binding(
    'b4',
    'other',
    { subjects: [{ kind: 'Policy', name: 'pol-a', namespace: 'gov' }] },
    'uid-b4'
  );

  it('matches subjects with the same name and namespace', () => {
    const found = bindingsReferencingPolicy({ name: 'pol-a', namespace: 'gov' }, [
      bindingWithPolicy,
      bindingOtherPolicy,
      bindingOtherKind,
    ]);
    expect(found.map(b => b.metadata?.uid)).toEqual(['uid-b-b1']);
  });

  it('honors an explicit subject namespace different from the binding namespace', () => {
    const found = bindingsReferencingPolicy({ name: 'pol-a', namespace: 'gov' }, [otherNsBinding]);
    expect(found.map(b => b.metadata?.uid)).toEqual(['uid-b4']);
  });

  it('is safe with null or missing inputs', () => {
    expect(bindingsReferencingPolicy({ name: 'x' }, null)).toEqual([]);
    expect(bindingsReferencingPolicy(null as any, [{}])).toEqual([]);
  });
});

describe('bindingsReferencingPlacement', () => {
  const b1 = binding('b1', 'gov', { placementRef: { name: 'pl-a' } });
  const b2 = binding('b2', 'gov', { placementRef: { name: 'pl-b' } });
  const b3 = binding('b3', 'other', { placementRef: { name: 'pl-a', namespace: 'other' } });

  it('matches by name and defaults to the binding namespace', () => {
    const found = bindingsReferencingPlacement({ name: 'pl-a', namespace: 'gov' }, [b1, b2, b3]);
    expect(found.map(b => b.metadata?.uid)).toEqual(['uid-b-b1']);
  });

  it('matches an explicit ref namespace when both agree', () => {
    const b4 = binding('b4', 'elsewhere', { placementRef: { name: 'pl-a', namespace: 'gov' } }, 'uid-b4');
    const found = bindingsReferencingPlacement({ name: 'pl-a', namespace: 'gov' }, [b4]);
    expect(found.map(b => b.metadata?.uid)).toEqual(['uid-b4']);
  });

  it('is safe with null or missing inputs', () => {
    expect(bindingsReferencingPlacement({ name: 'x' }, null)).toEqual([]);
  });
});

describe('placementsForBinding', () => {
  const pl = placement('pl-a', 'gov');

  it('resolves the placementRef in the same namespace', () => {
    const b = binding('b1', 'gov', { placementRef: { name: 'pl-a' } });
    expect(placementsForBinding(b, [pl]).map(p => p.metadata?.uid)).toEqual(['uid-pl-pl-a']);
  });

  it('does not match a different namespace', () => {
    const b = binding('b1', 'gov', { placementRef: { name: 'pl-a' } });
    const other = placement('pl-a', 'other', 'uid-pl-other');
    expect(placementsForBinding(b, [other])).toEqual([]);
  });

  it('returns an empty list without a placementRef', () => {
    const b = binding('b1', 'gov', {});
    expect(placementsForBinding(b, [pl])).toEqual([]);
    expect(placementsForBinding(null, [pl])).toEqual([]);
  });
});

describe('policiesForBinding', () => {
  const pol = policy('pol-a', 'gov');

  it('resolves Policy subjects in the same namespace', () => {
    const b = binding('b1', 'gov', { subjects: [{ kind: 'Policy', name: 'pol-a' }] });
    expect(policiesForBinding(b, [pol]).map(p => p.metadata?.uid)).toEqual(['uid-p-pol-a']);
  });

  it('ignores subjects that are not Policies', () => {
    const b = binding('b1', 'gov', { subjects: [{ kind: 'ConfigMap', name: 'pol-a' }] });
    expect(policiesForBinding(b, [pol])).toEqual([]);
  });

  it('returns an empty list for null input', () => {
    expect(policiesForBinding(null, [pol])).toEqual([]);
  });
});
