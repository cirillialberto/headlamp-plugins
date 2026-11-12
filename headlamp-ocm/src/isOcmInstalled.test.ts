import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isApiInstalled,
  isArgoApiInstalled,
  isClusterApiInstalled,
  isOcmInstalled,
  isPolicyApiInstalled,
  OcmApiLabels,
  OcmApiPaths,
} from './isOcmInstalled';

const requestMock = vi.hoisted(() => vi.fn());

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: (...args: unknown[]) => requestMock(...args),
  },
}));

describe('isOcmInstalled', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('probes the expected API group/version paths', async () => {
    requestMock.mockResolvedValue({ kind: 'APIVersions' });

    await Promise.all([isClusterApiInstalled(), isPolicyApiInstalled(), isArgoApiInstalled()]);

    expect(requestMock).toHaveBeenNthCalledWith(1, OcmApiPaths.cluster, { method: 'GET' });
    expect(requestMock).toHaveBeenNthCalledWith(2, OcmApiPaths.policy, { method: 'GET' });
    expect(requestMock).toHaveBeenNthCalledWith(3, OcmApiPaths.argo, { method: 'GET' });
  });

  it('returns true when the API group responds', async () => {
    requestMock.mockResolvedValue({ versions: ['v1'] });
    await expect(isApiInstalled(OcmApiPaths.cluster)).resolves.toBe(true);
  });

  it('returns false when the request fails (CRD not installed)', async () => {
    requestMock.mockRejectedValue(new Error('404 Not Found'));
    await expect(isApiInstalled(OcmApiPaths.policy)).resolves.toBe(false);
  });

  it('returns false when the request resolves with a falsy payload', async () => {
    requestMock.mockResolvedValue(null);
    await expect(isApiInstalled(OcmApiPaths.argo)).resolves.toBe(false);
  });

  it('isOcmInstalled is true when any of the APIs is available', async () => {
    requestMock.mockImplementation((apiPath: string) => {
      if (apiPath === OcmApiPaths.policy) {
        return Promise.resolve({ resources: ['policies'] });
      }
      return Promise.reject(new Error('404'));
    });

    await expect(isOcmInstalled()).resolves.toBe(true);
    expect(requestMock).toHaveBeenCalledTimes(3);
  });

  it('isOcmInstalled is false when no API is available', async () => {
    requestMock.mockRejectedValue(new Error('404'));
    await expect(isOcmInstalled()).resolves.toBe(false);
  });

  it('exposes readable labels for each API kind', () => {
    expect(OcmApiLabels.cluster).toBe('cluster.open-cluster-management.io/v1');
    expect(OcmApiLabels.policy).toBe('policy.open-cluster-management.io/v1');
    expect(OcmApiLabels.argo).toBe('argoproj.io/v1alpha1');
  });
});
