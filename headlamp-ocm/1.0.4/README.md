# Headlamp OCM Plugin

Version `1.0.4` of the Headlamp plugin focused on Open Cluster Management (OCM/ACM) operations.

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
- Resource map view placing policies, bindings and placements together
- Policy × cluster compliance matrix
- Cross-resource navigation from policy/placement details to referencing bindings
- Graceful degradation: missing CRDs show a friendly notice instead of errors
- Dark/light theme support and internationalization (English, Italian)

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

- Headlamp `>= 0.14.0` (plugin bundle `main.js`)
- OCM/ACM CRDs installed in the target cluster (views degrade gracefully when missing)
- RBAC allowing read access to the resources above

## Package contents (1.0.4)

- `headlamp-ocm-1.0.4.tar.gz` (plugin bundle `main.js` + `package.json`)
- `dist/` (compiled bundle and locale catalogs, mirrors the release archive)
- `artifacthub-pkg.yml` (Artifact Hub metadata)
- this README

## Notes

If some CRDs are missing, related views show a "CRDs not installed" notice.
The dashboard summarizes up to the first 100 policies/placement bindings for performance.
Interface language follows the Headlamp locale (English and Italian are bundled).

## Source code

- Repository: https://github.com/cirillialberto/headlamp-plugins
- Plugin folder: https://github.com/cirillialberto/headlamp-plugins/tree/main/headlamp-ocm

## License

Apache-2.0
