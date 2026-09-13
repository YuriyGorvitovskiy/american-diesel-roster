# GE Evolution Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working GE evolution page from the Universal Series through ET44 using the existing tree design.

**Architecture:** Add verified GE prototype records to the existing catalog and make the tree renderer accept manufacturer-specific section/lane configuration. Keep EMD behavior unchanged and render GE as three named series sections with axle/traction sub-lines.

**Tech Stack:** Static HTML, CSS, browser-native JavaScript modules, JSON data.

**Spec:** `docs/superpowers/specs/2026-09-13-ge-evolution-tree-design.md`

## Global Constraints

- Keep the first visual candidate uncommitted and dependency-free.
- Reuse existing node styling, status derivation, links, production-count convention, and scrolling viewport.
- New locomotives are `historical_only`; U25B and U33C retain status derived from orders.
- Unknown values remain null and displayed production counts require citations.
- Do not add operator counts or timelines without verified operated-fleet evidence.

---

### Task 1: GE prototype catalog

**Files:**
- Modify: `data/locomotives.json`
- Modify: `data/sources.json`

**Interfaces:**
- Consumes: existing Prototype JSON schema and stable source IDs.
- Produces: GE prototype records with `branch`, `generation`, `predecessors`, and `successors` fields consumed by the tree renderer.

- [x] Add the agreed U-Series, Dash 7/8/9, and Evolution model placeholders, retaining unknown facts as null.
- [x] Separate B-B and C-C predecessor/successor chains; remove the false U25B → U33C relationship.
- [x] Add U23B/U23C as substantial-production branches with cited production totals.
- [x] Add the Evolution DC C-C, AC C-C, and AC A1A-A1A/C4 branches.
- [x] Run catalog validation and require zero errors.

### Task 2: Manufacturer-specific tree configuration

**Files:**
- Modify: `src/tree.js`
- Modify: `src/app.js`
- Modify: `src/style.css` only if existing positioning cannot express section labels.

**Interfaces:**
- Consumes: `renderTree(container, { prototypes, getStatus })` and Prototype `branch`/`generation` metadata.
- Produces: a GE layout configuration selected from the current manufacturer view while preserving the existing EMD configuration.

- [x] Represent U-Series, combined Dash Series, and Evolution Series as configuration.
- [x] Lay out the B-B and C-C lines continuously, branch U23 nodes below U25, and add the C4 line only inside Evolution.
- [x] Reuse `treeNodeView`, status classes, SVG edges, and native horizontal scrolling.
- [x] Confirm EMD still renders with its existing five lanes.

### Task 3: Browser prototype review

**Files:**
- No new files.

**Interfaces:**
- Consumes: localhost GE and EMD views.
- Produces: a visible, uncommitted browser candidate for human review.

- [x] Run data validation and `git diff --check`.
- [x] Open `http://localhost:8001/?view=ge` and confirm every agreed node is visible and linked.
- [x] Confirm U25B and U33C use ordered styling while all new nodes use historical-context styling.
- [x] Open `http://localhost:8001/?view=emd` and confirm its layout remains unchanged.
- [x] Leave the GE view open and obtain visual acceptance before commit.
