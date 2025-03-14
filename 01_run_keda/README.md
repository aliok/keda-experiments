```shell
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace
```

```shell
cat <<EOF | k apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metrics-generator
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: metrics-generator
  template:
    metadata:
      labels:
        app: metrics-generator
    spec:
      containers:
        - name: metrics-generator
          image: aliok/metrics-generator
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: metrics-generator
  namespace: default
  # critical
  labels:
    app: metrics-generator
spec:
  selector:
    app: metrics-generator
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 3000
EOF
```


```shell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus-operator prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
```

```shell
cat <<EOF | k apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: metrics-generator-monitor
  namespace: monitoring
  # critical
  labels:
    release: prometheus-operator
spec:
  selector:
    # critical
    matchLabels:
      app: metrics-generator
  namespaceSelector:
    matchNames:
      - default
  endpoints:
    - port: "http"
      scheme: http
      path: "/metrics"
      interval: 15s
EOF
```

```shell
kubectl port-forward svc/prometheus-operated -n monitoring 9090:9090
```

Generate some load
```shell
kubectl run --namespace monitoring load-generator --rm -it --image=busybox -- /bin/sh -c "while true; do wget -q -O- http://metrics-generator.default.svc.cluster.local; sleep 0.1; done"
```

```shell
# curl -g 'http://localhost:9090/api/v1/query?query=http_requests_total{namespace="default", service="metrics-generator"}'
curl -g 'http://localhost:9090/api/v1/query?query=http_requests_total%7Bnamespace%3D%22default%22%2C%20service%3D%22metrics-generator%22%7D'
# curl -g 'http://localhost:9090/api/v1/query?query=sum(rate(http_requests_total{namespace="default", service="metrics-generator"}[2m]))'
curl -g 'http://localhost:9090/api/v1/query?query=sum%28rate%28http_requests_total%7Bnamespace%3D%22default%22%2C%20service%3D%22metrics-generator%22%7D%5B2m%5D%29%29'
```

```shell
cat <<EOF | k apply -f -
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: metrics-generator-scaledobject
  namespace: default
spec:
  scaleTargetRef:
    name: metrics-generator
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus-operated.monitoring.svc.cluster.local:9090
      metricName: http_requests_total
      threshold: "5"
      query: sum(rate(http_requests_total[2m]))
EOF
```

Generate more load
```shell
kubectl run --namespace monitoring load-generator --rm -it --image=busybox -- /bin/sh -c "while true; do wget -q -O- http://metrics-generator.default.svc.cluster.local; sleep 0.05; done"
```

Insert virtual load
```shell
kubectl port-forward svc/metrics-generator 3000:80
curl 'localhost:3000/increase?value=10000'
```

Should scale up to 10 pods, like after a minute.
After a while, it should scale down to 1 pod.
