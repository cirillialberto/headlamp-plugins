import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React, { useMemo } from 'react';
import { CrdNotInstalled } from '../components/CrdNotInstalled';
import { useOcmInstalled } from '../hooks/useOcmInstalled';
import { OcmApiLabels } from '../isOcmInstalled';
import { ManagedCluster } from '../resources/managedCluster';
import { Policy } from '../resources/policy';
import { buildPolicyMatrix, MatrixCellState } from '../utils/policyMatrix';

const CELL_COLORS: Record<MatrixCellState, string> = {
  compliant: '#4CAF50',
  noncompliant: '#F44336',
  pending: '#FF9800',
  none: '#bbb',
};

const LEGEND: { state: MatrixCellState; label: string }[] = [
  { state: 'compliant', label: 'Compliant' },
  { state: 'noncompliant', label: 'Non-compliant' },
  { state: 'pending', label: 'Pending / unknown' },
  { state: 'none', label: 'Not selected' },
];

function cellDot(state: MatrixCellState) {
  return (
    <div
      title={state}
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        margin: '0 auto',
        background: CELL_COLORS[state],
      }}
    />
  );
}

export function PolicyClusterMatrixView() {
  const { isPolicyApiInstalled, isOcmCheckLoading } = useOcmInstalled();
  const [policies] = Policy.useList();
  const [clusters] = ManagedCluster.useList();

  const matrix = useMemo(() => buildPolicyMatrix(policies as any, clusters as any), [policies, clusters]);

  if (isOcmCheckLoading) {
    return (
      <SectionBox title="Policy Matrix">
        <Loader title="Checking Open Cluster Management APIs" />
      </SectionBox>
    );
  }

  if (isPolicyApiInstalled === false) {
    return (
      <SectionBox title="Policy Matrix">
        <CrdNotInstalled apiGroup={OcmApiLabels.policy} resourceLabel="Policies" />
      </SectionBox>
    );
  }

  return (
    <SectionBox title="Policy × Cluster Matrix">
      {matrix.rows.length === 0 ? (
        <EmptyContent>No policies found. Create a Policy to see its compliance across managed clusters.</EmptyContent>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '2px solid #ddd', position: 'sticky', left: 0, background: 'inherit' }}>
                    Policy
                  </th>
                  {matrix.clusterNames.map(clusterName => (
                    <th key={clusterName} style={{ padding: '4px 8px', borderBottom: '2px solid #ddd', minWidth: 40 }}>
                      {clusterName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map(row => (
                  <tr key={`${row.namespace}/${row.name}`}>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                      {row.namespace ? `${row.namespace}/` : ''}
                      {row.name}
                    </td>
                    {matrix.clusterNames.map(clusterName => {
                      const cell = row.cells[clusterName];
                      const reason = cell?.reason && cell.state !== 'none' ? `${clusterName}: ${cell.reason}` : undefined;
                      return (
                        <td key={clusterName} title={reason || undefined} style={{ padding: '4px 8px', borderBottom: '1px solid #eee' }}>
                          {cellDot(cell?.state || 'none')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: 12, color: '#666' }}>
            {LEGEND.map(item => (
              <span key={item.state} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {cellDot(item.state)} {item.label}
              </span>
            ))}
          </div>
        </>
      )}
    </SectionBox>
  );
}
