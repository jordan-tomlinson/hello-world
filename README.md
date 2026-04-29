# hello-world

A simple Node.js HTTP server that responds with `Hello world` to GET requests, deployed to Kubernetes via a GitOps pipeline using Argo CD.

## Overview

- **App**: Node.js HTTP server (`server.js`) — responds `Hello world` on port 3000
- **CI/CD**: GitHub Actions builds and pushes the Docker image to GHCR, then updates the Helm values with the new image tag
- **CD**: Argo CD (app-of-apps pattern) watches the repository and auto-syncs the Helm chart into the cluster
- **Packaging**: Helm chart at `helm/hello-world`

## Architecture

```
GitHub Actions
  └── build & test
  └── push image → ghcr.io/jordan-tomlinson/hello-world:<sha>
  └── commit updated image tag → helm/hello-world/main-values.yaml
        │
        ▼
    Argo CD (app-of-apps)
      └── app-of-apps  →  argo/helm/argocd-app-of-apps
            └── hello-world  →  helm/hello-world
```

## Prerequisites

- [`kubectl`](https://kubernetes.io/docs/tasks/tools/)
- [`helm`](https://helm.sh/docs/intro/install/) (v3+)
- [`minikube`](https://minikube.sigs.k8s.io/docs/start/) — or any Kubernetes cluster

## Local Setup

### 1. Start the cluster

```bash
minikube start --driver=docker
kubectl config use-context minikube
```

Verify the cluster is ready:

```bash
kubectl get nodes
```

### 2. Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for Argo CD to be ready:

```bash
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=120s
```

### 3. Access the Argo CD UI

In a separate terminal, start the port-forward:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open **https://localhost:8080** in your browser (accept the self-signed cert warning).

Retrieve the initial admin password:

```bash
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d && echo
```

Login with username `admin` and the password above.

### 4. Deploy the app-of-apps

Apply the root Argo CD Application — this registers the app-of-apps with Argo CD, which will then automatically create and sync the `hello-world` Application:

```bash
kubectl apply -f argo/main-app-of-apps.yaml
```

Argo CD will:
1. Sync `app-of-apps` → renders the `hello-world` Application from `argo/helm/argocd-app-of-apps`
2. Sync `hello-world` → deploys the app from `helm/hello-world` into the `hello-world` namespace

Monitor sync status:

```bash
kubectl get applications -n argocd
```

## Testing the App

Once the `hello-world` application shows `Synced` and `Healthy`, forward the service port:

```bash
kubectl port-forward svc/hello-world -n hello-world 3000:80
```

In another terminal:

```bash
curl http://localhost:3000
# Expected: Hello world
```

## CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/pipeline.yaml`) runs on every push to `main`:

| Step | Description |
|------|-------------|
| `build` | Runs Node.js tests (`npm test`) |
| `argo-deploy` | Builds and pushes Docker image to GHCR, updates `image.tag` in `helm/hello-world/main-values.yaml`, commits back to `main` |

Argo CD detects the committed tag change and automatically redeploys the app.

## Repository Structure

```
.
├── server.js                          # Application source
├── server.test.js                     # Unit tests
├── dockerfile                         # Container image definition
├── package.json
├── argo/
│   ├── main-app-of-apps.yaml          # Root Argo CD Application (apply this to bootstrap)
│   └── helm/argocd-app-of-apps/       # App-of-apps Helm chart
│       ├── main-values.yaml
│       ├── dev-values.yaml
│       └── stage-values.yaml
├── helm/hello-world/                  # Application Helm chart
│   ├── main-values.yaml
│   ├── dev-values.yaml
│   └── stage-values.yaml
└── .github/workflows/
    └── pipeline.yaml                  # CI/CD pipeline
```

## Sources
- https://medium.com/@vikwaso/gitops-ci-cd-pipeline-with-github-actions-argocd-56628a133bc2
- AI usage:
    - WarpAI Terminal:
        - Configured node.js app
        - assisted with pipeline.yaml
        - provisioned argo/app-of-apps.yaml files
        - documented README.md