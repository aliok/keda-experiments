```shell

helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace

# helm uninstall http-add-on kedacore/keda-add-ons-http --namespace keda
helm install http-add-on kedacore/keda-add-ons-http --namespace keda --set scaler.replicas=1 --set interceptor.replicas.min=1 --set interceptor.replicas.min=1
```

```shell
telepresence quit
# telepresence helm install
telepresence helm install --set agent.securityContext.privileged=true
telepresence connect -n keda
telepresence list

# telepresence intercept keda-add-ons-http-interceptor --port 8080:8080 --env-file keda-add-ons-http-interceptor.env --mount /tmp/keda-add-ons-http-interceptor-mounts
# telepresence intercept keda-add-ons-http-interceptor    --port 8080:8080 --port 9090:9090 --env-file keda-add-ons-http-interceptor.env     --mount /tmp/keda-add-ons-http-interceptor-mounts
# telepresence intercept keda-add-ons-http-external-scaler                 --port 9091:9090 --env-file keda-add-ons-http-external-scaler.env --mount /tmp/keda-add-ons-http-external-scaler-mounts

telepresence replace keda-add-ons-http-interceptor --container=keda-add-ons-http-interceptor --port 8080:8080 --port 9090:9090 --env-file keda-add-ons-http-interceptor.env     --mount /tmp/keda-add-ons-http-interceptor-mounts
telepresence replace keda-add-ons-http-external-scaler  --container=keda-add-ons-http-external-scaler --port 9091:9090 --env-file keda-add-ons-http-external-scaler.env --mount /tmp/keda-add-ons-http-external-scaler-mounts

telepresence leave keda-add-ons-http-external-scaler
telepresence leave keda-add-ons-http-interceptor


```