# Headlamp OLM Plugin

Version `1.0.1` of the Headlamp plugin for Operator Lifecycle Manager (OLM) operations.

## Overview

This plugin adds OLM-focused operational views to Headlamp, helping platform teams monitor operator lifecycle health and rollout status.

## Key capabilities

- Operator Intelligence panel with aggregated health score
- ClusterServiceVersion status overview
- Subscription drift and update visibility
- CatalogSource visibility and diagnostics
- InstallPlan status and pending approval tracking
- Lifecycle timeline for key OLM resources
- Action support on subscriptions (requires proper RBAC)

## Kubernetes resources used

API groups:

- `operators.coreos.com/v1alpha1`
- `packages.operators.coreos.com/v1`

Main resources:

- `clusterserviceversions`
- `subscriptions`
- `catalogsources`
- `installplans`
- `packagemanifests`

## Requirements

- Headlamp version compatible with plugin bundles (`main.js`)
- OLM CRDs installed in the target cluster
- RBAC allowing read access, and patch/update permissions if using actions

## Package contents (1.0.1)

- `dist/main.js` (compiled plugin bundle)
- `artifacthub-pkg.yml` (Artifact Hub metadata)
- this README

## Notes

When OLM components are partially installed, some views can be empty or show API errors.

## Source code

- Repository: https://github.com/cirillialberto/headlamp-plugins
- Plugin folder: https://github.com/cirillialberto/headlamp-plugins/tree/main/headlamp-olm

## License

Apache-2.0
