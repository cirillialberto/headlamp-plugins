import React from 'react';
import { toYaml } from '../utils/yaml';

export function YamlSection({ title, data }: { title: string; data: any }) {
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
