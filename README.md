# Headlamp Plugins

Repository di plugin Headlamp per scenari multi-cluster Kubernetes.

Contiene due plugin:

1. `headlamp-ocm`: focus su Open Cluster Management (ACM/OCM) e governance.
2. `headlamp-olm`: focus su Operator Lifecycle Manager (OLM) e operatori.

## Quick Start — Creare e pubblicare una nuova versione

```bash
# 1. Build plugin (genera dist/main.js)
cd headlamp-ocm && npm install && npm run build && cd ..
cd headlamp-olm && npm install && npm run build && cd ..

# 2. Creare directory versione (esempio: 1.0.3)
cp -R headlamp-ocm/1.0.2 headlamp-ocm/1.0.3
cp -R headlamp-olm/1.0.2 headlamp-olm/1.0.3

# 3. Build tarball (vedere sezione "Rilascio di una nuova versione" per script completo)
# Nota: main.js deve essere DENTRO il tarball a livello plugin-name/

# 4. Calcolare checksum, aggiornare artifacthub-pkg.yml, commit e push

# 5. Creare release GitHub
gh release create plugins-v1.0.3 \
  headlamp-ocm/1.0.3/headlamp-ocm-1.0.3.tar.gz \
  headlamp-olm/1.0.3/headlamp-olm-1.0.3.tar.gz \
  --repo cirillialberto/headlamp-plugins

# 6. Aggiornare cluster config (values.yaml) e push

# ⏳ Artifact Hub indicizza in ~30 minuti
```

