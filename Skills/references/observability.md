# Observability & Incident Response

- Three pillars: **logs** (structured, with correlation/request IDs), **metrics** (latency, error rate, throughput — the "RED"/"USE" methods), **traces** (for distributed request flows).
- Alert on symptoms users would notice (error rate, latency) more than on internal causes; avoid alert fatigue from noisy, low-signal alerts.
- Incident response basics: detect → mitigate (stop the bleeding, even with a rough workaround) → root-cause → fix → blameless postmortem (what happened, why, what prevents recurrence).
