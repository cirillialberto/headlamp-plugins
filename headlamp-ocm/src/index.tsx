import { Notification, registerAppBarAction, registerMapSource, registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import type { Notification as NotificationClass } from '@kinvolk/headlamp-plugin/lib/components/App/Notifications/notificationsSlice';
import React from 'react';
import { OcMDashboard } from './components/OcMDashboard';
import { RouteNames } from './constants';
import { ocmSource } from './mapView';
import { ApplicationSetDetailsView, ApplicationSetListView } from './views/ApplicationSetView';
import { ManagedClusterSetDetailsView, ManagedClusterSetListView } from './views/ManagedClusterSetView';
import { ManagedClusterDetailsView, ManagedClusterListView } from './views/ManagedClusterView';
import { PlacementBindingDetailsView, PlacementBindingListView } from './views/PlacementBindingView';
import { PlacementDetailsView, PlacementListView } from './views/PlacementView';
import { PolicyClusterMatrixView } from './views/PolicyClusterMatrixView';
import { PolicySetDetailsView, PolicySetListView } from './views/PolicySetView';
import { PolicyDetailsView, PolicyListView } from './views/PolicyView';

registerAppBarAction(() => <span style={{ fontWeight: 700 }}>OCM</span>);
registerSidebarEntry({ parent: null, name: 'ocm', label: 'Open Cluster Mgmt', url: '/ocm', icon: 'mdi:hub-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-managedclusters', label: 'ManagedClusters', url: '/ocm/managedclusters', icon: 'mdi:cloud-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-managedclustersets', label: 'ManagedClusterSets', url: '/ocm/managedclustersets', icon: 'mdi:set-center-right' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-policies', label: 'Policies', url: '/ocm/policies', icon: 'mdi:shield-check-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-policymatrix', label: 'Policy Matrix', url: '/ocm/policymatrix', icon: 'mdi:table' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-policysets', label: 'PolicySets', url: '/ocm/policysets', icon: 'mdi:shield-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-placements', label: 'Placements', url: '/ocm/placements', icon: 'mdi:map-marker-radius-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-placementbindings', label: 'PlacementBindings', url: '/ocm/placementbindings', icon: 'mdi:link-variant' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-applicationsets', label: 'ApplicationSets', url: '/ocm/applicationsets', icon: 'mdi:source-branch' });

try {
  registerRoute({ path: '/ocm', sidebar: 'ocm', name: RouteNames.ocm, exact: true, component: () => <OcMDashboard /> });
  registerRoute({ path: '/ocm/managedclusters', sidebar: 'ocm-managedclusters', name: RouteNames.managedClusters, exact: true, component: () => <ManagedClusterListView /> });
  registerRoute({ path: '/ocm/managedclustersets', sidebar: 'ocm-managedclustersets', name: RouteNames.managedClusterSets, exact: true, component: () => <ManagedClusterSetListView /> });
  registerRoute({ path: '/ocm/policies', sidebar: 'ocm-policies', name: RouteNames.policies, exact: true, component: () => <PolicyListView /> });
  registerRoute({ path: '/ocm/policymatrix', sidebar: 'ocm-policymatrix', name: RouteNames.policyMatrix, exact: true, component: () => <PolicyClusterMatrixView /> });
  registerRoute({ path: '/ocm/policysets', sidebar: 'ocm-policysets', name: RouteNames.policySets, exact: true, component: () => <PolicySetListView /> });
  registerRoute({ path: '/ocm/placements', sidebar: 'ocm-placements', name: RouteNames.placements, exact: true, component: () => <PlacementListView /> });
  registerRoute({ path: '/ocm/placementbindings', sidebar: 'ocm-placementbindings', name: RouteNames.placementBindings, exact: true, component: () => <PlacementBindingListView /> });
  registerRoute({ path: '/ocm/applicationsets', sidebar: 'ocm-applicationsets', name: RouteNames.applicationSets, exact: true, component: () => <ApplicationSetListView /> });

  registerRoute({ path: '/ocm/managedclusters/:name', sidebar: 'ocm-managedclusters', name: RouteNames.managedClustersDetail, exact: true, component: () => <ManagedClusterDetailsView /> });
  registerRoute({ path: '/ocm/managedclustersets/:name', sidebar: 'ocm-managedclustersets', name: RouteNames.managedClusterSetsDetail, exact: true, component: () => <ManagedClusterSetDetailsView /> });
  registerRoute({ path: '/ocm/policies/:namespace/:name', sidebar: 'ocm-policies', name: RouteNames.policiesDetail, exact: true, component: () => <PolicyDetailsView /> });
  registerRoute({ path: '/ocm/policysets/:namespace/:name', sidebar: 'ocm-policysets', name: RouteNames.policySetsDetail, exact: true, component: () => <PolicySetDetailsView /> });
  registerRoute({ path: '/ocm/placements/:namespace/:name', sidebar: 'ocm-placements', name: RouteNames.placementsDetail, exact: true, component: () => <PlacementDetailsView /> });
  registerRoute({ path: '/ocm/placementbindings/:namespace/:name', sidebar: 'ocm-placementbindings', name: RouteNames.placementBindingsDetail, exact: true, component: () => <PlacementBindingDetailsView /> });
  registerRoute({ path: '/ocm/applicationsets/:namespace/:name', sidebar: 'ocm-applicationsets', name: RouteNames.applicationSetsDetail, exact: true, component: () => <ApplicationSetDetailsView /> });
} catch (err) {
  console.error('[OCM Plugin] Failed to register routes:', err);
  try {
    // The SDK does not export the Notification class as a value, so build a plain object
    // that satisfies the NotificationIface shape. Persisting to localStorage is best effort:
    // it is visible in the Host notification list after a reload. The console error above
    // is the source of truth.
    const date = new Date().getTime();
    const notification = {
      cluster: null,
      date,
      deleted: false,
      id: btoa(`ocm-route-registration-failed-${date}`),
      message: 'Failed to register OCM routes (see console for details)',
      seen: false,
    } as NotificationClass;
    Notification.setNotificationsInStore(notification);
  } catch {
    // best effort, the console error above is the source of truth
  }
}

registerMapSource(ocmSource);
