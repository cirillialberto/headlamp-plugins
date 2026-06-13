# Headlamp OCM Plugin

Version `1.0.1` of the Headlamp plugin focused on Open Cluster Management (OCM/ACM) operations.

## Overview

This plugin extends Headlamp with dedicated views and details for multi-cluster governance and policy posture.

It is designed for teams managing many clusters and OCM governance resources from a single UI.

## Key capabilities

- OCM dashboard with multi-cluster posture summary
- ManagedCluster and ManagedClusterSet views
- Placement and PlacementBinding visibility
- Policy and PolicySet views with compliance drilldown
- Non-compliant policy insights and quick reasoning
- ApplicationSet visibility (Argo CD CRD)
- YAML detail panels for `spec` and `status`

## Kubernetes resources used

Primary API groups:

- `cluster.open-cluster-management.io`
- `policy.open-cluster-management.io`
- `argoproj.io` (for ApplicationSet)

Main resources:

- `managedclusters`
- `managedclustersets`
- `placements`
- `policies`
- `policysets`
- `placementbindings`
- `applicationsets`

## Requirements

- Headlamp version compatible with plugin bundles (`main.js`)
- OCM/ACM CRDs installed in the target cluster
- RBAC allowing read access to the resources above

## Package contents (1.0.1)

- `dist/main.js` (compiled plugin bundle)
- `artifacthub-pkg.yml` (Artifact Hub metadata)
- this README

## Notes

If some CRDs are missing, related views may appear empty or return API errors.

## Source code

- Repository: https://github.com/cirillialberto/headlamp-plugins
- Plugin folder: https://github.com/cirillialberto/headlamp-plugins/tree/main/headlamp-ocm

## License

Apache-2.0
