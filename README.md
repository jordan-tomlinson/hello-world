pre-requisites
kubectl
minikube
helm

minikube start --driver=docker

kubectl config use-context minikube 

kubectl get nodes

minikube addons enable ingress

kubectl create namespace argocd

- install argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

- port forward to access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
then open https://localhost:8080

- Get the ArgoCD password
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d && echo
