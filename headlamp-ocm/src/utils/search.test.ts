import { describe, expect, it } from 'vitest';
import { makeSearchFilter } from './search';

const item = (overrides: Record<string, any> = {}) => ({
  metadata: { name: 'my-cluster', namespace: 'policies' },
  jsonData: {},
  ...overrides,
});

describe('makeSearchFilter', () => {
  it('returns true when there is no search term', () => {
    const filter = makeSearchFilter();
    expect(filter(item())).toBe(true);
    expect(filter(item(), '')).toBe(true);
  });

  it('matches the resource name case-insensitively', () => {
    const filter = makeSearchFilter();
    expect(filter(item(), 'MY-CLUSTER')).toBe(true);
    expect(filter(item(), 'cluster')).toBe(true);
    expect(filter(item(), 'nope')).toBe(false);
  });

  it('matches the namespace', () => {
    const filter = makeSearchFilter();
    expect(filter(item(), 'POLICIES')).toBe(true);
    expect(filter(item(), 'other-ns')).toBe(false);
  });

  it('matches extra paths inside the raw payload', () => {
    const filter = makeSearchFilter(['status.compliant']);
    const policy = item({ jsonData: { status: { compliant: 'NonCompliant' } } });
    expect(filter(policy, 'noncompliant')).toBe(true);
    expect(filter(policy, 'compliant')).toBe(true);
    expect(filter(policy, 'nomatch')).toBe(false);
  });

  it('handles missing jsonData and missing metadata', () => {
    const filter = makeSearchFilter(['status.vendor']);
    expect(filter({} as any, 'anything')).toBe(false);
    expect(filter({ metadata: { name: 'abc' } } as any, 'ab')).toBe(true);
  });

  it('uses the raw item as the base for extra paths when jsonData is missing', () => {
    const filter = makeSearchFilter(['metadata.name']);
    expect(filter({ metadata: { name: 'fallback' } } as any, 'FALLBACK')).toBe(true);
  });
});
