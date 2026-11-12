import { describe, expect, it } from 'vitest';
import {
  getNonCompliantClusterCount,
  getPolicyCompliance,
  getPolicyIntent,
  getPolicyStatusEntries,
  getPolicyWhyNonCompliant,
  isPolicyCompliant,
  isPolicyNonCompliant,
  summarizeNonCompliantPolicies,
  summarizePoliciesByNamespace,
} from './policy';

const policy = (namespace: string, name: string, status: any = {}) => ({
  metadata: { namespace, name },
  jsonData: { status },
});

describe('policy compliance helpers', () => {
  it('normalizes the compliant state (lowercase)', () => {
    expect(getPolicyCompliance(policy('ns', 'p', { compliant: 'Compliant' } as any))).toBe('compliant');
    expect(getPolicyCompliance(policy('ns', 'p', { compliant: 'NonCompliant' } as any))).toBe('noncompliant');
    expect(getPolicyCompliance(policy('ns', 'p', {}))).toBe('');
    expect(getPolicyCompliance(policy('ns', 'p', undefined as any))).toBe('');
  });

  it('classifies compliant / non-compliant / unknown', () => {
    const compliant = policy('ns', 'ok', { compliant: 'Compliant' } as any);
    const nonCompliant = policy('ns', 'bad', { compliant: 'NonCompliant' } as any);
    const unknown = policy('ns', 'wip', {});

    expect(isPolicyCompliant(compliant)).toBe(true);
    expect(isPolicyNonCompliant(compliant)).toBe(false);
    expect(isPolicyCompliant(nonCompliant)).toBe(false);
    expect(isPolicyNonCompliant(nonCompliant)).toBe(true);
    expect(isPolicyCompliant(unknown)).toBe(false);
    expect(isPolicyNonCompliant(unknown)).toBe(false);
  });
});

describe('getPolicyStatusEntries', () => {
  it('returns the per-cluster entries or an empty array', () => {
    const entries = [{ clusterName: 'a' }, { clusterName: 'b' }];
    expect(getPolicyStatusEntries(policy('ns', 'p', { status: entries } as any))).toEqual(entries);
    expect(getPolicyStatusEntries(policy('ns', 'p', {}))).toEqual([]);
  });
});

describe('getNonCompliantClusterCount', () => {
  it('counts entries reporting a non-compliant state', () => {
    const p = policy('ns', 'p', {
      status: [
        { complianceState: 'Compliant' },
        { complianceState: 'NonCompliant' },
        { compliant: 'noncompliant' },
        { compliant: 'compliant' },
        {},
      ] as any,
    });
    expect(getNonCompliantClusterCount(p)).toBe(2);
  });

  it('returns 0 when there are no entries', () => {
    expect(getNonCompliantClusterCount(policy('ns', 'p', {}))).toBe(0);
  });
});

describe('getPolicyWhyNonCompliant', () => {
  it("returns '-' when there are no reasons", () => {
    expect(getPolicyWhyNonCompliant(policy('ns', 'p', { status: [] } as any))).toBe('-');
    expect(getPolicyWhyNonCompliant(policy('ns', 'p', {}))).toBe('-');
  });

  it('aggregates clause and entry messages, deduplicating them', () => {
    const p = policy('ns', 'p', {
      status: [
        {
          complianceState: 'NonCompliant',
          message: 'top-level reason',
          clauses: [
            { message: 'clause reason' },
            { reason: 'clause reason' },
            { message: '  ' },
          ],
        },
      ] as any,
    });
    expect(getPolicyWhyNonCompliant(p)).toBe('clause reason | top-level reason');
  });

  it('includes status history messages', () => {
    const p = policy('ns', 'p', {
      status: [],
      details: [{ history: [{ message: 'history reason' }, { message: '' }] }],
    } as any);
    expect(getPolicyWhyNonCompliant(p)).toBe('history reason');
  });

  it('truncates the list to the first two reasons', () => {
    const p = policy('ns', 'p', {
      status: [
        { complianceState: 'NonCompliant', clauses: [{ message: 'one' }, { message: 'two' }, { message: 'three' }] },
      ] as any,
    });
    expect(getPolicyWhyNonCompliant(p)).toBe('one | two');
  });

  it('ignores entries that are not non-compliant', () => {
    const p = policy('ns', 'p', {
      status: [{ complianceState: 'Compliant', message: 'should be ignored' }] as any,
    });
    expect(getPolicyWhyNonCompliant(p)).toBe('-');
  });
});

