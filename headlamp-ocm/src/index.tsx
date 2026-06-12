import { K8s, registerAppBarAction, registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useParams } from 'react-router-dom';

const OCM_GROUP = 'cluster.open-cluster-management.io';
const POLICY_GROUP = 'policy.open-cluster-management.io';

const ManagedClusterClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: OCM_GROUP, version: 'v1' }],
  isNamespaced: false,
  pluralName: 'managedclusters',
  singularName: 'managedcluster',
  kind: 'ManagedCluster',
});

const ManagedClusterSetClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [
    { group: OCM_GROUP, version: 'v1beta2' },
    { group: OCM_GROUP, version: 'v1beta1' },
  ],
  isNamespaced: false,
  pluralName: 'managedclustersets',
  singularName: 'managedclusterset',
  kind: 'ManagedClusterSet',
});

const PlacementClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: OCM_GROUP, version: 'v1beta1' }],
  isNamespaced: true,
  pluralName: 'placements',
  singularName: 'placement',
  kind: 'Placement',
});

const PolicyClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: POLICY_GROUP, version: 'v1' }],
  isNamespaced: true,
  pluralName: 'policies',
  singularName: 'policy',
  kind: 'Policy',
});

const PolicySetClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: POLICY_GROUP, version: 'v1beta1' }],
  isNamespaced: true,
  pluralName: 'policysets',
  singularName: 'policyset',
  kind: 'PolicySet',
});

const PlacementBindingClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: POLICY_GROUP, version: 'v1' }],
  isNamespaced: true,
  pluralName: 'placementbindings',
  singularName: 'placementbinding',
  kind: 'PlacementBinding',
});

const ApplicationSetClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'argoproj.io', version: 'v1alpha1' }],
  isNamespaced: true,
  pluralName: 'applicationsets',
  singularName: 'applicationset',
  kind: 'ApplicationSet',
});

class ManagedCluster extends ManagedClusterClass {
  static get detailsRoute() {
    return 'ocm-managedclusters-detail';
  }
}

class ManagedClusterSet extends ManagedClusterSetClass {
  static get detailsRoute() {
    return 'ocm-managedclustersets-detail';
  }
}

class Placement extends PlacementClass {
  static get detailsRoute() {
    return 'ocm-placements-detail';
  }
}

class Policy extends PolicyClass {
  static get detailsRoute() {
    return 'ocm-policies-detail';
  }
}

class PolicySet extends PolicySetClass {
  static get detailsRoute() {
    return 'ocm-policysets-detail';
  }
}

class PlacementBinding extends PlacementBindingClass {
  static get detailsRoute() {
    return 'ocm-placementbindings-detail';
  }
}

class ApplicationSet extends ApplicationSetClass {
  static get detailsRoute() {
    return 'ocm-applicationsets-detail';
  }
}

function makeSearchFilter(extraPaths: string[] = []) {
  return (item: any, search?: string) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const values: string[] = [
      item?.metadata?.name,
      item?.metadata?.namespace,
      ...extraPaths.map(path => path.split('.').reduce((obj: any, key) => obj?.[key], item?.jsonData ?? item)),
    ]
      .filter(Boolean)
      .map(v => String(v).toLowerCase());
    return values.some(v => v.includes(q));
  };
}

function getConditionStatus(item: any, type: string) {
  const condition = (item?.jsonData?.status?.conditions || []).find((c: any) => c?.type === type);
  return String(condition?.status || 'Unknown');
}

function statusColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'true' || normalized === 'compliant') return '#2e7d32';
  if (normalized === 'false' || normalized === 'noncompliant') return '#c62828';
  return '#666';
}

