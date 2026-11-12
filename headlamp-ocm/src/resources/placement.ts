import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { OCM_GROUP, RouteNames } from '../constants';

const PlacementClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: OCM_GROUP, version: 'v1beta1' }],
  isNamespaced: true,
  pluralName: 'placements',
  singularName: 'placement',
  kind: 'Placement',
});

class Placement extends PlacementClass {
  static get detailsRoute() {
    return RouteNames.placementsDetail;
  }
}

export { Placement };
