import type {
  ManagedClusterJson,
  OcmCondition,
  PlacementBindingJson,
  PlacementJson,
  PolicyJson,
  PolicySetJson,
  ResourceLike,
} from '../types/ocm';

/**
 * Pure helpers to build the resource-map graph for the plugin.
 *
 * Everything here works on plain `ResourceLike` payloads so it can be unit
 * tested without touching the Kubernetes client.
 */

/**
 * Structural type of the subset of a KubeObject instance the graph builder
 * needs: identity in `metadata` and the raw API payload in `jsonData`.
 */
export type GraphKubeObject<T = Record<string, any>> = ResourceLike<T>;

/**
 * Health status for graph nodes. Structurally identical to the SDK
 * `GraphNode.status` type, declared locally to avoid deep SDK type imports.
 */
export type OcmNodeStatus = 'error' | 'success' | 'warning';

/** A single edge of the resource map graph. */
export interface KubeGraphEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Node identity: the object uid when present, otherwise a
 * `namespace/name` (or just `name`) fallback so distinct objects
 * always produce distinct node ids.
 */
export function nodeIdentity(object: GraphKubeObject | null | undefined): string {
  const uid = object?.metadata?.uid;
  if (uid) return String(uid);
  const name = object?.metadata?.name;
  if (!name) return 'unknown';
  const namespace = object?.metadata?.namespace;
  return namespace ? `${namespace}/${name}` : String(name);
}

/**
 * Creates an edge between two Kubernetes objects, identified by their
 * uids (or name fallbacks).
 */
export function makeKubeToKubeEdge(from: GraphKubeObject, to: GraphKubeObject): KubeGraphEdge {
  const source = nodeIdentity(from);
  const target = nodeIdentity(to);
  return { id: `${source}-${target}`, source, target };
}

type List<T> = T[] | null | undefined;

/**
 * Edges from Placements to the ManagedClusters they selected,
 * resolved through `status.decisions[].clusterName`.
 * ManagedClusters are cluster-scoped, so only the name is matched.
 */
export function buildPlacementEdges(
  placements: List<GraphKubeObject<PlacementJson>>,
  clusters: List<GraphKubeObject<ManagedClusterJson>>
): KubeGraphEdge[] {
  const edges: KubeGraphEdge[] = [];
  for (const placement of placements || []) {
    const decisions = placement?.jsonData?.status?.decisions;
    for (const decision of decisions || []) {
      const clusterName = decision?.clusterName;
      if (!clusterName) continue;
      const cluster = (clusters || []).find(c => c?.metadata?.name === clusterName);
      if (cluster) edges.push(makeKubeToKubeEdge(placement, cluster));
    }
  }
  return edges;
}

/**
 * Edges from PlacementBindings to the Placement they reference
 * (`placementRef.name`, defaulting to the binding's namespace) and to the
 * Policies attached as `subjects` with kind `Policy`.
 */
export function buildPlacementBindingEdges(
  bindings: List<GraphKubeObject<PlacementBindingJson>>,
  placements: List<GraphKubeObject<PlacementJson>>,
  policies: List<GraphKubeObject<PolicyJson>>
): KubeGraphEdge[] {
  const edges: KubeGraphEdge[] = [];
  for (const binding of bindings || []) {
    const bindingNamespace = binding?.metadata?.namespace;

    const placementName = binding?.jsonData?.placementRef?.name;
    if (placementName) {
      const placementNamespace = binding?.jsonData?.placementRef?.namespace || bindingNamespace;
      const placement = (placements || []).find(p => {
        const ns = p?.metadata?.namespace;
        return p?.metadata?.name === placementName && (!placementNamespace || ns === placementNamespace);
      });
      if (placement) edges.push(makeKubeToKubeEdge(binding, placement));
    }

    for (const subject of binding?.jsonData?.subjects || []) {
      if (subject?.kind !== 'Policy') continue;
      const policyName = subject?.name;
      if (!policyName) continue;
      const policyNamespace = subject?.namespace || bindingNamespace;
      const policy = (policies || []).find(p => {
        const ns = p?.metadata?.namespace;
        return p?.metadata?.name === policyName && (!policyNamespace || ns === policyNamespace);
      });
      if (policy) edges.push(makeKubeToKubeEdge(binding, policy));
    }
  }
  return edges;
}

/**
 * Edges from PolicySets to the Policies they bundle
 * (`spec.policies[].name`, defaulting to the PolicySet's namespace).
 */
export function buildPolicySetEdges(
  policySets: List<GraphKubeObject<PolicySetJson>>,
  policies: List<GraphKubeObject<PolicyJson>>
): KubeGraphEdge[] {
  const edges: KubeGraphEdge[] = [];
  for (const policySet of policySets || []) {
    const policySetNamespace = policySet?.metadata?.namespace;
    for (const entry of policySet?.jsonData?.spec?.policies || []) {
      const policyName = entry?.name;
      if (!policyName) continue;
      const policyNamespace = entry?.namespace || policySetNamespace;
      const policy = (policies || []).find(p => {
        const ns = p?.metadata?.namespace;
        return p?.metadata?.name === policyName && (!policyNamespace || ns === policyNamespace);
      });
      if (policy) edges.push(makeKubeToKubeEdge(policySet, policy));
    }
  }
  return edges;
}

/**
 * Node status for a ManagedCluster based on its `Available` condition:
 * available → success, unavailable → warning, unknown → no badge.
 */
export function managedClusterNodeStatus(conditions?: OcmCondition[] | null): OcmNodeStatus | undefined {
  const available = (conditions || []).find(c => c?.type === 'Available');
  if (!available) return undefined;
  return available.status === 'True' ? 'success' : 'warning';
}

/**
 * Node status for a Placement: selected clusters → success,
 * desired but none selected → warning, otherwise no badge.
 */
export function placementNodeStatus(placement?: GraphKubeObject<PlacementJson> | null): OcmNodeStatus | undefined {
  const desired = placement?.jsonData?.spec?.numberOfClusters ?? 0;
  const selected = placement?.jsonData?.status?.numberOfSelectedClusters ?? 0;
  if (selected > 0) return 'success';
  if (desired > 0) return 'warning';
  return undefined;
}

/**
 * Node status for a Policy from its overall compliance state:
 * compliant → success, non-compliant → error, otherwise no badge.
 */
export function policyNodeStatus(policy?: GraphKubeObject<PolicyJson> | null): OcmNodeStatus | undefined {
  const compliance = String(policy?.jsonData?.status?.compliant || '').toLowerCase();
  if (compliance === 'compliant') return 'success';
  if (compliance === 'noncompliant') return 'error';
  return undefined;
}
