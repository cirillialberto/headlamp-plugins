import { ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { ManagedCluster } from '../resources/managedCluster';
import { makeSearchFilter } from '../utils/search';

export function ManagedClusterListView() {
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
