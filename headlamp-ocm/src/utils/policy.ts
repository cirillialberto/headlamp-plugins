import type { PolicyJson, PolicyStatusEntry, ResourceLike } from '../types/ocm';

export interface PolicyNamespaceSummary {
  namespace: string;
  compliant: number;
  nonCompliant: number;
  unknown: number;
}

export interface NonCompliantPolicySummary {
  namespace: string;
  name: string;
  clusters: number;
  reason: string;
}

/**
 * Returns the normalized (lowercased) compliance state of a Policy,
 * or an empty string when the status is not available yet.
 */
export function getPolicyCompliance(policy: ResourceLike<PolicyJson>): string {
  return String(policy?.jsonData?.status?.compliant || '').toLowerCase();
}

export function isPolicyCompliant(policy: ResourceLike<PolicyJson>): boolean {
  return getPolicyCompliance(policy) === 'compliant';
}

export function isPolicyNonCompliant(policy: ResourceLike<PolicyJson>): boolean {
  return getPolicyCompliance(policy) === 'noncompliant';
}

/**
 * Per-cluster compliance entries reported by the policy agent.
 */
export function getPolicyStatusEntries(policy: ResourceLike<PolicyJson>): PolicyStatusEntry[] {
  return policy?.jsonData?.status?.status || [];
}

/**
 * Number of clusters reporting a non-compliant state for the policy.
 */
export function getNonCompliantClusterCount(policy: ResourceLike<PolicyJson>): number {
  return getPolicyStatusEntries(policy).filter(entry => {
    const state = String(entry?.complianceState || entry?.compliant || '').toLowerCase();
    return state.includes('noncompliant');
  }).length;
}

/**
 * Collects the distinct reasons why a policy is non-compliant
 * (clause messages, per-cluster messages and status history).
 */
export function getPolicyWhyNonCompliant(policy: ResourceLike<PolicyJson>): string {
  const reasons = new Set<string>();
  const statusEntries = getPolicyStatusEntries(policy);

  for (const entry of statusEntries) {
    const state = String(entry?.complianceState || entry?.compliant || '').toLowerCase();
    if (!state.includes('noncompliant')) continue;

    for (const clause of entry?.clauses || []) {
      const msg = String(clause?.message || clause?.reason || '').trim();
      if (msg) reasons.add(msg);
    }

    const topMsg = String(entry?.message || '').trim();
    if (topMsg) reasons.add(topMsg);
  }

  for (const detail of policy?.jsonData?.status?.details || []) {
    for (const h of detail?.history || []) {
      const msg = String(h?.message || '').trim();
      if (msg) reasons.add(msg);
    }
  }

  const list = Array.from(reasons).filter(Boolean);
  if (list.length === 0) return '-';
  return list.slice(0, 2).join(' | ');
}

/**
 * One-line summary of what a Policy does, based on its templates
 * and remediation action.
 */
export function getPolicyIntent(policy: ResourceLike<PolicyJson>): string {
  const remediation = String(policy?.jsonData?.spec?.remediationAction || 'inform');
  const templates = policy?.jsonData?.spec?.['policy-templates'] || [];
  if (!Array.isArray(templates) || templates.length === 0) {
    return `No templates (remediation: ${remediation})`;
  }

  const first = templates[0]?.objectDefinition || templates[0]?.objectdefinition || {};
  const kind = first?.kind || 'Resource';
  const name = first?.metadata?.name || first?.metadata?.generateName || 'unnamed';
  const namespace = first?.metadata?.namespace;
  const scope = namespace ? `${namespace}/${name}` : name;
  const count = templates.length;
  return `${kind} ${scope} (${count} template${count > 1 ? 's' : ''}, remediation: ${remediation})`;
}

/**
 * Groups policies by namespace with compliant/non-compliant/unknown counts,
 * most problematic namespaces first.
 */
export function summarizePoliciesByNamespace(policies: ResourceLike<PolicyJson>[]): PolicyNamespaceSummary[] {
  const buckets: Record<string, { compliant: number; nonCompliant: number; unknown: number }> = {};
  for (const p of policies || []) {
    const namespace = p?.metadata?.namespace || 'cluster-scoped';
    if (!buckets[namespace]) {
      buckets[namespace] = { compliant: 0, nonCompliant: 0, unknown: 0 };
    }

    const compliance = getPolicyCompliance(p);
    if (compliance === 'compliant') buckets[namespace].compliant += 1;
    else if (compliance === 'noncompliant') buckets[namespace].nonCompliant += 1;
    else buckets[namespace].unknown += 1;
  }

  return Object.entries(buckets)
    .map(([namespace, values]) => ({ namespace, ...values }))
    .sort(
      (a, b) =>
        b.nonCompliant - a.nonCompliant || b.unknown - a.unknown || a.namespace.localeCompare(b.namespace)
    );
}

/**
 * Summarizes the non-compliant policies: affected cluster count and reasons,
 * most impacting policies first.
 */
export function summarizeNonCompliantPolicies(policies: ResourceLike<PolicyJson>[]): NonCompliantPolicySummary[] {
  return (policies || [])
    .filter(p => isPolicyNonCompliant(p))
    .map(p => ({
      namespace: p?.metadata?.namespace || '-',
      name: p?.metadata?.name || '-',
      clusters: getNonCompliantClusterCount(p),
      reason: getPolicyWhyNonCompliant(p),
    }))
    .sort(
      (a, b) =>
        b.clusters - a.clusters || a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name)
    );
}
