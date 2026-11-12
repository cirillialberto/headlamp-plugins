/**
 * Minimal YAML serializer used to display `spec`/`status` blocks.
 */

export function yamlEscapeString(value: string): string {
  if (value === '') return "''";
  const needsQuote = /[:#\-\{\}\[\],&*!?|>'"%@`\n\r\t]|^\s|\s$|^(true|false|null|~|yes|no|on|off)$/i.test(value);
  if (!needsQuote) return value;
  return `'${value.replace(/'/g, "''")}'`;
}

export function toYaml(value: any, indent = 0): string {
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
