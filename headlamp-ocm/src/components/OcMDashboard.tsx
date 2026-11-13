import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import {
  HubAcceptedManagedCluster,
  ManagedClusterConditionAvailable,
  ManagedClusterConditionJoined,
  RouteNames,
} from '../constants';
import { useStatusColors } from '../hooks/useStatusColors';
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
  const { t } = useTranslation();
  const colors = useStatusColors();

  const [clusters] = ManagedCluster.useList();
  const [clusterSets] = ManagedClusterSet.useList();
  const [policies] = Policy.useList();
  const [placements] = Placement.useList();
  const [bindings] = PlacementBinding.useList();

  const compliant = (policies || []).filter((p: Policy) => isPolicyCompliant(p)).length;
  const nonCompliant = (policies || []).filter((p: Policy) => isPolicyNonCompliant(p)).length;

  const cards = [
    { label: t('Managed Clusters'), value: (clusters || []).length, routeName: RouteNames.managedClusters },
    { label: t('ManagedClusterSets'), value: (clusterSets || []).length, routeName: RouteNames.managedClusterSets },
    { label: t('Policies'), value: (policies || []).length, routeName: RouteNames.policies },
    { label: t('Placements'), value: (placements || []).length, routeName: RouteNames.placements },
    { label: t('PlacementBindings'), value: (bindings || []).length, routeName: RouteNames.placementBindings },
    { label: t('Compliant Policies'), value: compliant, routeName: RouteNames.policies },
    { label: t('Non-compliant Policies'), value: nonCompliant, routeName: RouteNames.policies },
  ];

  const policyByNamespace = summarizePoliciesByNamespace(policies || []).slice(0, 8);
  const nonCompliantPolicies = summarizeNonCompliantPolicies(policies || []).slice(0, 8);
  const clustersPreview = (clusters || []).slice(0, 10);
  const placementsPreview = (placements || []).slice(0, 8);

  const boxStyle = {
    border: `1px solid ${colors.divider}`,
    borderRadius: 8,
    padding: 12,
  } as const;

  return (
    <SectionBox title={t('Open Cluster Management')}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {cards.map(card => (
          <Link key={`${card.label}-${card.routeName}`} routeName={card.routeName}>
            <div
              style={{ ...boxStyle, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ fontSize: 12, color: colors.muted }}>{card.label}</div>
              <div style={{ fontWeight: 700 }}>{card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
        <div style={boxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('Non-compliant Policy Insights')}</div>
          {nonCompliantPolicies.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.muted }}>{t('No non-compliant policies detected.')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {nonCompliantPolicies.map(row => (
                <div key={`${row.namespace}/${row.name}`} style={{ fontSize: 12 }}>
                  <div>
                    <strong>{row.namespace}/{row.name}</strong>{' '}
                    <span style={{ color: colors.negative }}>{t('{{ count }} clusters', { count: row.clusters })}</span>
                  </div>
                  <div style={{ color: colors.body }}>{row.reason}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName={RouteNames.policies}>{t('Open policy list')}</Link>
          </div>
        </div>

        <div style={boxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('Policy Compliance Drilldown')}</div>
          {policyByNamespace.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.muted }}>{t('No policy data available.')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {policyByNamespace.map(row => (
                <div key={row.namespace} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, fontSize: 12 }}>
                  <strong>{row.namespace}</strong>
                  <span style={{ color: colors.positive }}>{t('Compliant')}: {row.compliant}</span>
                  <span style={{ color: colors.negative }}>{t('Non-compliant')}: {row.nonCompliant}</span>
                  <span style={{ color: colors.muted }}>{t('Unknown')}: {row.unknown}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName={RouteNames.policies}>{t('Open policy list')}</Link>
          </div>
        </div>

        <div style={boxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('Cluster Condition Heatmap')}</div>
          {clustersPreview.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.muted }}>{t('No managed clusters detected.')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {clustersPreview.map((cluster: ManagedCluster) => {
                const available = getConditionStatus(cluster, ManagedClusterConditionAvailable);
                const joined = getConditionStatus(cluster, ManagedClusterConditionJoined);
                const accepted = getConditionStatus(cluster, HubAcceptedManagedCluster);
                return (
                  <div key={cluster?.metadata?.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, fontSize: 12 }}>
                    <Link routeName={RouteNames.managedClustersDetail} params={{ name: String(cluster?.metadata?.name || '') }}>
                      <strong>{cluster?.metadata?.name}</strong>
                    </Link>
                    <span style={{ color: statusColor(available, colors) }}>{t('Available')}: {available}</span>
                    <span style={{ color: statusColor(joined, colors) }}>{t('Joined')}: {joined}</span>
                    <span style={{ color: statusColor(accepted, colors) }}>{t('Accepted')}: {accepted}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName={RouteNames.managedClusters}>{t('Open cluster list')}</Link>
          </div>
        </div>

        <div style={boxStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('Placement Resolution Preview')}</div>
          {placementsPreview.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.muted }}>{t('No placements available.')}</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {placementsPreview.map((placement: Placement) => {
                const selectedClusters = getPlacementDecisionNames(placement);
                return (
                  <div key={`${placement?.metadata?.namespace}/${placement?.metadata?.name}`} style={{ fontSize: 12 }}>
                    <div>
                      <strong>{placement?.metadata?.namespace}/{placement?.metadata?.name}</strong>
                    </div>
                    <div style={{ color: colors.body }}>
                      {selectedClusters.length > 0 ? selectedClusters.join(', ') : t('No selected clusters yet')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link routeName={RouteNames.placements}>{t('Open placement list')}</Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: colors.muted }}>
        {t('OCM view for multi-cluster posture: cluster health, governance policy state, placement topology and binding relationships.')}
      </div>
    </SectionBox>
  );
}
