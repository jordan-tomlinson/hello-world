pre-requisites
kubectl
minikube

minikube start --driver=docker
kubectl config use-context minikube 
kubectl get nodes
minikube addons enable ingress
