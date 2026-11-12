import { Loader, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { OcmApiLabels } from '../isOcmInstalled';
import { ManagedCluster } from '../resources/managedCluster';
import { makeSearchFilter } from '../utils/search';

export function ManagedClusterListView() {
  const { isClusterApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title="ManagedClusters">
        <Loader title="Checking Open Cluster Management APIs" />
      </SectionBox>
    );
  }

  if (isClusterApiInstalled === false) {
    return (
      <SectionBox title="ManagedClusters">
        <CrdNotInstalled apiGroup={OcmApiLabels.cluster} resourceLabel="ManagedClusters" />
      </SectionBox>
    );
  }

  return (
    <SectionBox title="ManagedClusters">
      <ResourceListView
        title="Managed Clusters"
        resourceClass={ManagedCluster}
        filterFunction={makeSearchFilter(['status.conditions'])}
        columns={[
          'name',
          {
            id: 'available',
            label: 'Available',
            getValue: (item: any) => {
              const cond = (item?.jsonData?.status?.conditions || []).find((c: any) => c.type === 'ManagedClusterConditionAvailable');
              return cond?.status || '-';
            },
          },
          {
            id: 'vendor',
            label: 'Vendor',
            getValue: (item: any) => item?.jsonData?.status?.vendor || '-',
          },
          {
            id: 'version',
            label: 'K8s Version',
            getValue: (item: any) => item?.jsonData?.status?.version?.kubernetes || '-',
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function ManagedClusterDetailsView() {
  const { name = '' } = useParams<{ name: string }>();
  return <ResourceDefinitionDetails resourceType={ManagedCluster} name={name} title="ManagedCluster Details" />;
}
