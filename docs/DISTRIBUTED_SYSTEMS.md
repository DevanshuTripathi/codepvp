Overview

This document summarizes the production hardening and distributed patterns used by the backend.

Key points

- Single source of truth: Redis is used for all ephemeral, shared state (rooms, timers, submissions indices, parties, queues).
- Pub/Sub: Redis Pub/Sub is used to broadcast application-level events across replicas. Messages include a generated `id` and subscribers perform short-lived dedupe using Redis keys.
- Socket replication: @socket.io/redis-adapter is used to replicate socket.io room membership across replicas.
- Distributed timers: A sorted set `timers:zset` stores scheduled timers; a single worker atomically pops due timers and publishes `timerFired` events.
- Distributed locks: `lockService` (SET NX EX with token + Lua release) provides safe critical sections. Used in matchmaking and other critical ops.
- Presence & sweepers: `user:<username>:room` keys use TTL so stale presence expires. A sweeper periodically scans rooms and removes empty/expired rooms.
- Idempotency: Pub/Sub messages include `id` and are de-duplicated by the subscriber using short-lived Redis keys.
- Graceful shutdown: The server stops timer workers, unsubscribes, disconnects Redis and closes the HTTP server on SIGINT/SIGTERM.
- Health & readiness: `/health` and `/redis-health` endpoints exist.

Redis key patterns (examples)

- room:<roomId> — Room metadata (hash)
- room:<roomId>:teamA / teamB — Team member lists (lists)
- room:<roomId>:users — Set of usernames in room
- room:<roomId>:messages — List of JSON chat messages
- room:<roomId>:code — Editor code
- room:<roomId>:cursors — Hash of cursors per user
- timers:zset — Sorted set of scheduled timers (score = epoch ms, value = JSON)
- submission:<id> — Hash for submission metadata
- submission:room:<roomId>:set — Set of submission ids for a room
- matchmaking:queue:<mode> — List queue for matchmaking
- pubsub:seen:<id> — Short-lived key for pubsub dedupe
- user:<username>:room — TTL-backed mapping of a user to a room

Operational guidance

- Run multiple backend replicas behind a load-balancer that supports WebSocket upgrades and sticky sessions (cookie or IP-hash). Example NGINX config is in `nginx/nginx.conf`.
- Run a single timer worker per cluster (or let every replica run the worker but ensure atomic pops via ZREM multi/exec logic). Current implementation atomically removes due items via MULTI and checks results.
- Use `docker-compose` for local multi-replica testing: `docker-compose up --scale backend=3` and an external `redis` container.
- Monitor health endpoints and Redis connectivity. Configure alerts for high Redis latency and failed Pub/Sub reconnects.

Files added/updated

- `backend/services/lockService.js` — safe acquire/release + withLock helper
- `backend/services/sweeper.js` — periodic cleanup of empty/expired rooms
- `backend/services/pubsub.js` — added message id + subscriber-side dedupe
- `backend/services/userService.js` — setUserRoom now writes with TTL
- `backend/services/matchmakingService.js` — switched to `lockService.withLock`
- `backend/sockets/matchmakingHandlers.js` — removed legacy in-memory `createRoom`
- `backend/server.js` — graceful shutdown + start sweeper

Next recommended hardening

- Add metrics (Prometheus) and structured logging (Pino/Winston) across services.
- Add a stronger message dedupe/at-least-once handling for important events (e.g., use Redis Streams for durability)
- Add more Redis key TTLs where appropriate and implement a stronger sweeper for partial cleanup
- Add end-to-end tests that run multi-replica flows: match creation, reconnects, timer firing, and submission processing

Reference: nginx/nginx.conf for websocket sticky sessions

