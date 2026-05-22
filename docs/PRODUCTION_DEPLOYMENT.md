**Architecture Overview**

- Stateless backend replicas (Node.js + Socket.IO) behind an NGINX load balancer.
- Redis as the single source of truth for shared room state and Pub/Sub for cross-instance synchronization.
- Socket.IO Redis adapter is used to replicate socket.io rooms across replicas.

**Goals**

- Horizontal scale the backend (2-3 replicas) behind NGINX.
- Keep the implementation minimal: only Redis-backed state, Pub/Sub, and Socket.IO adapter.
- Use sticky sessions (NGINX `ip_hash`) so reconnecting clients return to the same backend instance when possible.

**Quick start (local, dev)**

1. Create a production env file at the repo root called `.env.prod` with Redis settings (see `.env.example`).

2. Start with Docker Compose:

```bash
# build images
docker-compose -f docker-compose.prod.yml build
# start services with 3 backend replicas
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d
```

3. Verify Redis health endpoint:

```bash
curl http://localhost:5000/redis-health
```

**Files of interest**

- `backend/server.js` — main server: Redis init, Pub/Sub, Socket.IO adapter attach, HTTP+socket handlers.
- `backend/services/redis.js` — Redis client helper and connection URL logic.
- `backend/services/pubsub.js` — thin wrapper around Redis Pub/Sub used to broadcast application events.
- `backend/services/roomService.js` — authoritative room state stored in Redis.
- `nginx/prod.conf` — NGINX configuration using `ip_hash` for sticky sessions and websocket proxying.
- `docker-compose.prod.yml` — minimal compose file with `redis`, `backend`, and `nginx` services.

**Notes & troubleshooting**

- Ensure `.env.prod` points `REDIS_HOST` to the `redis` service (or use `REDIS_URL` for managed providers).
- Remove any secrets from source; use your orchestrator or Docker secrets to inject private keys.
- This simplified repo intentionally removes observability, metrics, distributed locks, sweepers, and other operational tooling to keep the core architecture minimal and focused.

If you want, I can also replace this file with a small `README.md` at the repo root. 