function summarizePoliciesByNamespace(policies: any[]) {
  const buckets: Record<string, { compliant: number; nonCompliant: number; unknown: number }> = {};
  for (const p of policies || []) {
    const namespace = p?.metadata?.namespace || 'cluster-scoped';
    if (!buckets[namespace]) {
      buckets[namespace] = { compliant: 0, nonCompliant: 0, unknown: 0 };
    }

    const compliance = String(p?.jsonData?.status?.compliant || '').toLowerCase();
    if (compliance === 'compliant') buckets[namespace].compliant += 1;
    else if (compliance === 'noncompliant') buckets[namespace].nonCompliant += 1;
    else buckets[namespace].unknown += 1;
  }

  return Object.entries(buckets)
    .map(([namespace, values]) => ({ namespace, ...values }))
    .sort((a, b) => b.nonCompliant - a.nonCompliant || b.unknown - a.unknown || a.namespace.localeCompare(b.namespace));
}

function getPlacementDecisionNames(placement: any) {
  return (placement?.jsonData?.status?.decisions || [])
    .map((d: any) => d?.clusterName)
    .filter(Boolean)
    .slice(0, 8);
}

function getPolicyStatusEntries(policy: any) {
  return policy?.jsonData?.status?.status || [];
}

function getNonCompliantClusterCount(policy: any) {
  return getPolicyStatusEntries(policy).filter((entry: any) => {
    const state = String(entry?.complianceState || entry?.compliant || '').toLowerCase();
    return state.includes('noncompliant');
  }).length;
}

function getPolicyWhyNonCompliant(policy: any) {
  const reasons = new Set<string>();
  const statusEntries = getPolicyStatusEntries(policy);

  for (const entry of statusEntries) {
    const state = String(entry?.complianceState || entry?.compliant || '').toLowerCase();
    if (!state.includes('noncompliant')) continue;

    for (const clause of entry?.clauses || []) {
      const msg = String(clause?.message || clause?.reason || '').trim();
      if (msg) reasons.add(msg);
    }

    const topMsg = String(entry?.message || '').trim();
    if (topMsg) reasons.add(topMsg);
  }

  for (const detail of policy?.jsonData?.status?.details || []) {
    for (const h of detail?.history || []) {
      const msg = String(h?.message || '').trim();
      if (msg) reasons.add(msg);
    }
  }

  const list = Array.from(reasons).filter(Boolean);
  if (list.length === 0) return '-';
  return list.slice(0, 2).join(' | ');
}

function summarizeNonCompliantPolicies(policies: any[]) {
  return (policies || [])
    .filter((p: any) => String(p?.jsonData?.status?.compliant || '').toLowerCase() === 'noncompliant')
    .map((p: any) => ({
      namespace: p?.metadata?.namespace || '-',
      name: p?.metadata?.name || '-',
      clusters: getNonCompliantClusterCount(p),
      reason: getPolicyWhyNonCompliant(p),
    }))
    .sort((a, b) => b.clusters - a.clusters || a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name));
}

function getPolicyIntent(policy: any) {
  const remediation = String(policy?.jsonData?.spec?.remediationAction || 'inform');
  const templates = policy?.jsonData?.spec?.['policy-templates'] || [];
  if (!Array.isArray(templates) || templates.length === 0) {
    return `No templates (remediation: ${remediation})`;
  }

  const first = templates[0]?.objectDefinition || templates[0]?.objectdefinition || {};
  const kind = first?.kind || 'Resource';
  const name = first?.metadata?.name || first?.metadata?.generateName || 'unnamed';
  const namespace = first?.metadata?.namespace;
  const scope = namespace ? `${namespace}/${name}` : name;
  const count = templates.length;
  return `${kind} ${scope} (${count} template${count > 1 ? 's' : ''}, remediation: ${remediation})`;
}

