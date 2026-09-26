# Performance

## Frontend Optimization
- Minimize and code-split JS bundles; lazy-load routes/components not needed on first paint.
- Optimize images (correct format/size/compression, lazy loading, responsive `srcset`).
- Minimize render-blocking resources; defer/async non-critical scripts.
- Avoid unnecessary re-renders (memoization, stable keys/props in component frameworks).
- Measure with Core Web Vitals: LCP, FID/INP, CLS.

## Backend Optimization
- Profile before optimizing — fix the actual bottleneck, not the one you assume.
- Avoid N+1 query patterns; batch or join instead of looping queries.
- Use async/non-blocking I/O for network- and disk-bound work.
- Right-size timeouts and connection pools; avoid unbounded concurrency.

## Database Optimization
- Index columns used in `WHERE`, `JOIN`, and `ORDER BY` — but avoid over-indexing (slows writes).
- Analyze query plans (`EXPLAIN`) for slow queries rather than guessing.
- Normalize for integrity, denormalize deliberately for read-heavy hot paths.
- Paginate large result sets; never `SELECT *` on wide tables when only a few columns are needed.
- Use connection pooling; watch for lock contention on hot rows.

## Caching
- Cache at the layer closest to the consumer that's still safe (CDN edge → app cache → DB query cache).
- Choose an explicit invalidation strategy (TTL, write-through, cache-aside) — "cache and hope" causes stale-data bugs.
- Watch for cache stampede on expiry of hot keys (use jitter or locking).

## Load Handling
- Horizontal scaling behind a load balancer for stateless services; keep session state external (Redis, etc.) if you need to scale beyond one node.
- Queue/async-process spiky or slow work instead of handling it synchronously in the request path.
- Apply backpressure/rate limiting so overload degrades gracefully instead of cascading into a full outage.
- Load test before you need to (k6, Locust, JMeter) — find the breaking point deliberately, not in production.
