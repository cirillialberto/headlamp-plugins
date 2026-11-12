import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { POLICY_GROUP, RouteNames } from '../constants';

const PolicyClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: POLICY_GROUP, version: 'v1' }],
  isNamespaced: true,
  pluralName: 'policies',
  singularName: 'policy',
  kind: 'Policy',
});

class Policy extends PolicyClass {
  static get detailsRoute() {
    return RouteNames.policiesDetail;
  }
}

export { Policy };
