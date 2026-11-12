import { Loader, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { OcmApiLabels } from '../isOcmInstalled';
import { Placement } from '../resources/placement';
import { makeSearchFilter } from '../utils/search';

export function PlacementListView() {
  const { isClusterApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title="Placements">
        <Loader title="Checking Open Cluster Management APIs" />
      </SectionBox>
    );
  }

  if (isClusterApiInstalled === false) {
    return (
      <SectionBox title="Placements">
        <CrdNotInstalled apiGroup={OcmApiLabels.cluster} resourceLabel="Placements" />
      </SectionBox>
    );
  }

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
