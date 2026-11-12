import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

/**
 * API group/version paths probed to detect which of the plugin's CRDs
 * are installed on the current cluster.
 *
 * A `GET /apis/<group>/<version>` request succeeds when the group is
 * served by the API server (i.e. the CRDs exist) and fails (404) when it
 * is not installed.
 */
export const OcmApiPaths = {
  /** Core cluster management: ManagedCluster, ManagedClusterSet, Placement, PlacementBinding. */
  cluster: '/apis/cluster.open-cluster-management.io/v1',
  /** Policy framework: Policy, PolicySet. */
  policy: '/apis/policy.open-cluster-management.io/v1',
  /** Argo CD ApplicationSet. */
  argo: '/apis/argoproj.io/v1alpha1',
} as const;

export type OcmApiKind = keyof typeof OcmApiPaths;

/** Human-readable group/version labels (used in messages). */
export const OcmApiLabels: Record<OcmApiKind, string> = {
  cluster: 'cluster.open-cluster-management.io/v1',
  policy: 'policy.open-cluster-management.io/v1',
  argo: 'argoproj.io/v1alpha1',
};

/**
 * Checks whether a single API group/version exists on the cluster.
 * Any error (404, forbidden, network failure) is reported as `false`.
 */
export async function isApiInstalled(apiPath: string): Promise<boolean> {
  try {
    const response = await ApiProxy.request(apiPath, {
      method: 'GET',
    });
    return !!response;
  } catch {
    return false;
  }
}

/** Whether the cluster management CRDs (ManagedCluster & co.) are installed. */
export function isClusterApiInstalled(): Promise<boolean> {
  return isApiInstalled(OcmApiPaths.cluster);
}

/** Whether the policy framework CRDs (Policy, PolicySet) are installed. */
export function isPolicyApiInstalled(): Promise<boolean> {
  return isApiInstalled(OcmApiPaths.policy);
}

/** Whether the Argo CD ApplicationSet CRD is installed. */
export function isArgoApiInstalled(): Promise<boolean> {
  return isApiInstalled(OcmApiPaths.argo);
}

/** `true` when at least one of the OCM-related APIs is available. */
export async function isOcmInstalled(): Promise<boolean> {
  const results = await Promise.all([
    isClusterApiInstalled(),
    isPolicyApiInstalled(),
    isArgoApiInstalled(),
  ]);
  return results.some(Boolean);
}
