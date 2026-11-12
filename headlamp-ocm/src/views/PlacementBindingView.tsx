import { ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { PlacementBinding } from '../resources/placementBinding';
import { makeSearchFilter } from '../utils/search';

export function PlacementBindingListView() {
  return (
    <SectionBox title="PlacementBindings">
      <ResourceListView
        title="Policy Placement Bindings"
        resourceClass={PlacementBinding}
        filterFunction={makeSearchFilter(['placementRef.name', 'subjects'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'placementRef',
            label: 'Placement',
            getValue: (item: any) => item?.jsonData?.placementRef?.name || '-',
          },
          {
            id: 'subjects',
            label: 'Subjects',
            getValue: (item: any) => String((item?.jsonData?.subjects || []).length),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function PlacementBindingDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={PlacementBinding} namespace={namespace} name={name} title="PlacementBinding Details" />;
}
