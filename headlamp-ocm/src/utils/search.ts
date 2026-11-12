import type { ResourceLike } from '../types/ocm';

/**
 * Builds a search filter for resource tables.
 *
 * Matches the resource name/namespace and, for each `extraPath`, the value at
 * that JSON path inside the raw API payload (e.g. `status.compliant`).
 *
 * The returned function is intentionally compatible with the SDK table
 * `filterFunction` prop, which passes the current search term as second arg.
 */
export function makeSearchFilter(extraPaths: string[] = []) {
  return (item: ResourceLike, search?: string) => {
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
