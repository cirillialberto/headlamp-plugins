import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { OcmApiLabels } from '../isOcmInstalled';
import { PlacementBinding } from '../resources/placementBinding';
import { makeSearchFilter } from '../utils/search';

export function PlacementBindingListView() {
  const { t } = useTranslation();
  const { isClusterApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title={t('PlacementBindings')}>
        <Loader title={t('Checking Open Cluster Management APIs')} />
      </SectionBox>
    );
  }

  if (isClusterApiInstalled === false) {
    return (
      <SectionBox title={t('PlacementBindings')}>
        <CrdNotInstalled apiGroup={OcmApiLabels.cluster} resourceLabel={t('PlacementBindings')} />
      </SectionBox>
    );
  }

  return (
    <SectionBox title={t('PlacementBindings')}>
      <ResourceListView
        title={t('Policy Placement Bindings')}
        resourceClass={PlacementBinding}
        filterFunction={makeSearchFilter(['placementRef.name', 'subjects'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'placementRef',
            label: t('Placement'),
            getValue: (item: any) => item?.jsonData?.placementRef?.name || '-',
          },
          {
            id: 'subjects',
            label: t('Subjects'),
            getValue: (item: any) => String((item?.jsonData?.subjects || []).length),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function PlacementBindingDetailsView() {
  const { t } = useTranslation();
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={PlacementBinding} namespace={namespace} name={name} title={t('PlacementBinding Details')} />;
}
