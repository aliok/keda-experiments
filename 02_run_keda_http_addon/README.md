```shell
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace

helm install http-add-on kedacore/keda-add-ons-http --namespace keda
# helm install http-add-on kedacore/keda-add-ons-http --namespace keda --set images.tag=canary
```

```shell
cat <<EOF | k apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: request-logger
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: request-logger
  template:
    metadata:
      labels:
        app: request-logger
    spec:
      containers:
        - name: request-logger
          image: aliok/request-logger
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
          env:
            # see the defaults: https://github.com/kedacore/http-add-on/blob/214431250a552a3835be9699287cc58b6a62e2bb/interceptor/config/timeouts.go#L18
            - name: SIMULATED_HEADER_LATENCY_MS
              value: "400"
            - name: SIMULATED_BODY_LATENCY_MS
              value: "600"
---
apiVersion: v1
kind: Service
metadata:
  name: request-logger
  namespace: default
  # critical
  labels:
    app: request-logger
spec:
  selector:
    app: request-logger
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 3000
EOF
```

See if things are working:
```shell
kubectl port-forward svc/request-logger 8080:80

curl http://localhost:8080
```

```shell
cat <<EOF | k apply -f -
kind: HTTPScaledObject
apiVersion: http.keda.sh/v1alpha1
metadata:
  name: request-logger
spec:
  hosts:
    - myhost.com
  pathPrefixes:
    - /
  scalingMetric:
    concurrency:
      targetValue: 5
  scaleTargetRef:
    name: request-logger
    kind: Deployment
    apiVersion: apps/v1
    service: request-logger
    port: 80
  replicas:
    min: 0
    max: 10
EOF
```

```shell
kubectl port-forward svc/keda-add-ons-http-interceptor-proxy -n keda 8080:8080
# curl with host header
curl -H "Host: myhost.com" http://localhost:8080
```

```shell
# Run lots of requests
ab -c 200 -n 1000 -H "Host: myhost.com" http://localhost:8080/
```

Cleanup:
```shell
k delete httpscaledobject request-logger
k delete service request-logger
k delete deployment request-logger
```
