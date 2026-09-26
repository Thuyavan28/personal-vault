# Testing

Testing pyramid: many fast unit tests, fewer integration tests, fewer still E2E tests. Don't invert it.

- **Unit testing**: test one function/class in isolation; mock/stub external dependencies; cover happy path, edge cases (empty, null, boundary values), and error conditions. Aim for tests that fail for exactly one reason.
- **Integration testing**: verify that multiple units/modules work together correctly (e.g., service + real database, or two internal services) — catches issues unit tests with mocks hide.
- **API testing**: verify contract correctness — status codes, response shape/schema, headers, auth behavior, error responses, rate limiting, idempotency where expected. Tools: Postman/Newman, REST-assured, pytest+requests, contract testing (Pact) for consumer/provider contracts.
- **E2E testing**: simulate real user flows across the full stack (UI → API → DB); keep these few and focused on critical paths (signup, checkout, core workflow) because they're slow and brittle. Tools: Playwright, Cypress, Selenium.
- **UI testing**: verify rendering, interaction, and visual correctness — component tests (React Testing Library, etc.), visual regression (screenshot diffing), cross-browser checks.
- **Regression testing**: re-run existing tests after changes to catch reintroduced bugs; automate this in CI so it happens on every change, not just before releases.
- Other forms worth knowing: smoke tests (is it even up?), load/stress/performance testing (see `performance.md`), mutation testing (are your tests actually strong?), snapshot testing (careful — can become a false sense of security if snapshots are accepted blindly).
- Write tests before or alongside the fix when fixing a bug (regression test proves the bug existed and stays fixed).
- Test names should describe the scenario and expected outcome (`returns_404_when_user_not_found`), not `test1`.
