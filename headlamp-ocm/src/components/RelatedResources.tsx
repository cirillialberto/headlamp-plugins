import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useStatusColors } from '../hooks/useStatusColors';

/** A routable reference to another resource, rendered as a link. */
export interface RelatedRef {
  label: string;
  routeName: string;
  params: Record<string, string>;
  tooltip?: string;
}

/** One row of the related-resources table: a primary link plus secondary links. */
export interface RelatedRow {
  ref: RelatedRef;
  related: RelatedRef[];
}

/**
 * Renders a list of resources that reference (or are referenced by) the
 * current object, with links to their details views.
 */
export function RelatedResourcesSection({
  title,
  rows,
  emptyHint,
}: {
  title: string;
  rows: RelatedRow[];
  emptyHint: string;
}) {
  const colors = useStatusColors();

  return (
    <SectionBox title={title}>
      {rows.length === 0 ? (
        <div style={{ fontSize: 12, color: colors.muted }}>{emptyHint}</div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {rows.map((row, index) => (
            <div
              key={`${row.ref.routeName}-${row.ref.params.namespace || ''}-${row.ref.params.name}-${index}`}
              style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, max-content) 1fr', gap: 8, fontSize: 12, alignItems: 'baseline' }}
            >
              <Link routeName={row.ref.routeName} params={row.ref.params} tooltip={row.ref.tooltip}>
                {row.ref.label}
              </Link>
              {row.related.length > 0 ? (
                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
                  {row.related.map((link, i) => (
                    <Link
                      key={`${link.routeName}-${link.params.namespace || ''}-${link.params.name}-${i}`}
                      routeName={link.routeName}
                      params={link.params}
                      tooltip={link.tooltip}
                    >
                      {link.label}
                    </Link>
                  ))}
                </span>
              ) : (
                <span style={{ color: colors.muted }}>—</span>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionBox>
  );
}
