import { Icon } from '@iconify/react';
import React, { useMemo } from 'react';
import { ResourceDefinitionDetails } from './components/ResourceDefinitionDetails';
import { ManagedCluster } from './resources/managedCluster';
import { Placement } from './resources/placement';
import { PlacementBinding } from './resources/placementBinding';
import { Policy } from './resources/policy';
import { PolicySet } from './resources/policySet';
import {
  buildPlacementBindingEdges,
  buildPlacementEdges,
  buildPolicySetEdges,
  GraphKubeObject,
  managedClusterNodeStatus,
  placementNodeStatus,
  policyNodeStatus,
} from './utils/ocmGraph';

const MAP_COLOR = 'rgb(225, 50, 62)';

function makeDetailsComponent(resourceType: any, title: string, clusterScoped: boolean) {
  return ({ node }: any) => {
    const metadata = node?.kubeObject?.jsonData?.metadata || node?.kubeObject?.metadata || {};
    return (
      <ResourceDefinitionDetails
        resourceType={resourceType}
        name={metadata.name}
        namespace={clusterScoped ? undefined : metadata.namespace}
        title={title}
      />
    );
  };
}

const managedClustersSource = {
  id: 'ocm-managedclusters',
  label: 'ManagedClusters',
  icon: <Icon icon="mdi:cloud-outline" width="100%" height="100%" color={MAP_COLOR} />,
  useData() {
    const [clusters] = ManagedCluster.useList();

    return useMemo(() => {
      if (!clusters) return null;

      const nodes = clusters.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 1000,
        status: managedClusterNodeStatus(it?.jsonData?.status?.conditions),
        detailsComponent: makeDetailsComponent(ManagedCluster, 'ManagedCluster Details', true),
      }));

      return { nodes };
    }, [clusters]);
  },
};

const placementsSource = {
  id: 'ocm-placements',
  label: 'Placements',
  icon: <Icon icon="mdi:map-marker-radius-outline" width="100%" height="100%" color={MAP_COLOR} />,
  useData() {
    const [placements] = Placement.useList();
    const [clusters] = ManagedCluster.useList();

    return useMemo(() => {
      if (!placements) return null;

      const nodes = placements.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 2000,
        status: placementNodeStatus(it as unknown as GraphKubeObject<any>),
        detailsComponent: makeDetailsComponent(Placement, 'Placement Details', false),
      }));

      return {
        nodes,
        edges: buildPlacementEdges(placements as any, clusters as any),
      };
    }, [placements, clusters]);
  },
};

const placementBindingsSource = {
  id: 'ocm-placementbindings',
  label: 'PlacementBindings',
  icon: <Icon icon="mdi:link-variant" width="100%" height="100%" color={MAP_COLOR} />,
  useData() {
    const [bindings] = PlacementBinding.useList();
    const [placements] = Placement.useList();
    const [policies] = Policy.useList();

    return useMemo(() => {
      if (!bindings) return null;

      const nodes = bindings.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 1500,
        detailsComponent: makeDetailsComponent(PlacementBinding, 'PlacementBinding Details', false),
      }));

      return {
        nodes,
        edges: buildPlacementBindingEdges(bindings as any, placements as any, policies as any),
      };
    }, [bindings, placements, policies]);
  },
};

const policySetsSource = {
  id: 'ocm-policysets',
  label: 'PolicySets',
  icon: <Icon icon="mdi:shield-outline" width="100%" height="100%" color={MAP_COLOR} />,
  useData() {
    const [policySets] = PolicySet.useList();
    const [policies] = Policy.useList();

    return useMemo(() => {
      if (!policySets) return null;

      const nodes = policySets.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 1500,
        detailsComponent: makeDetailsComponent(PolicySet, 'PolicySet Details', false),
      }));

      return {
        nodes,
        edges: buildPolicySetEdges(policySets as any, policies as any),
      };
    }, [policySets, policies]);
  },
};

const policiesSource = {
  id: 'ocm-policies',
  label: 'Policies',
  icon: <Icon icon="mdi:shield-check-outline" width="100%" height="100%" color={MAP_COLOR} />,
  useData() {
    const [policies] = Policy.useList();

    return useMemo(() => {
      if (!policies) return null;

      const nodes = policies.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 2000,
        status: policyNodeStatus(it as unknown as GraphKubeObject<any>),
        detailsComponent: makeDetailsComponent(Policy, 'Policy Details', false),
      }));

      return { nodes };
    }, [policies]);
  },
};

export const ocmSource = {
  id: 'ocm',
  label: 'Open Cluster Management',
  icon: <Icon icon="mdi:hub-outline" width="100%" height="100%" color={MAP_COLOR} />,
  sources: [
    managedClustersSource,
    placementsSource,
    placementBindingsSource,
    policySetsSource,
    policiesSource,
  ],
};
