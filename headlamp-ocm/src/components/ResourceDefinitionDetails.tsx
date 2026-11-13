import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useStatusColors } from '../hooks/useStatusColors';
import { toYaml } from '../utils/yaml';
import { YamlSection } from './YamlSection';

export function ResourceDefinitionDetails({
  resourceType,
  name,
  namespace,
  title,
  describe,
}: {
  resourceType: any;
  name: string;
  namespace?: string | null;
  title: string;
  describe?: (item: any) => string;
}) {
  const { t } = useTranslation();
  const colors = useStatusColors();
  const [item, error] = resourceType.useGet(name, namespace);

  if (error) {
    return (
      <SectionBox title={title}>
        <div style={{ color: colors.error, fontSize: 12 }}>
          {t('Failed to load resource: {{ error }}', { error: String(error) })}
        </div>
      </SectionBox>
    );
  }

  if (!item) {
    return (
      <SectionBox title={title}>
        <div style={{ fontSize: 12, color: colors.muted }}>{t('Loading resource definition...')}</div>
      </SectionBox>
    );
  }

  const obj = item?.jsonData || {};
  const description = describe ? describe(item) : '';

  return (
    <SectionBox title={title}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, fontSize: 12 }}>
        <div><strong>{t('Kind')}:</strong> {obj?.kind || '-'}</div>
        <div><strong>{t('API Version')}:</strong> {obj?.apiVersion || '-'}</div>
        <div><strong>{t('Name')}:</strong> {obj?.metadata?.name || '-'}</div>
        <div><strong>{t('Namespace')}:</strong> {obj?.metadata?.namespace || '-'}</div>
        <div><strong>{t('Created')}:</strong> {obj?.metadata?.creationTimestamp || '-'}</div>
        <div><strong>{t('Generation')}:</strong> {String(obj?.metadata?.generation ?? '-')}</div>
      </div>

      {description ? (
        <div style={{ marginTop: 10, fontSize: 12, color: colors.body }}>
          <strong>{t('Description')}:</strong> {description}
        </div>
      ) : null}

      <YamlSection title={t('Spec (YAML)')} data={obj?.spec} />
      <YamlSection title={t('Status (YAML)')} data={obj?.status} />

      <div style={{ marginTop: 12 }}>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{t('Full definition (YAML)')}</summary>
          <pre
            style={{
              marginTop: 8,
              marginBottom: 0,
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
            {toYaml(obj)}
          </pre>
        </details>
      </div>
    </SectionBox>
  );
}
