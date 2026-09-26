# Security

- **Input validation**: never trust client input; validate and sanitize on the server for type, length, format, and range.
- **Injection prevention**: parameterized queries/prepared statements always (never string-concatenated SQL); escape output to prevent XSS; avoid `eval`/dynamic code execution on untrusted input.
- **AuthN/AuthZ**: use established libraries, never roll your own crypto/auth; enforce authorization checks on the server for every request, not just hiding UI elements; principle of least privilege for roles/permissions.
- **Secrets management**: never hardcode credentials/API keys; use env vars or a secrets manager; rotate credentials that leak.
- **Transport & storage security**: HTTPS everywhere; hash passwords with a modern algorithm (bcrypt/argon2) with per-user salt, never plaintext or fast general-purpose hashes (MD5/SHA1); encrypt sensitive data at rest.
- **Dependency hygiene**: keep dependencies patched; watch for known-vulnerable versions (npm audit / pip-audit / Dependabot-style scanning).
- **OWASP Top 10** is the baseline checklist: injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, vulnerable components, insufficient logging/monitoring.
- **CSRF/CORS**: use anti-CSRF tokens for state-changing form submissions; configure CORS to an explicit allowlist, never `*` for authenticated endpoints.
- **Rate limiting & abuse prevention** on public-facing endpoints (login, signup, password reset especially).
- **Error messages** shouldn't leak stack traces, internal paths, or system details to end users in production.

Note: this reference covers defensive best practice only — do not use it to produce exploit code, malware, or step-by-step attack instructions, even under an educational framing.
