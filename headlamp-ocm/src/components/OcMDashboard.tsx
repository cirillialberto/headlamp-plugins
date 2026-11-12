import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import {
  HubAcceptedManagedCluster,
  ManagedClusterConditionAvailable,
  ManagedClusterConditionJoined,
  RouteNames,
} from '../constants';
import { ManagedCluster } from '../resources/managedCluster';
import { ManagedClusterSet } from '../resources/managedClusterSet';
import { Placement } from '../resources/placement';
import { PlacementBinding } from '../resources/placementBinding';
import { Policy } from '../resources/policy';
import {
  getConditionStatus,
  getPlacementDecisionNames,
  statusColor,
} from '../utils/cluster';
import {
  isPolicyCompliant,
  isPolicyNonCompliant,
  summarizeNonCompliantPolicies,
  summarizePoliciesByNamespace,
} from '../utils/policy';

export function OcMDashboard() {
  const [clusters] = ManagedCluster.useList();
  const [clusterSets] = ManagedClusterSet.useList();
  const [policies] = Policy.useList();
  const [placements] = Placement.useList();
  const [bindings] = PlacementBinding.useList();

  const compliant = (policies || []).filter((p: Policy) => isPolicyCompliant(p)).length;
  const nonCompliant = (policies || []).filter((p: Policy) => isPolicyNonCompliant(p)).length;

  const cards = [
    { label: 'Managed Clusters', value: (clusters || []).length, routeName: RouteNames.managedClusters },
    { label: 'ManagedClusterSets', value: (clusterSets || []).length, routeName: RouteNames.managedClusterSets },
    { label: 'Policies', value: (policies || []).length, routeName: RouteNames.policies },
    { label: 'Placements', value: (placements || []).length, routeName: RouteNames.placements },
    { label: 'PlacementBindings', value: (bindings || []).length, routeName: RouteNames.placementBindings },
    { label: 'Compliant Policies', value: compliant, routeName: RouteNames.policies },
    { label: 'Non-compliant Policies', value: nonCompliant, routeName: RouteNames.policies },
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
            <Link routeName={RouteNames.policies}>Open policy list</Link>
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
            <Link routeName={RouteNames.policies}>Open policy list</Link>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Cluster Condition Heatmap</div>
          {clustersPreview.length === 0 ? (
            <div style={{ fontSize: 12, color: '#666' }}>No managed clusters detected.</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {clustersPreview.map((cluster: ManagedCluster) => {
                const available = getConditionStatus(cluster, ManagedClusterConditionAvailable);
                const joined = getConditionStatus(cluster, ManagedClusterConditionJoined);
                const accepted = getConditionStatus(cluster, HubAcceptedManagedCluster);
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
            <Link routeName={RouteNames.managedClusters}>Open cluster list</Link>
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Placement Resolution Preview</div>
          {placementsPreview.length === 0 ? (
            <div style={{ fontSize: 12, color: '#666' }}>No placements available.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {placementsPreview.map((placement: Placement) => {
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
            <Link routeName={RouteNames.placements}>Open placement list</Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        OCM view for multi-cluster posture: cluster health, governance policy state, placement topology and binding relationships.
      </div>
    </SectionBox>
  );
}
