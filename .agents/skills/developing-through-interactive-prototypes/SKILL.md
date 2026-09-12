---
name: developing-through-interactive-prototypes
description: Use when UX, presentation, layout, imagery, or interaction in American Diesel Roster is still being decided through hands-on browser review.
---

# Developing Through Interactive Prototypes

Use the running site to answer visual and interaction questions before making them permanent. Read `docs/process/interactive-prototype-development.md` for the governing boundaries.

## Prototype cycle

1. Name the single visual or interactive question being explored.
2. Implement the smallest observable candidate immediately; preliminary design approval, new tests, documentation, and the full verification suite are not prerequisites for this preview.
3. Keep prototype code localized, uncommitted, dependency-free, and disposable.
4. Open the relevant localhost state for the human and iterate from direct feedback until they explicitly retain or reject it.

Do not describe prototype code as complete, verified, or production-ready.

## Retaining an accepted result

After explicit acceptance:

1. Preserve the accepted appearance or behavior as a screenshot, scenario, or stable automated contract.
2. Update durable product documentation when the prototype established a product decision.
3. Replace provisional implementation with a clean implementation using `superpowers:test-driven-development` where behavior warrants automated coverage.
4. Run the repository tests, data validation, `git diff --check`, browser verification, and review.
5. Commit and push only the accepted, verified result within the user's authorized branch and PR scope.

Escalate to the normal brainstorming/specification workflow if the goal changes, the work crosses subsystem boundaries, adds a dependency, changes authoritative data semantics, or creates a costly external commitment.
