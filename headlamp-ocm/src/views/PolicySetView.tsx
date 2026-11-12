import { Loader, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { OcmApiLabels } from '../isOcmInstalled';
import { PolicySet } from '../resources/policySet';
import { makeSearchFilter } from '../utils/search';

export function PolicySetListView() {
  const { isPolicyApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title="PolicySets">
        <Loader title="Checking Open Cluster Management APIs" />
      </SectionBox>
    );
  }

  if (isPolicyApiInstalled === false) {
    return (
      <SectionBox title="PolicySets">
        <CrdNotInstalled apiGroup={OcmApiLabels.policy} resourceLabel="PolicySets" />
      </SectionBox>
    );
  }

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
