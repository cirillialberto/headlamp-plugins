import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { OCM_GROUP, RouteNames } from '../constants';

const ManagedClusterSetClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [
    { group: OCM_GROUP, version: 'v1beta2' },
    { group: OCM_GROUP, version: 'v1beta1' },
  ],
  isNamespaced: false,
  pluralName: 'managedclustersets',
  singularName: 'managedclusterset',
  kind: 'ManagedClusterSet',
});

class ManagedClusterSet extends ManagedClusterSetClass {
  static get detailsRoute() {
    return RouteNames.managedClusterSetsDetail;
  }
}

export { ManagedClusterSet };
