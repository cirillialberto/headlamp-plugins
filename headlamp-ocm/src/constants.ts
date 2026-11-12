/** API group of the Open Cluster Management core resources. */
export const OCM_GROUP = 'cluster.open-cluster-management.io';

/** API group of the policy-framework governance resources. */
export const POLICY_GROUP = 'policy.open-cluster-management.io';

/** API group of the Argo CD ApplicationSet CRD. */
export const ARGO_GROUP = 'argoproj.io';

/** ManagedCluster condition types surfaced by the plugin. */
export const ManagedClusterConditionAvailable = 'ManagedClusterConditionAvailable';
export const ManagedClusterConditionJoined = 'ManagedClusterConditionJoined';
export const HubAcceptedManagedCluster = 'HubAcceptedManagedCluster';

/**
 * Names of the routes registered by the plugin.
 * Keep the values stable: they are part of the plugin URL surface.
 */
export const RouteNames = {
  ocm: 'ocm-route',
  managedClusters: 'ocm-managedclusters-route',
  managedClustersDetail: 'ocm-managedclusters-detail',
  managedClusterSets: 'ocm-managedclustersets-route',
  managedClusterSetsDetail: 'ocm-managedclustersets-detail',
  placements: 'ocm-placements-route',
  placementsDetail: 'ocm-placements-detail',
  placementBindings: 'ocm-placementbindings-route',
  placementBindingsDetail: 'ocm-placementbindings-detail',
  policies: 'ocm-policies-route',
  policiesDetail: 'ocm-policies-detail',
  policySets: 'ocm-policysets-route',
  policySetsDetail: 'ocm-policysets-detail',
  applicationSets: 'ocm-applicationsets-route',
  applicationSetsDetail: 'ocm-applicationsets-detail',
} as const;
