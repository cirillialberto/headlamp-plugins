import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { RelatedResourcesSection } from '../components/RelatedResources';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { RouteNames } from '../constants';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { OcmApiLabels } from '../isOcmInstalled';
import { Placement } from '../resources/placement';
import { PlacementBinding } from '../resources/placementBinding';
import { Policy } from '../resources/policy';
import { bindingsReferencingPlacement, policiesForBinding } from '../utils/references';
import { makeSearchFilter } from '../utils/search';

export function PlacementListView() {
  const { t } = useTranslation();
  const { isClusterApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title={t('Placements')}>
        <Loader title={t('Checking Open Cluster Management APIs')} />
      </SectionBox>
    );
  }

  if (isClusterApiInstalled === false) {
    return (
      <SectionBox title={t('Placements')}>
        <CrdNotInstalled apiGroup={OcmApiLabels.cluster} resourceLabel={t('Placements')} />
      </SectionBox>
    );
  }

  return (
    <SectionBox title={t('Placements')}>
      <ResourceListView
        title={t('Cluster Placements')}
        resourceClass={Placement}
        filterFunction={makeSearchFilter(['spec.numberOfClusters', 'status.numberOfSelectedClusters'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'desired',
            label: t('Desired'),
            getValue: (item: any) => item?.jsonData?.spec?.numberOfClusters ?? '-',
          },
          {
            id: 'selected',
            label: t('Selected'),
            getValue: (item: any) => item?.jsonData?.status?.numberOfSelectedClusters ?? '-',
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function PlacementDetailsView() {
  const { t } = useTranslation();
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return (
    <>
      <PlacementRelatedResourcesSection namespace={namespace} name={name} />
      <ResourceDefinitionDetails resourceType={Placement} namespace={namespace} name={name} title={t('Placement Details')} />
    </>
  );
}

/** Lists the PlacementBindings that target this placement, with links to their policies. */
function PlacementRelatedResourcesSection({ namespace, name }: { namespace: string; name: string }) {
  const { t } = useTranslation();
  const [bindings] = PlacementBinding.useList();
  const [policies] = Policy.useList();

  if (!bindings) return null;

  const rows = bindingsReferencingPlacement({ name, namespace }, bindings as any)
    .filter((binding: any) => Boolean(binding?.metadata?.name))
    .map((binding: any) => {
      const bindingNamespace = String(binding?.metadata?.namespace || '');
      const bindingName = String(binding?.metadata?.name);
      const related = policiesForBinding(binding, policies as any)
        .filter((policy: any) => Boolean(policy?.metadata?.name))
        .map((policy: any) => ({
          label: `Policy ${policy?.metadata?.namespace || ''}/${policy?.metadata?.name || ''}`,
          routeName: RouteNames.policiesDetail,
          params: {
            namespace: String(policy?.metadata?.namespace || ''),
            name: String(policy?.metadata?.name || ''),
          },
        }));

      return {
        ref: {
          label: `Binding ${bindingNamespace}/${bindingName}`,
          routeName: RouteNames.placementBindingsDetail,
          params: { namespace: bindingNamespace, name: bindingName },
        },
        related,
      };
    });

  return (
    <RelatedResourcesSection
      title={t('Bound by (PlacementBindings)')}
      rows={rows}
      emptyHint={t('No PlacementBindings reference this placement.')}
    />
  );
}
