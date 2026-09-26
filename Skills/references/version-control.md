# Version Control & Collaboration

- Small, focused commits with clear messages (what changed and why, not just "fix bug").
- Branch strategy: short-lived feature branches off a stable trunk; merge/rebase frequently to avoid painful conflicts.
- Write PR descriptions that explain intent and testing performed, not just a diff summary.
- Never commit secrets, credentials, or `.env` files — use secret managers or environment injection.
- Use `.gitignore` proactively for build artifacts, dependencies, and local config.
