import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
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
