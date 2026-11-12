import { ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { PolicySet } from '../resources/policySet';
import { makeSearchFilter } from '../utils/search';

export function PolicySetListView() {
  return (
    <SectionBox title="PolicySets">
      <ResourceListView
        title="Policy Sets"
        resourceClass={PolicySet}
        filterFunction={makeSearchFilter(['spec.policies'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'policiesCount',
            label: 'Policies',
            getValue: (item: any) => String((item?.jsonData?.spec?.policies || []).length),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function PolicySetDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={PolicySet} namespace={namespace} name={name} title="PolicySet Details" />;
}
