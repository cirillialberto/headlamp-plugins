/**
 * Typed views of the JSON payloads (the `jsonData` of a KubeObject instance)
 * returned by the API for the resources rendered by the plugin.
 *
 * Every member is optional and each interface ends with an index signature so
 * that any extra field coming from the cluster is preserved without errors.
 */

export interface OcmMetadata {
  name?: string;
  namespace?: string;
  creationTimestamp?: string | null;
  generation?: number;
  [key: string]: any;
}

export interface OcmCondition {
  type?: string;
  status?: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  [key: string]: any;
}

/**
 * Minimal structural type of a KubeObject-like instance: the plugin only
 * reads the raw API payload from `jsonData` (plus `metadata` for search).
 */
export interface ResourceLike<T = Record<string, any>> {
  metadata?: OcmMetadata;
  jsonData?: T | null;
}

export interface ManagedClusterJson {
  kind?: string;
  apiVersion?: string;
  metadata?: OcmMetadata;
  spec?: Record<string, any>;
  status?: {
    conditions?: OcmCondition[];
    vendor?: string;
    version?: {
      gitVersion?: string;
      kubernetes?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ManagedClusterSetJson {
  kind?: string;
  apiVersion?: string;
  metadata?: OcmMetadata;
  spec?: Record<string, any>;
  status?: {
    clusterCount?: number;
    clusters?: string[];
    conditions?: OcmCondition[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PlacementDecision {
  clusterName?: string;
  clusterNamespace?: string;
  placementRef?: {
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PlacementJson {
  kind?: string;
  apiVersion?: string;
  metadata?: OcmMetadata;
  spec?: {
    numberOfClusters?: number;
    numberOfSyncedClusters?: number;
    [key: string]: any;
  };
  status?: {
    numberOfSelectedClusters?: number;
    decisions?: PlacementDecision[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PolicyTemplateObject {
  kind?: string;
  metadata?: {
    name?: string;
    generateName?: string;
    namespace?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PolicyTemplate {
  objectDefinition?: PolicyTemplateObject;
  objectdefinition?: PolicyTemplateObject;
  [key: string]: any;
}

export interface PolicyStatusEntry {
  clusterName?: string;
  complianceState?: string;
  compliant?: string;
  message?: string;
  clauses?: {
    message?: string;
    reason?: string;
    [key: string]: any;
  }[];
  [key: string]: any;
}

export interface PolicyStatusDetail {
  history?: {
    message?: string;
    [key: string]: any;
  }[];
  [key: string]: any;
}

export interface PolicyJson {
  kind?: string;
  apiVersion?: string;
  metadata?: OcmMetadata;
  spec?: {
    remediationAction?: string;
    'policy-templates'?: PolicyTemplate[];
    [key: string]: any;
  };
  status?: {
    compliant?: string;
    status?: PolicyStatusEntry[];
    details?: PolicyStatusDetail[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PolicySetJson {
  kind?: string;
  apiVersion?: string;
  metadata?: OcmMetadata;
  spec?: {
    policies?: {
      name?: string;
      [key: string]: any;
    }[];
    [key: string]: any;
  };
  status?: Record<string, any>;
  [key: string]: any;
}

export interface PlacementBindingJson {
  kind?: string;
  apiVersion?: string;
  metadata?: OcmMetadata;
  placementRef?: {
    name?: string;
    namespace?: string;
    [key: string]: any;
  };
  subjects?: {
    apiGroup?: string;
    kind?: string;
    name?: string;
    [key: string]: any;
  }[];
  status?: Record<string, any>;
  [key: string]: any;
}

export interface ApplicationSetJson {
  kind?: string;
  apiVersion?: string;
  metadata?: OcmMetadata;
  spec?: {
    generators?: Record<string, any>[];
    template?: {
      metadata?: {
        name?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
    [key: string]: any;
  };
  status?: Record<string, any>;
  [key: string]: any;
}
