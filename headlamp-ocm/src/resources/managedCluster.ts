import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { OCM_GROUP, RouteNames } from '../constants';

const ManagedClusterClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: OCM_GROUP, version: 'v1' }],
  isNamespaced: false,
  pluralName: 'managedclusters',
  singularName: 'managedcluster',
  kind: 'ManagedCluster',
});

class ManagedCluster extends ManagedClusterClass {
  static get detailsRoute() {
    return RouteNames.managedClustersDetail;
  }
}

export { ManagedCluster };
