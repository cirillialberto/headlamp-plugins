import { ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { ManagedClusterSet } from '../resources/managedClusterSet';
import { makeSearchFilter } from '../utils/search';

export function ManagedClusterSetListView() {
  return (
    <SectionBox title="ManagedClusterSets">
      <ResourceListView
        title="Managed Cluster Sets"
        resourceClass={ManagedClusterSet}
        filterFunction={makeSearchFilter(['status.conditions'])}
        columns={[
          'name',
          {
            id: 'clusters',
            label: 'Clusters',
            getValue: (item: any) => String(item?.jsonData?.status?.clusterCount ?? item?.jsonData?.status?.clusters ?? '-'),
          },
          {
            id: 'conditions',
            label: 'Conditions',
            getValue: (item: any) => String((item?.jsonData?.status?.conditions || []).length),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function ManagedClusterSetDetailsView() {
  const { name = '' } = useParams<{ name: string }>();
  return <ResourceDefinitionDetails resourceType={ManagedClusterSet} name={name} title="ManagedClusterSet Details" />;
}
