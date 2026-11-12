import { ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResourceDefinitionDetails } from '../components/ResourceDefinitionDetails';
import { Policy } from '../resources/policy';
import { getNonCompliantClusterCount, getPolicyIntent, getPolicyWhyNonCompliant } from '../utils/policy';
import { makeSearchFilter } from '../utils/search';

export function PolicyListView() {
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
    <ResourceDefinitionDetails
      resourceType={Policy}
      namespace={namespace}
      name={name}
      title="Policy Details"
      describe={(item: Policy) => `${getPolicyIntent(item)}. Compliance: ${item?.jsonData?.status?.compliant || 'unknown'}.`}
    />
  );
}
