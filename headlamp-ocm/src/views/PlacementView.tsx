import { ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { Placement } from '../resources/placement';
import { makeSearchFilter } from '../utils/search';

export function PlacementListView() {
  return (
    <SectionBox title="Placements">
      <ResourceListView
        title="Cluster Placements"
        resourceClass={Placement}
        filterFunction={makeSearchFilter(['spec.numberOfClusters', 'status.numberOfSelectedClusters'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'desired',
            label: 'Desired',
            getValue: (item: any) => item?.jsonData?.spec?.numberOfClusters ?? '-',
          },
          {
            id: 'selected',
            label: 'Selected',
            getValue: (item: any) => item?.jsonData?.status?.numberOfSelectedClusters ?? '-',
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function PlacementDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={Placement} namespace={namespace} name={name} title="Placement Details" />;
}
