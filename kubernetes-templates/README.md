# Deploying cvat in a kubernetes cluster

This guide will focus on how to deploy cvat in an kubernetes environment.
It was tested on Kubernetes v1.19.3 but should work for >=v1.9, eventhough it is untested.

## Building the container - optional

Since prebuild container images are now available [cvat_server](https://hub.docker.com/r/openvino/cvat_server) and
[cvat_ui](https://hub.docker.com/r/openvino/cvat_ui) this steps becomes optional.

If you would like to build your one image the following steps need to be followd.

1. Build the cvat backend and frontend images and push them to a registry that you can pull from within the cluster.
1. Replace the `openvino/...` image source in
   `04_cvat_backend_deployment.yml` and `04_cvat_frontend_deployment.yml` with your newly build image.

```bash
export CI_REGISTRY_IMAGE="your.private.registry"

echo "Building backend"
docker build --cache-from $CI_REGISTRY_IMAGE/backend:release-1.1.0 \
  --build-arg TF_ANNOTATION=no --build-arg AUTO_SEGMENTATION=no \
  --build-arg WITH_TESTS=no --build-arg TZ="Etc/UTC" --build-arg OPENVINO_TOOLKIT=no \
  --build-arg USER=django --build-arg DJANGO_CONFIGURATION=production \
  --build-arg TZ="Etc/UTC" .
docker push $CI_REGISTRY_IMAGE/backend:release-1.1.0

echo "Building frontend"
docker build --file Dockerfile.ui \
  --tag $CI_REGISTRY_IMAGE/frontend:release-1.1.0 - .
docker push $CI_REGISTRY_IMAGE/frontend:release-1.1.0
```

## Adjusting the kubernetes templates

1. Replacing the domain dummy with your real domain name `cvat.my.cool.domain.com`.
   Replace `{MY_SERVER_URL_COM}` in `kubernetes-templates/04_cvat_frontend_deployment.yml`
   and `kubernetes-templates/05_cvat_proxy_configmap.yml`.
1. Insert your choosen database password the `kubernetes-templates/02_database_secrets.yml`

## Deploying to the cluster

Deploy everything to your cluster with `kubectl apply -f kubernetes-templates/`

### Expose the deployment

The service `cvat-proxy-service` is the accesspoint to the deployment.
In order to expose this resource an ingress might be handy [kubernetes ingress documentation](https://kubernetes.io/docs/concepts/services-networking/ingress/).

For debugging puposes it is usefull to forward this service to a port on your localhost.
In the following example `8080` will be used for this purpose [localhost:8080](http://localhost:8080).

```bash
kubectl port-forward service/cvat-proxy-service -n cvat 8080:80
```

**Hint:**
If you are developing locally it might be usefull to replace `{MY_SERVER_URL_COM}` with `localhost`,
such that `/etc/hosts` does not need to override the DNS.

## Create the django super user

```
kubectl get pods --namespace cvat
kubectl --namespace cvat exec -it cvat-backend-78c954f84f-qxb8b -- /bin/bash
python3 ~/manage.py createsuperuser
```

## Debugging hints

Due to different kubernetes versions or other deployment environments

### Incorect storage class

Depending on the selected kubernetes environment certain storage classes might not be available.
The selected "standard" class is available with in all maijor kubernetes platforms (GKE, EKS, ...),
but not in some local development environemnts such as miniKube.
This is the case, if `kubectl describe pod -n cvat cvat-backend` shows that the volume claim is pending.
To fix this, `class: standard` needs to be adjusted in `02_cvat_backend_storage.yaml` and `02_database_storage.yml`.

### Creating the django super user fails

Depending on your kuberenets version you creating the super user might not be possible with in one line.
Therefore you need to get bash access within the consol and call the manage script manually.

```bash
kubectl --namespace cvat exec -it cvat-backend-7c954d5cf6-xfdcm bash
python3 ~/manage.py createsuperuser
```

### Running out of storage

By default the backend is reserving 20GB of storage if this is not enough,
you will need to ajust the `02_cvat_backend_storage.yml` persistant volume claim to increase it.
