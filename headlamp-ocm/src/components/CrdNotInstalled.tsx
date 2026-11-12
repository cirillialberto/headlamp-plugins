import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';

/**
 * Friendly empty state shown in a view when the required CRDs
 * (API group) are not installed on the current cluster.
 */
export function CrdNotInstalled({
  apiGroup,
  resourceLabel,
}: {
  apiGroup: string;
  resourceLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <EmptyContent>
      {t(
        'The {{ apiGroup }} API is not available on this cluster. {{ resourceLabel }} cannot be listed until the corresponding CRDs are installed.',
        { apiGroup, resourceLabel }
      )}
    </EmptyContent>
  );
}
