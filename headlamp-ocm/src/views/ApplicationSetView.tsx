import { ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { ApplicationSet } from '../resources/applicationSet';
import { makeSearchFilter } from '../utils/search';

export function ApplicationSetListView() {
  return (
    <SectionBox title="ApplicationSets">
      <ResourceListView
        title="ArgoCD ApplicationSets"
        resourceClass={ApplicationSet}
        filterFunction={makeSearchFilter(['spec.generators', 'spec.template.metadata.name'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'generators',
            label: 'Generators',
            getValue: (item: any) => String((item?.jsonData?.spec?.generators || []).length),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function ApplicationSetDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={ApplicationSet} namespace={namespace} name={name} title="ApplicationSet Details" />;
}
