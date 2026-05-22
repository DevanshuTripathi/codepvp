Simple Redis-backed realtime architecture

Overview

This repository provides a minimal scalable realtime backend using Redis and Socket.IO:

- Redis: central shared state and Pub/Sub synchronization across replicas.
- Socket.IO Redis adapter: replicates socket.io rooms across instances.
- NGINX: load balancer with `ip_hash` sticky sessions for websocket resilience.
- Docker Compose: starts `redis`, multiple `backend` replicas, and `nginx` for local testing.

Quick start

1. Create a `.env.prod` at the repo root with Redis settings (see `.env.example`).
2. Build and run:

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d
```

3. Verify Redis health endpoint:

```bash
curl http://localhost:5000/redis-health
```

Files of interest

- `backend/server.js` — main server: Redis init, Pub/Sub, Socket.IO adapter attach, HTTP+socket handlers.
- `backend/services/redis.js` — Redis client helper and connection URL logic.
- `backend/services/pubsub.js` — thin wrapper around Redis Pub/Sub used to broadcast application events.
- `backend/services/roomService.js` — authoritative room state stored in Redis.
- `nginx/prod.conf` — NGINX configuration using `ip_hash` for sticky sessions and websocket proxying.
- `docker-compose.prod.yml` — minimal compose file with `redis`, `backend`, and `nginx` services.

Design goals

- Keep the implementation simple: only Redis-backed state, Redis Pub/Sub, and Socket.IO adapter.
- No metrics, no distributed locks, no timers or sweepers—these can be added later if needed.

If you'd like, I can also remove additional unused files or further simplify the backend routes to only the socket logic. Let me know which parts to strip next.

