# Headlamp OCM Plugin

Plugin Headlamp per Open Cluster Management (OCM/ACM) orientato a posture multi-cluster e governance.

## Cosa fa

Il plugin aggiunge dashboard, route e liste dedicate a risorse OCM/policy:

1. ManagedClusters
2. ManagedClusterSets
3. Placements
4. PlacementBindings
5. Policies
6. PolicySets
7. Argo CD ApplicationSets

Include inoltre viste di sintesi per:

1. compliance policy per namespace;
2. evidenza policy non-compliant e motivazioni;
3. relazioni placement -> cluster target;
4. dettagli risorsa con blocchi YAML `spec` e `status`.

## Requisiti cluster

CRD attese:

1. `cluster.open-cluster-management.io/*`
2. `policy.open-cluster-management.io/*`
3. opzionale `argoproj.io/applicationsets`

Senza queste CRD, le liste relative risulteranno vuote o con errori API.

## Sviluppo locale

```bash
npm install
npm run start
```

## Build

```bash
npm run build
```

Output principale:

1. `dist/main.js`

## Packaging Artifact Hub

Per la pubblicazione Artifact Hub (tipo Headlamp plugin) usa i file in:

1. `1.0.1/artifacthub-pkg.yml`
2. `1.0.1/README.md`
3. `1.0.1/dist/main.js`

## Script disponibili

1. `npm run start`
2. `npm run build`
3. `npm run lint`
4. `npm run lint-fix`
5. `npm run test`
6. `npm run package`

## Riferimenti

1. Headlamp plugin development: https://headlamp.dev/docs/latest/development/plugins/
2. Headlamp API reference: https://headlamp.dev/docs/latest/development/api/
