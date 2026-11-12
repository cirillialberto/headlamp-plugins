import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { POLICY_GROUP, RouteNames } from '../constants';

const PlacementBindingClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: POLICY_GROUP, version: 'v1' }],
  isNamespaced: true,
  pluralName: 'placementbindings',
  singularName: 'placementbinding',
  kind: 'PlacementBinding',
});

class PlacementBinding extends PlacementBindingClass {
  static get detailsRoute() {
    return RouteNames.placementBindingsDetail;
  }
}

export { PlacementBinding };
