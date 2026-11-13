import type {
  PlacementBindingJson,
  PlacementJson,
  PolicyJson,
} from '../types/ocm';
import type { GraphKubeObject } from './ocmGraph';

/**
 * Pure helpers resolving the "who references whom" relationships between
 * Policies, Placements and PlacementBindings. Used by the details views for
 * cross-navigation and by the policy/cluster matrix.
 */

/** A `namespace`/`name` reference (namespace optional for cluster-scoped objects). */
export interface NameRef {
  name?: string;
  namespace?: string;
}

type List<T> = T[] | null | undefined;

/**
 * Bindings whose `subjects` include the given Policy
 * (kind `Policy`, matching name and defaulting to the binding's namespace).
 */
export function bindingsReferencingPolicy(
  policyRef: NameRef,
  bindings: List<GraphKubeObject<PlacementBindingJson>>
): GraphKubeObject<PlacementBindingJson>[] {
  const result: GraphKubeObject<PlacementBindingJson>[] = [];
  for (const binding of bindings || []) {
    const bindingNamespace = binding?.metadata?.namespace;
    const matches = (binding?.jsonData?.subjects || []).some(subject => {
      if (subject?.kind !== 'Policy') return false;
      const subjectNamespace = subject?.namespace || bindingNamespace;
      return subject?.name === policyRef.name && (!policyRef.namespace || subjectNamespace === policyRef.namespace);
    });
    if (matches) result.push(binding);
  }
  return result;
}

/**
 * Bindings whose `placementRef` points at the given Placement
 * (matching name and defaulting to the binding's namespace).
 */
export function bindingsReferencingPlacement(
  placementRef: NameRef,
  bindings: List<GraphKubeObject<PlacementBindingJson>>
): GraphKubeObject<PlacementBindingJson>[] {
  const result: GraphKubeObject<PlacementBindingJson>[] = [];
  for (const binding of bindings || []) {
    const refNamespace = binding?.jsonData?.placementRef?.namespace || binding?.metadata?.namespace;
    if (binding?.jsonData?.placementRef?.name === placementRef.name && (!placementRef.namespace || refNamespace === placementRef.namespace)) {
      result.push(binding);
    }
  }
  return result;
}

/**
 * Placements referenced by a PlacementBinding.
 */
export function placementsForBinding(
  binding: GraphKubeObject<PlacementBindingJson> | null | undefined,
  placements: List<GraphKubeObject<PlacementJson>>
): GraphKubeObject<PlacementJson>[] {
  const name = binding?.jsonData?.placementRef?.name;
  if (!name) return [];
  const namespace = binding?.jsonData?.placementRef?.namespace || binding?.metadata?.namespace;
  return (placements || []).filter(p => {
    const ns = p?.metadata?.namespace;
    return p?.metadata?.name === name && (!namespace || ns === namespace);
  });
}

/**
 * Policies attached to a PlacementBinding as `subjects` with kind `Policy`.
 */
export function policiesForBinding(
  binding: GraphKubeObject<PlacementBindingJson> | null | undefined,
  policies: List<GraphKubeObject<PolicyJson>>
): GraphKubeObject<PolicyJson>[] {
  const subjects = (binding?.jsonData?.subjects || []).filter(s => s?.kind === 'Policy');
  const bindingNamespace = binding?.metadata?.namespace;
  const result: GraphKubeObject<PolicyJson>[] = [];
  for (const subject of subjects) {
    const namespace = subject?.namespace || bindingNamespace;
    const policy = (policies || []).find(p => {
      const ns = p?.metadata?.namespace;
      return p?.metadata?.name === subject?.name && (!namespace || ns === namespace);
    });
    if (policy) result.push(policy);
  }
  return result;
}
