# Headlamp Plugins

Repository di plugin Headlamp per scenari multi-cluster Kubernetes.

Contiene due plugin:

1. `headlamp-ocm`: focus su Open Cluster Management (ACM/OCM) e governance.
2. `headlamp-olm`: focus su Operator Lifecycle Manager (OLM) e operatori.

## Obiettivo

Offrire viste operative in Headlamp per:

1. osservabilita e gestione multi-cluster;
2. stato di policy e placement OCM;
3. salute del ciclo di vita degli operatori OLM.

## Struttura repository

```text
headlamp-plugins/
├── artifacthub-repo.yml
├── headlamp-ocm/
│   ├── 1.0.2/
│   │   ├── artifacthub-pkg.yml
│   │   ├── README.md
│   │   └── dist/
│   ├── src/
│   └── package.json
└── headlamp-olm/
	├── 1.0.2/
	│   ├── artifacthub-pkg.yml
	│   ├── README.md
	│   └── dist/
	├── src/
	└── package.json
```

## Requisiti

1. Node.js 18+
2. npm 9+
3. Headlamp compatibile con plugin bundle (`main.js`)
4. Cluster con CRD OCM e/o OLM installate, in base al plugin

## Build locale

```bash
cd headlamp-ocm
npm install
npm run build

cd ../headlamp-olm
npm install
npm run build
```

Ogni build produce `dist/main.js`.

## Rilascio su Artifact Hub (Headlamp plugins)

Per ogni plugin/versione:

1. aggiornare metadata in `artifacthub-pkg.yml`;
2. aggiornare README della versione;
3. includere `dist/` compilato nella cartella versione;
4. commit e push su `main`.

Artifact Hub indicizza i package dal repository Git (non da immagini Docker).

## Sviluppo

Script utili (in ogni plugin):

1. `npm run start`: sviluppo locale
2. `npm run build`: build produzione
3. `npm run lint`: lint
4. `npm run test`: test

## Note

I Dockerfile presenti nei plugin sono opzionali per workflow interni e non sono richiesti per la pubblicazione Artifact Hub di tipo Headlamp plugin.
