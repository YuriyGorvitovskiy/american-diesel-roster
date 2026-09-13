# Compact Lineage Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the accepted compact historical timeline hero to NW1 and NW2 detail pages with reusable data, palette, SVG rendering, provenance, and tests.

**Architecture:** Prototype and historical-locomotive JSON own dated spans and source IDs. A DOM-free timeline model computes the true chronological scale and display rows; a focused SVG renderer consumes that model and the shared immutable palette. The locomotive page composes the accepted two-column hero without changing bookmarkable navigation.

**Tech Stack:** Static JSON, vanilla JavaScript ES modules, SVG/CSS, Node test runner.

**Spec:** User-provided “Implement the first compact historical timeline component…” requirements plus the accepted browser prototype in this task.

## Global Constraints

- Preserve Prototype, Historical Locomotive, and Collection Item separation.
- Do not fabricate ownership, operation, counts, or dates.
- Only actual prototype operators appear as service bars.
- Rebuild service does not extend the original model timeline.
- Keep the accepted global pattern palette in one reusable module.
- Keep the component dependency-free and compact.

---

### Task 1: Timeline records and provenance

**Files:**
- Modify: `data/locomotives.json`
- Modify: `data/historical-locomotives.json`
- Modify: `data/sources.json`
- Modify: `scripts/validate-data.js`
- Test: `tests/data-integrity.test.js`

**Interfaces:**
- Produces: `prototype.timeline.manufacturing`, `prototype.timeline.lineageService`, and `historicalLocomotive.serviceTimeline` records with stable `sourceIds`.

- [ ] Add failing integrity tests for exact NW1/NW2 railroad membership, rebuild cutoffs, uncertain NP count semantics, specific-locomotive segments, and valid source references.
- [ ] Run `node --test tests/data-integrity.test.js` and confirm the new assertions fail because timeline records are absent.
- [ ] Add the supplied researched records and sources, then extend validation for dates, railroads, ranges, and source IDs.
- [ ] Re-run the focused test and `node scripts/validate-data.js`.

### Task 2: Pure timeline model and permanent palette

**Files:**
- Create: `src/timeline.js`
- Create: `src/timeline-palette.js`
- Test: `tests/timeline.test.js`
- Test: `tests/timeline-palette.test.js`

**Interfaces:**
- Produces: `buildTimelineView(prototype, historicalLocomotives)` and `timelinePatternColors(identityId)`.
- `buildTimelineView` returns chronological bounds, ticks, ordered aggregate rows, and an optional continuous specific-locomotive row.

- [ ] Add failing tests for proportional year positioning, NW1/NW2 row membership, 1953 rebuild cutoff, the CB&Q-to-BN 1970 boundary, absence of a specific row, and accepted palette colors.
- [ ] Run the focused tests and confirm failures caused by missing model behavior.
- [ ] Implement the smallest DOM-free model and palette that pass.
- [ ] Re-run the focused tests.

### Task 3: Accepted SVG hero

**Files:**
- Create: `src/service-timeline.js`
- Modify: `src/details.js`
- Modify: `src/locomotive-page.js`
- Modify: `src/style.css`
- Modify: `locomotive.html`
- Test: `tests/details.test.js`

**Interfaces:**
- Consumes: `buildTimelineView` and `TIMELINE_PATTERN_PALETTE`.
- Produces: a compact accessible SVG with tooltips, contextual popover legend, and outlined specific-locomotive row.

- [ ] Add a failing composition test showing timeline-enabled details expose a renderable model while records without timeline remain valid.
- [ ] Replace the disposable prototype module with the production renderer and accepted two-column hero.
- [ ] Remove the temporary cache-buster and ensure the hero stacks at the existing mobile breakpoint.
- [ ] Run focused tests and inspect NW1 and NW2 in the browser.

### Task 4: Documentation, verification, and PR

**Files:**
- Modify: `PROJECT.md`
- Modify: `README.md` if its architecture inventory requires the new modules.

- [ ] Record the accepted timeline grammar and permanent palette in `PROJECT.md`.
- [ ] Run `npm test`, `node scripts/validate-data.js`, and `git diff --check`.
- [ ] Review the complete diff against the supplied requirements.
- [ ] Commit on `codex/compact-locomotive-timeline`, push, and open a focused PR to `main`.
