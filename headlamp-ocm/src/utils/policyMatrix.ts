import type { ManagedClusterJson, PolicyJson, PolicyStatusEntry, ResourceLike } from '../types/ocm';
import { getPolicyStatusEntries } from './policy';

/**
 * Pure helpers to build the Policy × ManagedCluster compliance matrix
 * rendered by the policy matrix view.
 */

/** Compliance state of a single policy/cluster cell. */
export type MatrixCellState = 'compliant' | 'noncompliant' | 'pending' | 'none';

/** A single matrix cell: the compliance state plus a tooltip reason. */
export interface MatrixCell {
  state: MatrixCellState;
  reason?: string;
}

/** One matrix row: a policy and its cells keyed by cluster name. */
export interface PolicyMatrixRow {
  namespace: string;
  name: string;
  cells: Record<string, MatrixCell>;
}

/** The full matrix: column headers (cluster names) and policy rows. */
export interface PolicyMatrix {
  clusterNames: string[];
  rows: PolicyMatrixRow[];
}

type List<T> = T[] | null | undefined;

/**
 * Normalized compliance state of a per-cluster policy status entry.
 * Non-compliant is checked first because "noncompliant" contains "compliant".
 */
export function policyEntryState(entry?: PolicyStatusEntry | null): MatrixCellState {
  const state = String(entry?.complianceState || entry?.compliant || '').toLowerCase();
  if (state.includes('noncompliant')) return 'noncompliant';
  if (state.includes('compliant')) return 'compliant';
  return 'pending';
}

/**
 * Best-effort human readable reason for a status entry: the first non-empty
 * clause message, then the entry message, then the state itself.
 */
export function policyEntryReason(entry?: PolicyStatusEntry | null): string {
  for (const clause of entry?.clauses || []) {
    const msg = String(clause?.message || clause?.reason || '').trim();
    if (msg) return msg;
  }
  const message = String(entry?.message || '').trim();
  if (message) return message;
  const state = String(entry?.complianceState || entry?.compliant || '').trim();
  return state;
}

/**
 * Builds the compliance matrix: rows are policies, columns are the union of
 * the listed ManagedClusters and every cluster reported in the policies'
 * per-cluster status entries (both sorted alphabetically).
 */
export function buildPolicyMatrix(
  policies: List<ResourceLike<PolicyJson>>,
  clusters: List<ResourceLike<ManagedClusterJson>>
): PolicyMatrix {
  const names = new Set<string>();
  for (const cluster of clusters || []) {
    if (cluster?.metadata?.name) names.add(cluster.metadata.name);
  }
  for (const policy of policies || []) {
    for (const entry of getPolicyStatusEntries(policy)) {
      if (entry?.clusterName) names.add(entry.clusterName);
    }
  }

  const clusterNames = Array.from(names).sort((a, b) => a.localeCompare(b));

  const rows = (policies || [])
    .filter(p => Boolean(p?.metadata?.name))
    .sort(
      (a, b) =>
        `${a?.metadata?.namespace || ''}/${a?.metadata?.name || ''}`.localeCompare(
          `${b?.metadata?.namespace || ''}/${b?.metadata?.name || ''}`
        )
    )
    .map(policy => {
      const entriesByKey = new Map<string, PolicyStatusEntry>();
      for (const entry of getPolicyStatusEntries(policy)) {
        if (entry?.clusterName) entriesByKey.set(entry.clusterName, entry);
      }

      const cells: Record<string, MatrixCell> = {};
      for (const clusterName of clusterNames) {
        const entry = entriesByKey.get(clusterName);
        cells[clusterName] = entry
          ? { state: policyEntryState(entry), reason: policyEntryReason(entry) }
          : { state: 'none' };
      }

      return {
        namespace: policy?.metadata?.namespace || '',
        name: policy?.metadata?.name || '',
        cells,
      };
    });

  return { clusterNames, rows };
}
