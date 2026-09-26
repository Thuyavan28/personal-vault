# Code Review Checklist

When reviewing (or self-reviewing before requesting review), check for:
- Correctness: does it actually do what it claims, including edge cases?
- Tests: are they present, meaningful, and do they cover the change?
- Readability: would a new team member understand this without asking you?
- Security: any of the `security.md` red flags present?
- Performance: any obvious N+1s, unbounded loops/queries, or blocking calls in a hot path?
- Scope: is the PR focused, or mixing unrelated changes that should be split?
- Consistency: does it follow existing conventions in the codebase rather than introducing a one-off style?