Vedere [Rilascio di una nuova versione](#rilascio-di-una-nuova-versione) per dettagli completi.

## Obiettivo

Offrire viste operative in Headlamp per:

1. osservabilita e gestione multi-cluster;
2. stato di policy e placement OCM;
3. salute del ciclo di vita degli operatori OLM.

## Struttura repository

```text
headlamp-plugins/
├── artifacthub-repo.yml
├── README.md
├── headlamp-ocm/
│   ├── src/                          # Codice sorgente TypeScript
│   ├── dist/                         # Build output (main.js)
│   ├── package.json
│   ├── 1.0.2/
│   │   ├── artifacthub-pkg.yml       # Metadati Artifact Hub
│   │   ├── README.md
│   │   └── headlamp-ocm-1.0.2.tar.gz # Tarball per release
│   ├── 1.0.3/
│   │   ├── artifacthub-pkg.yml
│   │   ├── README.md
│   │   └── headlamp-ocm-1.0.3.tar.gz
│   ├── 1.0.4/
│   │   ├── artifacthub-pkg.yml
│   │   ├── README.md
│   │   └── headlamp-ocm-1.0.4.tar.gz
│   └── Dockerfile
└── headlamp-olm/
    ├── src/
    ├── dist/
    ├── package.json
    ├── 1.0.2/
    │   ├── artifacthub-pkg.yml
    │   ├── README.md
    │   └── headlamp-olm-1.0.2.tar.gz
    ├── 1.0.3/
    │   ├── artifacthub-pkg.yml
    │   ├── README.md
    │   └── headlamp-olm-1.0.3.tar.gz
    ├── 1.0.4/
    │   ├── artifacthub-pkg.yml
    │   ├── README.md
    │   └── headlamp-olm-1.0.4.tar.gz
    └── Dockerfile
```

**⚠️ Importante**: `main.js` **NON** si trova direttamente in `1.0.Z/` — è **COMPRESSO DENTRO il tarball**.

Quando estrai il tarball con `tar -tzf headlamp-ocm-1.0.3.tar.gz`, vedi:
```
headlamp-ocm/
headlamp-ocm/main.js      ← il file è qui, dentro il tarball
headlamp-ocm/package.json ← il file è qui, dentro il tarball
```

Verifica con:
```bash
tar -tzf headlamp-ocm/1.0.3/headlamp-ocm-1.0.3.tar.gz
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

## Rilascio di una nuova versione

### 1. Build e creazione del tarball

Assicurati di essere nella radice del repository:

```bash
cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins
```

Per ogni plugin (OCM e OLM), esegui:

```bash
# Build del plugin (genera dist/main.js)
cd headlamp-ocm  # o headlamp-olm
npm install
npm run build

# Torna alla radice
cd ..
```

### 2. Creare la directory della versione

Assumendo di creare versione `X.Y.Z` (esempio: `1.0.3`):

```bash
# Copia la versione precedente come template
cp -R headlamp-ocm/1.0.2 headlamp-ocm/1.0.Z

# Stessa cosa per OLM
cp -R headlamp-olm/1.0.2 headlamp-olm/1.0.Z
```

### 3. Costruire i tarball con struttura corretta

**IMPORTANTE**: Il tarball deve contenere `plugin-name/main.js` (non `dist/main.js` direttamente).

```bash
#!/bin/bash
cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins

for plugin in headlamp-ocm headlamp-olm; do
  cd "$plugin/1.0.Z"
  
  # Create temp directory
  tmp=$(mktemp -d)
  mkdir -p "$tmp/$plugin"
  
  # Copy files from the source directory (root of plugin)
  source_dir="/Users/alberto/Progetti/MultiCluster/headlamp-plugins/$plugin"
  cp "$source_dir/package.json" "$tmp/$plugin/"
  
  # Copy main.js from dist to root of plugin in tarball
  if [ -f "$source_dir/dist/main.js" ]; then
    cp "$source_dir/dist/main.js" "$tmp/$plugin/"
  fi
  
  # Create tarball
  tarball="${plugin}-1.0.Z.tar.gz"
  tar -czf "$tarball" -C "$tmp" "$plugin"
  
  # Verify structure
  echo "✓ Created $tarball"
  tar -tzf "$tarball" | head -3
  
  # Cleanup
  rm -rf "$tmp"
  
  cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins
done
```

### 4. Calcolare i checksum SHA256

```bash
cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins/headlamp-ocm/1.0.Z && \
  shasum -a 256 headlamp-ocm-1.0.Z.tar.gz

cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins/headlamp-olm/1.0.Z && \
  shasum -a 256 headlamp-olm-1.0.Z.tar.gz
```

### 5. Aggiornare i metadati Artifact Hub

In `headlamp-ocm/1.0.Z/artifacthub-pkg.yml`:

```yaml
version: 1.0.Z  # <-- aggiorna qui
name: headlamp-ocm
archive-url: https://github.com/cirillialberto/headlamp-plugins/releases/download/plugins-v1.0.Z/headlamp-ocm-1.0.Z.tar.gz  # <-- aggiorna URL
archive-checksum: sha256:<HASH_DA_SOPRA>  # <-- aggiorna checksum
```

Stessa cosa per `headlamp-olm/1.0.Z/artifacthub-pkg.yml`.

Inoltre, aggiorna:
- `homeURL`: cambia `1.0.X` → `1.0.Z` 
- `links[2]` (artifacthub package docs): cambia `1.0.X` → `1.0.Z`

### 6. Commit e push su Git

```bash
cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins

git add headlamp-ocm/1.0.Z headlamp-olm/1.0.Z
git commit -m "Publish Headlamp plugins 1.0.Z"
git push origin main
```

### 7. Creare release su GitHub

```bash
cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins

gh release create plugins-v1.0.Z \
  headlamp-ocm/1.0.Z/headlamp-ocm-1.0.Z.tar.gz \
  headlamp-olm/1.0.Z/headlamp-olm-1.0.Z.tar.gz \
  --repo cirillialberto/headlamp-plugins \
  --title "Headlamp Plugins v1.0.Z" \
  --notes "Release notes here"
```

Verifica i digest GitHub rispetto ai checksum nei metadati:

```bash
gh release view plugins-v1.0.Z \
  --repo cirillialberto/headlamp-plugins \
  --json assets \
  --jq '.assets[] | {name: .name, digest: .digest}'
```

### 8. Aggiornare il cluster per usare la nuova versione

Nel file `ocm-policy-per-cluster/clusters/local-cluster/applications/headlamp/values.yaml`:

```yaml
pluginsManager:
  configContent: |
    plugins:
      - name: headlamp-ocm
        source: https://artifacthub.io/packages/headlamp/cirillialberto-headlamp-plugins/headlamp-ocm
        version: 1.0.Z  # <-- aggiorna qui
      - name: headlamp-olm
        source: https://artifacthub.io/packages/headlamp/cirillialberto-headlamp-plugins/headlamp-olm
        version: 1.0.Z  # <-- aggiorna qui
```

Commit e push:

```bash
cd /Users/alberto/Progetti/MultiCluster/ocm-policy-per-cluster

git add clusters/local-cluster/applications/headlamp/values.yaml
git commit -m "Point Headlamp to plugin version 1.0.Z"
git push origin main
```

ArgoCD sincronizzerà automaticamente il cluster.

---

## Build locale con Docker

Per testare un plugin localmente usando il Dockerfile:

```bash
cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins/headlamp-ocm

# Build l'immagine
docker build -t headlamp-ocm-plugin:latest .

# Verifica che funziona
docker run --rm -v /tmp/plugins:/target headlamp-ocm-plugin:latest

# Il plugin è ora in /tmp/plugins/headlamp-ocm/
ls -la /tmp/plugins/headlamp-ocm/
# Dovrebbe mostrare: main.js, package.json
```

Stesso procedimento per OLM:

```bash
cd /Users/alberto/Progetti/MultiCluster/headlamp-plugins/headlamp-olm
docker build -t headlamp-olm-plugin:latest .
docker run --rm -v /tmp/plugins:/target headlamp-olm-plugin:latest
```

Per push a registry privato (e usare come initContainer in K8s):

```bash
# Build e tag per registry
docker build -t registry.k8s.lan/k3slab/multi-cluster/headlamp-ocm:1.0.3 .

# Push
docker push registry.k8s.lan/k3slab/multi-cluster/headlamp-ocm:1.0.3
```

Il Dockerfile:
1. Copia `dist/main.js` e `package.json` nella radice del plugin (`/plugins/headlamp-ocm/`)
2. Al run, copia tutto verso `/target/` (utilizzabile come `initContainer` in K8s)
3. **Nota**: I Dockerfile rimangono corretti e non necessitano aggiornamenti per nuove versioni plugin

---

## Sviluppo

Script utili (in ogni plugin):

- `npm run start`: sviluppo locale con HMR
- `npm run build`: build produzione (genera `dist/main.js`)
- `npm run lint`: lint del codice
- `npm run test`: test

## Note

- **Tarball structure**: Il tarball deve avere `plugin-name/main.js` e `plugin-name/package.json` alla radice (non dentro subdirectory ulteriori).
- **Artifact Hub sync**: Impiega ~30 minuti per re-indexare nuove versioni. Per forzare, crea sempre una versione **nuova** (non ripubblicare la stessa versione).
- **Checksum match**: I checksum in `artifacthub-pkg.yml` devono corrispondere esattamente ai digest dei GitHub releases.
