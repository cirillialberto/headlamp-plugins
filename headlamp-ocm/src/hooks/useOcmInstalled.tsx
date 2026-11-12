import { useEffect, useState } from 'react';
import {
  isArgoApiInstalled,
  isClusterApiInstalled,
  isPolicyApiInstalled,
} from '../isOcmInstalled';

export interface UseOcmInstalledResult {
  /** Whether the cluster management CRDs are installed (null while checking). */
  isClusterApiInstalled: boolean | null;
  /** Whether the policy framework CRDs are installed (null while checking). */
  isPolicyApiInstalled: boolean | null;
  /** Whether the Argo ApplicationSet CRD is installed (null while checking). */
  isArgoApiInstalled: boolean | null;
  /** True while the initial API probes are still running. */
  isOcmCheckLoading: boolean;
}

/**
 * React hook that probes the OCM-related API groups once on mount and
 * exposes per-resource availability, so that views can degrade gracefully
 * when a CRD is not installed on the cluster.
 */
export function useOcmInstalled(): UseOcmInstalledResult {
  const [availability, setAvailability] = useState({
    cluster: null as boolean | null,
    policy: null as boolean | null,
    argo: null as boolean | null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [cluster, policy, argo] = await Promise.all([
        isClusterApiInstalled(),
        isPolicyApiInstalled(),
        isArgoApiInstalled(),
      ]);

      if (!cancelled) {
        setAvailability({ cluster, policy, argo });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const { cluster, policy, argo } = availability;

  return {
    isClusterApiInstalled: cluster,
    isPolicyApiInstalled: policy,
    isArgoApiInstalled: argo,
    isOcmCheckLoading: cluster === null || policy === null || argo === null,
  };
}
