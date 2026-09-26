# Debugging

1. **Reproduce reliably** before trying to fix — an intermittent "fix" you can't verify is a guess.
2. **Isolate**: binary search the problem space — comment out/bisect code, use `git bisect` for regressions, narrow the input that triggers it.
3. **Read the actual error/stack trace fully** before theorizing; the answer is often stated plainly and skipped over.
4. **Instrument**: add logging/breakpoints at the boundary between "known good" and "known bad" state, then narrow.
5. **Check recent changes first** (git log/blame) — most bugs are introduced by something that changed recently, not ancient code.
6. **Form a hypothesis, then test it** — don't randomly change code hoping something works ("shotgun debugging"). If a change doesn't confirm/deny the hypothesis, revert it before trying the next.
7. Once fixed: understand *why* it broke, add a regression test, and consider whether the same bug class exists elsewhere in the codebase.
8. Common categories to check: off-by-one errors, null/undefined handling, race conditions/async timing, stale cache, wrong environment/config, type coercion surprises, timezone/locale bugs.
