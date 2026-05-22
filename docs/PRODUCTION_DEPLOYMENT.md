**Architecture Overview**

- Stateless backend replicas (Node.js + Socket.IO) behind an NGINX load balancer.
- Redis as single source of truth (state, timers, pub/sub, queues).
- Prometheus scraping backend `/metrics` for observability.
- NGINX configured for WebSocket upgrades and sticky sessions via `ip_hash`.

**Scaling Strategy**

- Horizontal scaling: add more `backend` replicas.
- Ensure replicas share Redis and Pub/Sub.
- Timers are stored in Redis sorted set; worker pops due timers atomically.

**Docker Deployment**

- Use `docker-compose.prod.yml` for production-like deployments.
- For Docker Compose v3 on a single host, run:

```bash
# build images
docker-compose -f docker-compose.prod.yml build
# start services (3 backend replicas via scale)
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d
```

- For Docker Swarm, use `docker stack deploy` with `deploy.replicas` set.

**NGINX Setup**

- The provided `nginx/prod.conf` configures `ip_hash` sticky sessions, WebSocket headers and health failover.
- Volume-mount the file into the NGINX container: in the Compose file it's already mounted.

**Redis Setup**

- Run a single Redis instance for dev; use a managed Redis (Redis Cluster or managed provider) for production.
- Ensure low-latency between backend replicas and Redis.
- All Redis keys follow documented patterns in `docs/DISTRIBUTED_SYSTEMS.md`.

**WebSocket Scaling & Sticky Sessions**

- Use `ip_hash` for simple sticky sessions. For cloud deployments, prefer load balancer cookie-based sticky sessions or use socket.io adapter with an external message broker.
- `@socket.io/redis-adapter` is used to replicate socket.io rooms across replicas.

**Autoscaling Strategy**

- Autoscale based on CPU, memory, queue length and connection counts. Use metrics exported to Prometheus and configure Horizontal Pod Autoscaler (Kubernetes) or cloud autoscaling groups.

**Environment Variables**

- `NODE_ENV=production`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASS`
- `REPLICA_ID` (optional)
- `LOG_LEVEL` (info/debug)
- All production secrets (Firebase, Cloudinary, OAuth) must be injected via environment or secret manager.

**Troubleshooting Guide**

- Check `/health` and `/redis-health` on each replica.
- Inspect logs (Pino JSON) and metrics `/metrics`.
- Use `scripts/validate_startup.js` to run basic health checks against local deployment.

**Validation & Tests**

- Use `scripts/integration_test.js` to run a basic multi-client sync test.
- For load testing, use `k6` or `wrk` with websocket scripts to simulate clients and reconnect storms.

**Runbook: common issues**

- Duplicate timers: ensure timer worker is running once per cluster or atomic removal succeeds (implemented via MULTI zRem check).
- Duplicate matchmaking: ensure matchmaking uses distributed locks (`lockService.withLock`).
- Stale users: `user:<username>:room` entries have TTL; sweeper removes empty rooms.

**Further recommendations**

- Add Prometheus alerts for high Redis latency, high queue sizes, and many reconnects.
- Use structured log aggregation (ELK/Datadog) and correlate by `replica` and request/socket IDs.

