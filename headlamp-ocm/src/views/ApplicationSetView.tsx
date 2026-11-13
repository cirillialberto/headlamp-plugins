import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  const { t } = useTranslation();
  const { isArgoApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title={t('ApplicationSets')}>
        <Loader title={t('Checking Open Cluster Management APIs')} />
      </SectionBox>
    );
  }

  if (isArgoApiInstalled === false) {
    return (
      <SectionBox title={t('ApplicationSets')}>
        <CrdNotInstalled apiGroup={OcmApiLabels.argo} resourceLabel={t('ApplicationSets')} />
      </SectionBox>
    );
  }

  return (
    <SectionBox title={t('ApplicationSets')}>
      <ResourceListView
        title={t('ArgoCD ApplicationSets')}
        resourceClass={ApplicationSet}
        filterFunction={makeSearchFilter(['spec.generators', 'spec.template.metadata.name'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'generators',
            label: t('Generators'),
            getValue: (item: any) => String((item?.jsonData?.spec?.generators || []).length),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function ApplicationSetDetailsView() {
  const { t } = useTranslation();
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={ApplicationSet} namespace={namespace} name={name} title={t('ApplicationSet Details')} />;
}
