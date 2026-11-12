import { Loader, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { OcmApiLabels } from '../isOcmInstalled';
import { ApplicationSet } from '../resources/applicationSet';
import { makeSearchFilter } from '../utils/search';

export function ApplicationSetListView() {
  const { isArgoApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title="ApplicationSets">
        <Loader title="Checking Open Cluster Management APIs" />
      </SectionBox>
    );
  }

  if (isArgoApiInstalled === false) {
    return (
      <SectionBox title="ApplicationSets">
        <CrdNotInstalled apiGroup={OcmApiLabels.argo} resourceLabel="ApplicationSets" />
      </SectionBox>
    );
  }

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
