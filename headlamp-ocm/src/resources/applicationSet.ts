import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { ARGO_GROUP, RouteNames } from '../constants';

const ApplicationSetClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: ARGO_GROUP, version: 'v1alpha1' }],
  isNamespaced: true,
  pluralName: 'applicationsets',
  singularName: 'applicationset',
  kind: 'ApplicationSet',
});

class ApplicationSet extends ApplicationSetClass {
  static get detailsRoute() {
    return RouteNames.applicationSetsDetail;
  }
}

export { ApplicationSet };
