# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying MySoulmate to a production cluster.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- NGINX Ingress Controller installed
- cert-manager installed (for SSL certificates)
- Storage class configured

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create Secrets

**IMPORTANT:** Do NOT use the template secrets file in production!

```bash
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Create secrets
kubectl create secret generic mysoulmate-secrets \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  --from-literal=DB_PASSWORD="$DB_PASSWORD" \
  --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
  --from-literal=OPENAI_API_KEY="your_openai_key" \
  --from-literal=SENTRY_DSN="your_sentry_dsn" \
  --from-literal=SENDGRID_API_KEY="your_sendgrid_key" \
  --from-literal=MIXPANEL_TOKEN="your_mixpanel_token" \
  --from-literal=GA_MEASUREMENT_ID="your_ga_id" \
  --from-literal=GA_API_SECRET="your_ga_secret" \
  --from-literal=STRIPE_SECRET_KEY="your_stripe_key" \
  --from-literal=STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret" \
  --namespace=mysoulmate
```

### 3. Create ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

### 4. Deploy Database (PostgreSQL)

```bash
kubectl apply -f k8s/postgres.yaml
```

Wait for PostgreSQL to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n mysoulmate --timeout=300s
```

### 5. Deploy Cache (Redis)

```bash
kubectl apply -f k8s/redis.yaml
```

Wait for Redis to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=redis -n mysoulmate --timeout=120s
```

### 6. Deploy API

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 7. Setup Ingress

```bash
kubectl apply -f k8s/ingress.yaml
```

### 8. Enable Auto-scaling

```bash
kubectl apply -f k8s/hpa.yaml
```

## Deployment Order

Always deploy in this order:
1. Namespace
2. Secrets & ConfigMap
3. PostgreSQL
4. Redis
5. API Deployment
6. Services
7. Ingress
8. HPA

## Verification

### Check All Resources

```bash
kubectl get all -n mysoulmate
```

### Check Pods

```bash
kubectl get pods -n mysoulmate
```

### Check Services

```bash
kubectl get svc -n mysoulmate
```

### Check Ingress

```bash
kubectl get ingress -n mysoulmate
```

### View Logs

```bash
# API logs
kubectl logs -f deployment/mysoulmate-api -n mysoulmate

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n mysoulmate

# Redis logs
kubectl logs -f deployment/redis -n mysoulmate
```

### Check Health

```bash
# Port-forward to test locally
kubectl port-forward svc/mysoulmate-api 3000:3000 -n mysoulmate

# Check health endpoint
curl http://localhost:3000/health
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment mysoulmate-api --replicas=5 -n mysoulmate
```

### Auto-scaling Status

```bash
kubectl get hpa -n mysoulmate
kubectl describe hpa mysoulmate-api-hpa -n mysoulmate
```

## Database Migrations

Run migrations as a Kubernetes Job:

```bash
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: mysoulmate
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: mysoulmate/api:latest
        command: ["npm", "run", "db:migrate"]
        envFrom:
        - configMapRef:
            name: mysoulmate-config
        - secretRef:
            name: mysoulmate-secrets
      restartPolicy: OnFailure
EOF
```

## Monitoring

### Metrics

```bash
# CPU and Memory usage
kubectl top pods -n mysoulmate
kubectl top nodes
```

### Events

```bash
kubectl get events -n mysoulmate --sort-by='.lastTimestamp'
```

### Describe Resources

```bash
kubectl describe deployment mysoulmate-api -n mysoulmate
kubectl describe pod <pod-name> -n mysoulmate
```

## Troubleshooting

### Pod Won't Start

```bash
kubectl describe pod <pod-name> -n mysoulmate
kubectl logs <pod-name> -n mysoulmate --previous
```

### Database Connection Issues

```bash
# Test database connection
kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -n mysoulmate -- \
  psql -h postgres-service -U mysoulmate -d mysoulmate
```

### Redis Connection Issues

```bash
# Test Redis connection
kubectl run -it --rm debug --image=redis:7-alpine --restart=Never -n mysoulmate -- \
  redis-cli -h redis-service -a YOUR_REDIS_PASSWORD ping
```

### Rolling Back

```bash
# View rollout history
kubectl rollout history deployment/mysoulmate-api -n mysoulmate

# Rollback to previous version
kubectl rollout undo deployment/mysoulmate-api -n mysoulmate

# Rollback to specific revision
kubectl rollout undo deployment/mysoulmate-api --to-revision=2 -n mysoulmate
```

## Updates & Rollouts

### Update Image

```bash
kubectl set image deployment/mysoulmate-api \
  api=mysoulmate/api:v2.1.0 \
  -n mysoulmate
```

### Check Rollout Status

```bash
kubectl rollout status deployment/mysoulmate-api -n mysoulmate
```

### Pause/Resume Rollout

```bash
kubectl rollout pause deployment/mysoulmate-api -n mysoulmate
kubectl rollout resume deployment/mysoulmate-api -n mysoulmate
```

## Backup & Restore

### Backup PostgreSQL

```bash
kubectl exec -it statefulset/postgres -n mysoulmate -- \
  pg_dump -U mysoulmate mysoulmate > backup-$(date +%Y%m%d).sql
```

### Restore PostgreSQL

```bash
kubectl exec -i statefulset/postgres -n mysoulmate -- \
  psql -U mysoulmate mysoulmate < backup-20250114.sql
```

## Security Best Practices

1. **Never commit secrets to git** - Use Kubernetes secrets or external secret managers
2. **Use RBAC** - Implement role-based access control
3. **Network Policies** - Restrict pod-to-pod communication
4. **Pod Security Policies** - Enforce security standards
5. **Regular Updates** - Keep images and dependencies updated
6. **Audit Logging** - Enable Kubernetes audit logs
7. **Resource Limits** - Always set resource requests and limits
8. **TLS Everywhere** - Use TLS for all communications

## Production Checklist

- [ ] Secrets properly configured
- [ ] Resource limits set
- [ ] Health checks configured
- [ ] Auto-scaling enabled
- [ ] Ingress with TLS configured
- [ ] Monitoring and alerting setup
- [ ] Backup strategy in place
- [ ] Database migrations tested
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] RBAC configured
- [ ] Network policies applied
- [ ] Pod security policies enforced
- [ ] Logging centralized

## Multi-Region Deployment

For high availability across regions:

1. Deploy to multiple clusters in different regions
2. Use external database service (RDS, Cloud SQL, etc.)
3. Use external Redis service (ElastiCache, MemoryStore, etc.)
4. Configure global load balancer
5. Implement database replication
6. Use CDN for static assets

## Cost Optimization

1. **Right-size resources** - Adjust requests/limits based on actual usage
2. **Use node autoscaling** - Scale nodes based on demand
3. **Spot instances** - Use for non-critical workloads
4. **Resource quotas** - Prevent runaway resource usage
5. **Scheduled scaling** - Scale down during low-traffic periods

## Support

For issues or questions:
- Check logs: `kubectl logs -f deployment/mysoulmate-api -n mysoulmate`
- Review events: `kubectl get events -n mysoulmate`
- Contact DevOps team: devops@mysoulmate.app
