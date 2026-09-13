---
name: demo-driven-development
description: Use when requirements, UX, or behavior should be discovered through rapid working demos and inexpensive user-feedback iterations before productionization.
---

# Demo-Driven Development

Use a working demo as the design conversation when requirements are still
evolving. Keep exploration visibly provisional, then switch decisively to
production engineering only after explicit user approval.

## Explore

1. Implement the simplest working version quickly.
2. Prefer reasonable assumptions over questions when changes are cheap and
   reversible.
3. Optimize for the user-feedback round trip, not production quality.
4. Skip TDD, comprehensive tests, premature abstractions, unrelated refactoring,
   and production polish during disposable exploration.
5. Stop after each working iteration and let the user evaluate it.
6. Treat feedback as requirements discovery and iterate.

Do not require a specification or detailed plan before showing the demo. Keep
demo changes localized, reversible, and uncommitted. Never describe them as
complete, verified, or production-ready.

Stay in Explore until the user **explicitly** approves the result or asks to
productionize it or create a PR. Silence, continued browsing, or qualified
feedback is not approval.

## Solidify

After explicit approval:

1. Summarize the final accepted behavior.
2. Re-evaluate the implementation. Prototype code is disposable and may be
   rewritten.
3. Apply normal production engineering practices, including appropriate
   architecture, tests, cleanup, and error handling.
4. Run all relevant tests, lint, type checks, builds, and runtime verification.
5. Create the PR only after verification succeeds.

Tests protect the final accepted behavior, not intermediate prototypes.

## Principle

**Explore:** optimize for speed of learning.  
**Solidify:** optimize for maintainability and correctness.

`idea → demo ↔ feedback → accepted design → production implementation → PR`
