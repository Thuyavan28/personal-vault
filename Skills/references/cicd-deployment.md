# CI/CD & Deployment

- Every change should run through an automated pipeline: lint → build → test → deploy, gated on green.
- Environments: local → staging/QA → production, with config (not code) differing between them.
- Deployment strategies for risk reduction: blue-green, canary releases, feature flags to decouple deploy from release.
- Automate rollback — know how to revert fast before you need to.
- Database migrations should be backward-compatible during rollout (expand/contract pattern) so old and new code can run simultaneously mid-deploy.