describe('getPolicyIntent', () => {
  it('reports the remediation action when there are no templates', () => {
    const p = {
      metadata: { name: 'p', namespace: 'ns' },
      jsonData: { spec: { remediationAction: 'enforce' } },
    };
    expect(getPolicyIntent(p)).toBe('No templates (remediation: enforce)');
  });

  it('defaults the remediation action to inform', () => {
    const p = {
      metadata: { name: 'p', namespace: 'ns' },
      jsonData: { spec: {} },
    };
    expect(getPolicyIntent(p)).toBe('No templates (remediation: inform)');
  });

  it('summarizes the first template', () => {
    const p = {
      metadata: { name: 'p', namespace: 'ns' },
      jsonData: {
        spec: {
          remediationAction: 'inform',
          'policy-templates': [
            { objectDefinition: { kind: 'ConfigMap', metadata: { name: 'cm-1', namespace: 'kube-system' } } },
          ],
        },
      },
    };
    expect(getPolicyIntent(p)).toBe('ConfigMap kube-system/cm-1 (1 template, remediation: inform)');
  });

  it('pluralizes the template count and handles cluster-scoped templates', () => {
    const p = {
      metadata: { name: 'p', namespace: 'ns' },
      jsonData: {
        spec: {
          remediationAction: 'enforce',
          'policy-templates': [
            { objectDefinition: { kind: 'Namespace', metadata: { generateName: 'ns-' } } },
            { objectDefinition: { kind: 'ConfigMap', metadata: { name: 'cm-1' } } },
          ],
        },
      },
    };
    expect(getPolicyIntent(p)).toBe('Namespace ns- (2 templates, remediation: enforce)');
  });

  it('falls back to Resource/unnamed for a template without an objectDefinition', () => {
    const p = {
      metadata: { name: 'p', namespace: 'ns' },
      jsonData: {
        spec: {
          remediationAction: 'inform',
          'policy-templates': [{}],
        },
      },
    };
    expect(getPolicyIntent(p)).toBe('Resource unnamed (1 template, remediation: inform)');
  });
});

describe('summarizePoliciesByNamespace', () => {
  it('buckets policies per namespace with compliance counts', () => {
    const policies = [
      policy('ns-a', 'p1', { compliant: 'Compliant' } as any),
      policy('ns-a', 'p2', { compliant: 'NonCompliant' } as any),
      policy('ns-b', 'p3', {}),
      policy('ns-b', 'p4', {}),
    ];
    const summary = summarizePoliciesByNamespace(policies);
    expect(summary).toHaveLength(2);
    // ns-a has a non-compliant policy, so it sorts first.
    expect(summary[0].namespace).toBe('ns-a');
    expect(summary[0]).toEqual({ namespace: 'ns-a', compliant: 1, nonCompliant: 1, unknown: 0 });
    expect(summary[1]).toEqual({ namespace: 'ns-b', compliant: 0, nonCompliant: 0, unknown: 2 });
  });

  it('groups policies without a namespace under "cluster-scoped"', () => {
    const policies = [
      { metadata: { name: 'p' }, jsonData: { status: { compliant: 'Compliant' } } },
    ];
    expect(summarizePoliciesByNamespace(policies as any)).toEqual([
      { namespace: 'cluster-scoped', compliant: 1, nonCompliant: 0, unknown: 0 },
    ]);
  });

  it('returns an empty list for no policies', () => {
    expect(summarizePoliciesByNamespace([])).toEqual([]);
  });
});

describe('summarizeNonCompliantPolicies', () => {
  it('lists only non-compliant policies, most impacted first', () => {
    const policies = [
      policy('ns-a', 'ok', { compliant: 'Compliant' } as any),
      policy('ns-a', 'bad-one', {
        compliant: 'NonCompliant',
        status: [
          { complianceState: 'NonCompliant', message: 'reason A' },
          { complianceState: 'NonCompliant', message: 'reason A' },
        ],
      } as any),
      policy('ns-b', 'bad-two', {
        compliant: 'NonCompliant',
        status: [{ complianceState: 'NonCompliant' }],
      } as any),
      policy('ns-b', 'unknown-one', {}),
    ];

    const summary = summarizeNonCompliantPolicies(policies);
    expect(summary.map(r => r.name)).toEqual(['bad-one', 'bad-two']);
    expect(summary[0]).toEqual({
      namespace: 'ns-a',
      name: 'bad-one',
      clusters: 2,
      reason: 'reason A',
    });
    expect(summary[1]).toEqual({
      namespace: 'ns-b',
      name: 'bad-two',
      clusters: 1,
      reason: '-',
    });
  });

  it('falls back to "-" for missing metadata fields', () => {
    const policies = [
      { jsonData: { status: { compliant: 'NonCompliant' } } } as any,
    ];
    const summary = summarizeNonCompliantPolicies(policies);
    expect(summary[0].namespace).toBe('-');
    expect(summary[0].name).toBe('-');
  });

  it('returns an empty list when everything is compliant', () => {
    expect(summarizeNonCompliantPolicies([policy('ns', 'ok', { compliant: 'Compliant' } as any)])).toEqual([]);
  });
});