function yamlEscapeString(value: string) {
  if (value === '') return "''";
  const needsQuote = /[:#\-\{\}\[\],&*!?|>'"%@`\n\r\t]|^\s|\s$|^(true|false|null|~|yes|no|on|off)$/i.test(value);
  if (!needsQuote) return value;
  return `'${value.replace(/'/g, "''")}'`;
}

function toYaml(value: any, indent = 0): string {
  const pad = '  '.repeat(indent);

  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return yamlEscapeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map(item => {
        if (item !== null && typeof item === 'object') {
          const nested = toYaml(item, indent + 1);
          return `${pad}-\n${nested}`;
        }
        return `${pad}- ${toYaml(item, 0)}`;
      })
      .join('\n');
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';

  return entries
    .map(([k, v]) => {
      const key = yamlEscapeString(k);
      if (v !== null && typeof v === 'object') {
        return `${pad}${key}:\n${toYaml(v, indent + 1)}`;
      }
      return `${pad}${key}: ${toYaml(v, 0)}`;
    })
    .join('\n');
}

function YamlSection({ title, data }: { title: string; data: any }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {data ? (
        <pre
          style={{
            margin: 0,
            padding: 10,
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#f8f8f8',
            fontSize: 12,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {toYaml(data)}
        </pre>
      ) : (
        <div style={{ fontSize: 12, color: '#666' }}>No data.</div>
      )}
    </div>
  );
}

function ResourceDefinitionDetails({
  resourceType,
  name,
  namespace,
  title,
  describe,
}: {
  resourceType: any;
  name: string;
  namespace?: string;
  title: string;
  describe?: (item: any) => string;
}) {
  const [item, error] = resourceType.useGet(name, namespace);

  if (error) {
    return (
      <SectionBox title={title}>
        <div style={{ color: '#c62828', fontSize: 12 }}>Failed to load resource: {String(error)}</div>
      </SectionBox>
    );
  }

  if (!item) {
    return (
      <SectionBox title={title}>
        <div style={{ fontSize: 12, color: '#666' }}>Loading resource definition...</div>
      </SectionBox>
    );
  }

  const obj = item?.jsonData || {};
  const description = describe ? describe(item) : '';

  return (
    <SectionBox title={title}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, fontSize: 12 }}>
        <div><strong>Kind:</strong> {obj?.kind || '-'}</div>
        <div><strong>API Version:</strong> {obj?.apiVersion || '-'}</div>
        <div><strong>Name:</strong> {obj?.metadata?.name || '-'}</div>
        <div><strong>Namespace:</strong> {obj?.metadata?.namespace || '-'}</div>
        <div><strong>Created:</strong> {obj?.metadata?.creationTimestamp || '-'}</div>
        <div><strong>Generation:</strong> {String(obj?.metadata?.generation ?? '-')}</div>
      </div>

      {description ? <div style={{ marginTop: 10, fontSize: 12, color: '#444' }}><strong>Description:</strong> {description}</div> : null}

      <YamlSection title="Spec (YAML)" data={obj?.spec} />
      <YamlSection title="Status (YAML)" data={obj?.status} />

      <div style={{ marginTop: 12 }}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Full definition (YAML)</summary>
          <pre
            style={{
              marginTop: 8,
              marginBottom: 0,
              padding: 10,
              border: '1px solid #ddd',
              borderRadius: 8,
              background: '#f8f8f8',
              fontSize: 12,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {toYaml(obj)}
          </pre>
        </details>
      </div>
    </SectionBox>
  );
}

function OCMDashboard() {
  const [clusters] = ManagedCluster.useList();
  const [clusterSets] = ManagedClusterSet.useList();
  const [policies] = Policy.useList();
  const [placements] = Placement.useList();
  const [bindings] = PlacementBinding.useList();

  const compliant = (policies || []).filter((p: any) => String(p?.jsonData?.status?.compliant || '').toLowerCase() === 'compliant').length;
  const nonCompliant = (policies || []).filter((p: any) => String(p?.jsonData?.status?.compliant || '').toLowerCase() === 'noncompliant').length;

  const cards = [
    { label: 'Managed Clusters', value: (clusters || []).length, routeName: 'ocm-managedclusters-route' },
    { label: 'ManagedClusterSets', value: (clusterSets || []).length, routeName: 'ocm-managedclustersets-route' },
    { label: 'Policies', value: (policies || []).length, routeName: 'ocm-policies-route' },
    { label: 'Placements', value: (placements || []).length, routeName: 'ocm-placements-route' },
    { label: 'PlacementBindings', value: (bindings || []).length, routeName: 'ocm-placementbindings-route' },
    { label: 'Compliant Policies', value: compliant, routeName: 'ocm-policies-route' },
    { label: 'Non-compliant Policies', value: nonCompliant, routeName: 'ocm-policies-route' },
  ];

  const policyByNamespace = summarizePoliciesByNamespace(policies || []).slice(0, 8);
  const nonCompliantPolicies = summarizeNonCompliantPolicies(policies || []).slice(0, 8);
  const clustersPreview = (clusters || []).slice(0, 10);
  const placementsPreview = (placements || []).slice(0, 8);

  return (
    <SectionBox title="Open Cluster Management">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {cards.map(card => (
          <Link key={`${card.label}-${card.routeName}`} routeName={card.routeName}>
            <div
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ fontSize: 12, color: '#666' }}>{card.label}</div>
              <div style={{ fontWeight: 700 }}>{card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Non-compliant Policy Insights</div>
          {nonCompliantPolicies.length === 0 ? (
            <div style={{ fontSize: 12, color: '#666' }}>No non-compliant policies detected.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {nonCompliantPolicies.map(row => (
                <div key={`${row.namespace}/${row.name}`} style={{ fontSize: 12 }}>
                  <div>
                    <strong>{row.namespace}/{row.name}</strong> <span style={{ color: '#c62828' }}>({row.clusters} cluster)</span>
                  </div>
                  <div style={{ color: '#444' }}>{row.reason}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName="ocm-policies-route">Open policy list</Link>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Policy Compliance Drilldown</div>
          {policyByNamespace.length === 0 ? (
            <div style={{ fontSize: 12, color: '#666' }}>No policy data available.</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {policyByNamespace.map(row => (
                <div key={row.namespace} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, fontSize: 12 }}>
                  <strong>{row.namespace}</strong>
                  <span style={{ color: '#2e7d32' }}>C: {row.compliant}</span>
                  <span style={{ color: '#c62828' }}>NC: {row.nonCompliant}</span>
                  <span style={{ color: '#666' }}>U: {row.unknown}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName="ocm-policies-route">Open policy list</Link>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Cluster Condition Heatmap</div>
          {clustersPreview.length === 0 ? (
            <div style={{ fontSize: 12, color: '#666' }}>No managed clusters detected.</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {clustersPreview.map((cluster: any) => {
                const available = getConditionStatus(cluster, 'ManagedClusterConditionAvailable');
                const joined = getConditionStatus(cluster, 'ManagedClusterConditionJoined');
                const accepted = getConditionStatus(cluster, 'HubAcceptedManagedCluster');
                return (
                  <div key={cluster?.metadata?.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, fontSize: 12 }}>
                    <strong>{cluster?.metadata?.name}</strong>
                    <span style={{ color: statusColor(available) }}>Avail: {available}</span>
                    <span style={{ color: statusColor(joined) }}>Joined: {joined}</span>
                    <span style={{ color: statusColor(accepted) }}>Accepted: {accepted}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName="ocm-managedclusters-route">Open cluster list</Link>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Placement Resolution Preview</div>
          {placementsPreview.length === 0 ? (
            <div style={{ fontSize: 12, color: '#666' }}>No placements available.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {placementsPreview.map((placement: any) => {
                const selectedClusters = getPlacementDecisionNames(placement);
                return (
                  <div key={`${placement?.metadata?.namespace}/${placement?.metadata?.name}`} style={{ fontSize: 12 }}>
                    <div>
                      <strong>{placement?.metadata?.namespace}/{placement?.metadata?.name}</strong>
                    </div>
                    <div style={{ color: '#444' }}>
                      {selectedClusters.length > 0 ? selectedClusters.join(', ') : 'No selected clusters yet'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName="ocm-placements-route">Open placement list</Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        OCM view for multi-cluster posture: cluster health, governance policy state, placement topology and binding relationships.
      </div>
    </SectionBox>
  );
}

function ManagedClusterListView() {
  return (
    <SectionBox title="ManagedClusters">
      <ResourceListView
        title="Managed Clusters"
        resourceClass={ManagedCluster}
        filterFunction={makeSearchFilter(['status.conditions'])}
        columns={[
          'name',
          {
            id: 'available',
            label: 'Available',
            getValue: (item: any) => {
              const cond = (item?.jsonData?.status?.conditions || []).find((c: any) => c.type === 'ManagedClusterConditionAvailable');
              return cond?.status || '-';
            },
          },
          {
            id: 'vendor',
            label: 'Vendor',
            getValue: (item: any) => item?.jsonData?.status?.vendor || '-',
          },
          {
            id: 'version',
            label: 'K8s Version',
            getValue: (item: any) => item?.jsonData?.status?.version?.kubernetes || '-',
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

function ManagedClusterSetListView() {
  return (
    <SectionBox title="ManagedClusterSets">
      <ResourceListView
        title="Managed Cluster Sets"
        resourceClass={ManagedClusterSet}
        filterFunction={makeSearchFilter(['status.conditions'])}
        columns={[
          'name',
          {
            id: 'clusters',
            label: 'Clusters',
            getValue: (item: any) => String(item?.jsonData?.status?.clusterCount ?? item?.jsonData?.status?.clusters ?? '-'),
          },
          {
            id: 'conditions',
            label: 'Conditions',
            getValue: (item: any) => String((item?.jsonData?.status?.conditions || []).length),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

function PolicyListView() {
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

function PlacementListView() {
  return (
    <SectionBox title="Placements">
      <ResourceListView
        title="Cluster Placements"
        resourceClass={Placement}
        filterFunction={makeSearchFilter(['spec.numberOfClusters', 'status.numberOfSelectedClusters'])}
        columns={[
          'name',
          'namespace',
          {
            id: 'desired',
            label: 'Desired',
            getValue: (item: any) => item?.jsonData?.spec?.numberOfClusters ?? '-',
          },
          {
            id: 'selected',
            label: 'Selected',
            getValue: (item: any) => item?.jsonData?.status?.numberOfSelectedClusters ?? '-',
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

function PlacementBindingListView() {
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

function PolicySetListView() {
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

function ApplicationSetListView() {
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

function ManagedClusterDetailsView() {
  const { name = '' } = useParams<{ name: string }>();
  return <ResourceDefinitionDetails resourceType={ManagedCluster} name={name} title="ManagedCluster Details" />;
}

function ManagedClusterSetDetailsView() {
  const { name = '' } = useParams<{ name: string }>();
  return <ResourceDefinitionDetails resourceType={ManagedClusterSet} name={name} title="ManagedClusterSet Details" />;
}

function PolicyDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return (
    <ResourceDefinitionDetails
      resourceType={Policy}
      namespace={namespace}
      name={name}
      title="Policy Details"
      describe={(item: any) => `${getPolicyIntent(item)}. Compliance: ${item?.jsonData?.status?.compliant || 'unknown'}.`} 
    />
  );
}

function PlacementDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={Placement} namespace={namespace} name={name} title="Placement Details" />;
}

function PlacementBindingDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={PlacementBinding} namespace={namespace} name={name} title="PlacementBinding Details" />;
}

function PolicySetDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={PolicySet} namespace={namespace} name={name} title="PolicySet Details" />;
}

function ApplicationSetDetailsView() {
  const { namespace = '', name = '' } = useParams<{ namespace: string; name: string }>();
  return <ResourceDefinitionDetails resourceType={ApplicationSet} namespace={namespace} name={name} title="ApplicationSet Details" />;
}

registerAppBarAction(() => <span style={{ fontWeight: 700 }}>OCM</span>);
registerSidebarEntry({ parent: null, name: 'ocm', label: 'Open Cluster Mgmt', url: '/ocm', icon: 'mdi:hub-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-managedclusters', label: 'ManagedClusters', url: '/ocm/managedclusters', icon: 'mdi:cloud-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-managedclustersets', label: 'ManagedClusterSets', url: '/ocm/managedclustersets', icon: 'mdi:set-center-right' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-policies', label: 'Policies', url: '/ocm/policies', icon: 'mdi:shield-check-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-policysets', label: 'PolicySets', url: '/ocm/policysets', icon: 'mdi:shield-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-placements', label: 'Placements', url: '/ocm/placements', icon: 'mdi:map-marker-radius-outline' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-placementbindings', label: 'PlacementBindings', url: '/ocm/placementbindings', icon: 'mdi:link-variant' });
registerSidebarEntry({ parent: 'ocm', name: 'ocm-applicationsets', label: 'ApplicationSets', url: '/ocm/applicationsets', icon: 'mdi:source-branch' });

try {
  registerRoute({ path: '/ocm', sidebar: 'ocm', name: 'ocm-route', exact: true, component: () => <OCMDashboard /> });
  registerRoute({ path: '/ocm/managedclusters', sidebar: 'ocm-managedclusters', name: 'ocm-managedclusters-route', exact: true, component: () => <ManagedClusterListView /> });
  registerRoute({ path: '/ocm/managedclustersets', sidebar: 'ocm-managedclustersets', name: 'ocm-managedclustersets-route', exact: true, component: () => <ManagedClusterSetListView /> });
  registerRoute({ path: '/ocm/policies', sidebar: 'ocm-policies', name: 'ocm-policies-route', exact: true, component: () => <PolicyListView /> });
  registerRoute({ path: '/ocm/policysets', sidebar: 'ocm-policysets', name: 'ocm-policysets-route', exact: true, component: () => <PolicySetListView /> });
  registerRoute({ path: '/ocm/placements', sidebar: 'ocm-placements', name: 'ocm-placements-route', exact: true, component: () => <PlacementListView /> });
  registerRoute({ path: '/ocm/placementbindings', sidebar: 'ocm-placementbindings', name: 'ocm-placementbindings-route', exact: true, component: () => <PlacementBindingListView /> });
  registerRoute({ path: '/ocm/applicationsets', sidebar: 'ocm-applicationsets', name: 'ocm-applicationsets-route', exact: true, component: () => <ApplicationSetListView /> });

  registerRoute({ path: '/ocm/managedclusters/:name', sidebar: 'ocm-managedclusters', name: 'ocm-managedclusters-detail', exact: true, component: () => <ManagedClusterDetailsView /> });
  registerRoute({ path: '/ocm/managedclustersets/:name', sidebar: 'ocm-managedclustersets', name: 'ocm-managedclustersets-detail', exact: true, component: () => <ManagedClusterSetDetailsView /> });
  registerRoute({ path: '/ocm/policies/:namespace/:name', sidebar: 'ocm-policies', name: 'ocm-policies-detail', exact: true, component: () => <PolicyDetailsView /> });
  registerRoute({ path: '/ocm/policysets/:namespace/:name', sidebar: 'ocm-policysets', name: 'ocm-policysets-detail', exact: true, component: () => <PolicySetDetailsView /> });
  registerRoute({ path: '/ocm/placements/:namespace/:name', sidebar: 'ocm-placements', name: 'ocm-placements-detail', exact: true, component: () => <PlacementDetailsView /> });
  registerRoute({ path: '/ocm/placementbindings/:namespace/:name', sidebar: 'ocm-placementbindings', name: 'ocm-placementbindings-detail', exact: true, component: () => <PlacementBindingDetailsView /> });
  registerRoute({ path: '/ocm/applicationsets/:namespace/:name', sidebar: 'ocm-applicationsets', name: 'ocm-applicationsets-detail', exact: true, component: () => <ApplicationSetDetailsView /> });
} catch (err) {
  console.error('[OCM Plugin] Failed to register routes:', err);
}
