import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { POLICY_GROUP, RouteNames } from '../constants';

const PolicySetClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: POLICY_GROUP, version: 'v1beta1' }],
  isNamespaced: true,
  pluralName: 'policysets',
  singularName: 'policyset',
  kind: 'PolicySet',
});

class PolicySet extends PolicySetClass {
  static get detailsRoute() {
    return RouteNames.policySetsDetail;
  }
}

export { PolicySet };
