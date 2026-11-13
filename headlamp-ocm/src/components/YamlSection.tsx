import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { useStatusColors } from '../hooks/useStatusColors';
import { toYaml } from '../utils/yaml';

export function YamlSection({ title, data }: { title: string; data: any }) {
  const { t } = useTranslation();
  const colors = useStatusColors();

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      {data ? (
        <pre
          style={{
            margin: 0,
            padding: 10,
            border: `1px solid ${colors.divider}`,
            borderRadius: 8,
            background: colors.backgroundAlt,
            fontSize: 12,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {toYaml(data)}
        </pre>
      ) : (
        <div style={{ fontSize: 12, color: colors.muted }}>{t('No data.')}</div>
      )}
    </div>
  );
}
