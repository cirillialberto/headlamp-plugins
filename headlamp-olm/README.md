# Headlamp OLM Plugin

Plugin Headlamp per Operator Lifecycle Manager (OLM), con focus su stato operatori, aggiornamenti e approvazioni install plan.

## Cosa fa

Il plugin aggiunge viste dedicate a:

1. PackageManifest (catalogo operatori)
2. ClusterServiceVersion (CSV)
3. Subscription
4. CatalogSource
5. InstallPlan

Funzionalita principali:

1. pannello "Operator Intelligence" con health score aggregato;
2. evidenza rapida issue (CSV failed, update disponibili, install plan pendenti);
3. indicatori stato/subscription drift;
4. timeline lifecycle su risorse chiave;
5. azioni operative su subscription (es. patch canale, dove consentito da RBAC).

## Requisiti cluster

CRD attese:

1. `operators.coreos.com/v1alpha1` (CSV, Subscription, CatalogSource, InstallPlan)
2. `packages.operators.coreos.com/v1` (PackageManifest)

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

1. `1.0.2/artifacthub-pkg.yml`
2. `1.0.2/README.md`
3. `1.0.2/dist/main.js`

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
