import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React, { useMemo } from 'react';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { useStatusColors } from '../hooks/useStatusColors';
import { OcmApiLabels } from '../isOcmInstalled';
import { ManagedCluster } from '../resources/managedCluster';
import { Policy } from '../resources/policy';
import { buildPolicyMatrix, MatrixCellState } from '../utils/policyMatrix';

function cellDot(state: MatrixCellState, color: string) {
  return (
    <div
      title={state}
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        margin: '0 auto',
        background: color,
      }}
    />
  );
}

export function PolicyClusterMatrixView() {
  const { t } = useTranslation();
  const colors = useStatusColors();
  const { isPolicyApiInstalled, isOcmCheckLoading } = useOcmInstalled();
  const [policies] = Policy.useList();
  const [clusters] = ManagedCluster.useList();

  const matrix = useMemo(() => buildPolicyMatrix(policies as any, clusters as any), [policies, clusters]);

  const cellColors = useMemo(
    () =>
      ({
        compliant: colors.positive,
        noncompliant: colors.negative,
        pending: colors.warning,
        none: colors.muted,
      }) as Record<MatrixCellState, string>,
    [colors]
  );

  const legend: { state: MatrixCellState; label: string }[] = [
    { state: 'compliant', label: t('Compliant') },
    { state: 'noncompliant', label: t('Non-compliant') },
    { state: 'pending', label: t('Pending / unknown') },
    { state: 'none', label: t('Not selected') },
  ];

  if (isOcmCheckLoading) {
    return (
      <SectionBox title={t('Policy Matrix')}>
        <Loader title={t('Checking Open Cluster Management APIs')} />
      </SectionBox>
    );
  }

  if (isPolicyApiInstalled === false) {
    return (
      <SectionBox title={t('Policy Matrix')}>
        <CrdNotInstalled apiGroup={OcmApiLabels.policy} resourceLabel={t('Policies')} />
      </SectionBox>
    );
  }

  return (
    <SectionBox title={t('Policy × Cluster Matrix')}>
      {matrix.rows.length === 0 ? (
        <EmptyContent>{t('No policies found. Create a Policy to see its compliance across managed clusters.')}</EmptyContent>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '4px 8px',
                      borderBottom: `2px solid ${colors.divider}`,
                      position: 'sticky',
                      left: 0,
                      background: 'inherit',
                    }}
                  >
                    {t('Policy')}
                  </th>
                  {matrix.clusterNames.map(clusterName => (
                    <th key={clusterName} style={{ padding: '4px 8px', borderBottom: `2px solid ${colors.divider}`, minWidth: 40 }}>
                      {clusterName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map(row => (
                  <tr key={`${row.namespace}/${row.name}`}>
                    <td style={{ padding: '4px 8px', borderBottom: `1px solid ${colors.divider}`, whiteSpace: 'nowrap' }}>
                      {row.namespace ? `${row.namespace}/` : ''}
                      {row.name}
                    </td>
                    {matrix.clusterNames.map(clusterName => {
                      const cell = row.cells[clusterName];
                      const reason = cell?.reason && cell.state !== 'none' ? `${clusterName}: ${cell.reason}` : undefined;
                      return (
                        <td
                          key={clusterName}
                          title={reason || undefined}
                          style={{ padding: '4px 8px', borderBottom: `1px solid ${colors.divider}` }}
                        >
                          {cellDot(cell?.state || 'none', cellColors[cell?.state || 'none'])}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: 12, color: colors.muted }}>
            {legend.map(item => (
              <span key={item.state} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {cellDot(item.state, cellColors[item.state])} {item.label}
              </span>
            ))}
          </div>
        </>
      )}
    </SectionBox>
  );
}
