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
import { getNonCompliantClusterCount, getPolicyIntent, getPolicyWhyNonCompliant } from '../utils/policy';
import { bindingsReferencingPolicy, placementsForBinding } from '../utils/references';
import { makeSearchFilter } from '../utils/search';

export function PolicyListView() {
  const { isPolicyApiInstalled, isOcmCheckLoading } = useOcmInstalled();

  if (isOcmCheckLoading) {
    return (
      <SectionBox title="Policies">
        <Loader title="Checking Open Cluster Management APIs" />
      </SectionBox>
    );
  }

  if (isPolicyApiInstalled === false) {
    return (
      <SectionBox title="Policies">
        <CrdNotInstalled apiGroup={OcmApiLabels.policy} resourceLabel="Policies" />
      </SectionBox>
    );
  }

  return (
    <SectionBox title="Policies">
      <ResourceListView
        title="Governance Policies"
        resourceClass={Policy}
        filterFunction={makeSearchFilter(['status.compliant', 'spec.remediationAction', 'status.status', 'status.details'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'intent',
            label: 'What it does',
            getValue: (item: any) => getPolicyIntent(item),
            render: (item: any) => <span style={{ color: '#444' }}>{getPolicyIntent(item)}</span>,
          },
          {
            id: 'compliant',
            label: 'Compliance',
            getValue: (item: any) => item?.jsonData?.status?.compliant || '-',
            render: (item: any) => {
              const c = String(item?.jsonData?.status?.compliant || '').toLowerCase();
              const color = c === 'compliant' ? '#4CAF50' : c === 'noncompliant' ? '#F44336' : '#666';
              return <span style={{ color, fontWeight: 600 }}>{item?.jsonData?.status?.compliant || '-'}</span>;
            },
          },
          {
            id: 'remediation',
            label: 'Remediation',
            getValue: (item: any) => item?.jsonData?.spec?.remediationAction || '-',
          },
          {
            id: 'affectedClusters',
            label: 'Affected Clusters',
            getValue: (item: any) => String(getNonCompliantClusterCount(item)),
          },
          {
            id: 'whyNonCompliant',
            label: 'Why Non-compliant',
            getValue: (item: any) => getPolicyWhyNonCompliant(item),
            render: (item: any) => {
              const compliance = String(item?.jsonData?.status?.compliant || '').toLowerCase();
              if (compliance !== 'noncompliant') return <span style={{ color: '#666' }}>-</span>;
              return <span style={{ color: '#444' }}>{getPolicyWhyNonCompliant(item)}</span>;
            },
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function PolicyDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return (
    <>
      <PolicyRelatedResourcesSection namespace={namespace} name={name} />
      <ResourceDefinitionDetails
        resourceType={Policy}
        namespace={namespace}
        name={name}
        title="Policy Details"
        describe={(item: Policy) => `${getPolicyIntent(item)}. Compliance: ${item?.jsonData?.status?.compliant || 'unknown'}.`}
      />
    </>
  );
}

/** Lists PlacementBindings that attach this policy, with links to their placements. */
function PolicyRelatedResourcesSection({ namespace, name }: { namespace: string; name: string }) {
  const [bindings] = PlacementBinding.useList();
  const [placements] = Placement.useList();

  if (!bindings) return null;

  const rows = bindingsReferencingPolicy({ name, namespace }, bindings as any)
    .filter((binding: any) => Boolean(binding?.metadata?.name))
    .map((binding: any) => {
      const bindingNamespace = String(binding?.metadata?.namespace || '');
      const bindingName = String(binding?.metadata?.name);
      const placement = placementsForBinding(binding, placements as any)[0];

      return {
        ref: {
          label: `Binding ${bindingNamespace}/${bindingName}`,
          routeName: RouteNames.placementBindingsDetail,
          params: { namespace: bindingNamespace, name: bindingName },
        },
        related: placement
          ? [
              {
                label: `Placement ${placement?.metadata?.namespace || ''}/${placement?.metadata?.name || ''}`,
                routeName: RouteNames.placementsDetail,
                params: {
                  namespace: String(placement?.metadata?.namespace || ''),
                  name: String(placement?.metadata?.name || ''),
                },
              },
            ]
          : [],
      };
    });

  return <RelatedResourcesSection title="Referenced by (PlacementBindings)" rows={rows} emptyHint="No PlacementBindings reference this policy." />;
}
