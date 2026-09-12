# American Diesel Roster v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first functional, data-driven American Diesel Roster with a clickable EMD evolution tree, synchronized prototype detail view, and unified owned/ordered roster.

**Architecture:** Static semantic HTML loads four JSON datasets through a small ES-module coordinator. Pure model functions validate and join ID-based data; focused view modules render an SVG tree, prototype details, and a unified roster without mixing prototype, physical-item, or order records.

**Tech Stack:** HTML5, CSS, vanilla JavaScript ES modules, SVG, JSON, Node.js built-in test runner, Python standard-library HTTP server

**Spec:** `docs/superpowers/specs/2026-09-11-initial-roster-architecture-design.md`

## Global Constraints

- Use HTML, CSS, vanilla JavaScript, and JSON only; no frontend framework, backend, database, build system, or third-party package.
- Keep prototypes, physical collection items, and orders as separate domain records joined only by stable IDs.
- Never invent collection ownership or unverified historical facts; use `null` or empty collections for unknown values.
- Generate tree nodes and edges from data rather than hardcoding individual locomotives in HTML.
- Keep wanted and historical-only prototypes out of the physical roster.
- Use only local image references with caption, source, and credit metadata; do not download or hotlink images.
- Treat GitHub as the shared source of truth for the owner, ChatGPT, and Codex.

---

### Task 1: Seed data and integrity validation

**Files:**
- Create: `package.json`
- Create: `data/locomotives.json`
- Create: `data/collection.json`
- Create: `data/orders.json`
- Create: `data/railroads.json`
- Create: `scripts/validate-data.js`
- Create: `tests/data-integrity.test.js`
- Create: `images/prototype/.gitkeep`
- Create: `images/collection/.gitkeep`

**Interfaces:**
- Consumes: The approved design specification and only the collection facts in the user brief.
- Produces: JSON documents shaped as `{ "prototypes": Prototype[] }`, `{ "items": CollectionItem[] }`, `{ "orders": Order[] }`, and `{ "railroads": Railroad[] }`; `validateData(data): string[]`; `loadDataFiles(rootPath): Promise<DataBundle>`.

- [ ] **Step 1: Write the failing integrity tests**

Create `package.json` with `"type": "module"` and a `test` script of `node --test`. In `tests/data-integrity.test.js`, load the four JSON documents through `loadDataFiles`, call `validateData`, and assert:

```js
assert.deepEqual(validateData(data), []);
assert.equal(data.prototypes.length, 23);
assert.equal(data.items.length, 1);
assert.equal(data.orders.length, 2);
assert.equal(data.railroads.length, 6);
assert.equal(data.items[0].prototypeId, "emd-f3");
assert.equal(data.orders.find(({ id }) => id === "order-cbq-e7a-9931b").deposit.amount, 0);
```

Add fixture tests that duplicate a prototype ID and reference a missing railroad, asserting exact messages:

```js
assert.ok(errors.includes('Duplicate prototype id "emd-f3".'));
assert.ok(errors.includes('Order "bad-order" references unknown railroad "missing".'));
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test`

Expected: FAIL because `scripts/validate-data.js` and the data files do not exist.

- [ ] **Step 3: Implement the validator and seed data**

Implement `loadDataFiles(rootPath)` with `node:fs/promises` and `JSON.parse`. Implement `validateData({ prototypes, items, orders, railroads })` to check duplicate IDs and every prototype, railroad, predecessor, and successor reference.

Seed exactly the 23 requested EMD nodes with stable IDs and these branch lanes: `freight-cab`, `passenger-cab`, `gp`, and `sd`. Give each prototype the common fields `id`, `builder`, `model`, `variant`, `branch`, `years`, `horsepower`, `axleConfiguration`, `tractionType`, `productionCount`, `narrative`, `operatorIds`, `images`, `predecessors`, `successors`, and `collectionRelevance`; unknown facts are `null` or `[]`.

Use reciprocal requested genealogy links sufficient to branch the sample, including FT → F3 → F7, E7 → E8, GP7 → GP9 → GP30 → GP35 → GP40 → GP40-2, and the SD line with SD40 branching to SD40-2 and SD45 before later convergence through SD50/SD60 toward SD70MAC and SD70ACe. Do not add technical claims.

Seed one owned F3 item with unknown railroad, road number, and manufacturer. Seed the Great Northern GP35 order with unknown retailer and dates. Seed the exact Rapido CB&Q E7A order with road number `9931B`, silver/Zephyr livery, TrainWorld retailer, and `{ "amount": 0, "currency": "USD" }` deposit. Seed only the six specified railroads with ID-based lineage.

- [ ] **Step 4: Run integrity tests and direct validation**

Run: `npm test`

Expected: all tests PASS.

Run: `node scripts/validate-data.js`

Expected: `Data validation passed: 23 prototypes, 1 collection item, 2 orders, 6 railroads.`

- [ ] **Step 5: Commit the data foundation**

```bash
git add package.json data scripts/validate-data.js tests/data-integrity.test.js images
git commit -m "Add roster data model and validation"
```

---

### Task 2: Derived application model

**Files:**
- Create: `src/model.js`
- Create: `tests/model.test.js`

**Interfaces:**
- Consumes: `DataBundle` arrays from Task 1.
- Produces: `indexById(records): Map<string, object>`; `derivePrototypeStatus(prototypeId, data): "owned" | "ordered" | "wanted" | "historical_only"`; `buildRosterRows(data): RosterRow[]`; `formatPrototypeName(prototype): string`; `getRelatedPrototypes(prototype, prototypeById): { predecessors: Prototype[], successors: Prototype[] }`.

- [ ] **Step 1: Write failing model tests**

Test that F3 derives `owned`, GP35 and E7 derive `ordered`, SD9 derives `wanted`, and FT derives `historical_only`. Test that the roster has three rows, contains only owned/ordered rows, retains source type (`collection` or `order`), resolves prototype and railroad display names, and sorts owned before ordered then by prototype name. Test that missing optional values become `null`, not string `"undefined"`.

- [ ] **Step 2: Run the model tests and verify failure**

Run: `node --test tests/model.test.js`

Expected: FAIL because `src/model.js` does not exist.

- [ ] **Step 3: Implement pure model functions**

Use status precedence `owned > ordered > wanted > historical_only`. Derive owned and ordered from physical and order records; use `prototype.collectionRelevance` only for wanted/historical fallback. Return new view-model objects without mutating loaded JSON.

`buildRosterRows` must emit this stable shape:

```js
{
  id, sourceType, status, prototypeId, prototypeName,
  railroadName, roadNumber, manufacturer, livery, retailer
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit the application model**

```bash
git add src/model.js tests/model.test.js
git commit -m "Add derived roster application model"
```

---

### Task 3: Evolution-tree layout and rendering

**Files:**
- Create: `src/tree.js`
- Create: `tests/tree.test.js`

**Interfaces:**
- Consumes: `Prototype[]`, `derivePrototypeStatus`, selected prototype ID, and callback `(prototypeId: string) => void`.
- Produces: `layoutTree(prototypes): { nodes: TreeNode[], edges: TreeEdge[], width: number, height: number }`; `renderTree(container, options): void`; `updateTreeSelection(container, selectedId): void`.

- [ ] **Step 1: Write failing pure-layout tests**

Assert all 23 prototypes receive one node, lanes have stable vertical positions in the order freight cab, passenger cab, GP, SD, x positions increase within each lane, and every rendered edge corresponds to a declared successor ID. Assert missing successor IDs are skipped instead of throwing.

- [ ] **Step 2: Run tree tests and verify failure**

Run: `node --test tests/tree.test.js`

Expected: FAIL because `src/tree.js` does not exist.

- [ ] **Step 3: Implement layout and SVG rendering**

Keep `layoutTree` DOM-free. Assign lane y coordinates and evenly spaced x coordinates using input order; calculate edges by matching node centers. `renderTree` creates lane labels, one SVG line/path per relationship, and one absolutely positioned `<button>` per node over the SVG. Buttons must include model text plus a visible status label, `data-prototype-id`, status class, `aria-pressed`, and click callback. Do not embed individual locomotive IDs in rendering logic.

- [ ] **Step 4: Run all tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit the tree module**

```bash
git add src/tree.js tests/tree.test.js
git commit -m "Add data-driven evolution tree"
```

---

### Task 4: Interactive page, detail view, and unified roster

**Files:**
- Create: `index.html`
- Create: `src/app.js`
- Create: `src/details.js`
- Create: `src/roster.js`
- Create: `src/style.css`
- Create: `tests/details.test.js`
- Create: `tests/roster.test.js`

**Interfaces:**
- Consumes: JSON endpoints, Task 2 model functions, and Task 3 tree functions.
- Produces: `renderDetails(container, { prototype, status, related, onSelect }): void`; `renderRoster(container, rows): void`; browser entry point that owns `selectedPrototypeId` and synchronizes all views.

- [ ] **Step 1: Write failing view-model/markup tests**

Keep DOM-independent helpers exportable. Test `buildDetailFields(prototype)` omits null facts and retains known facts. Test `createNarrativeSections(prototype)` preserves multiple paragraphs. Test `groupRosterRows(rows)` separates owned and ordered rows without dropping either. Test `displayValue(null)` returns `"Unknown"` and `displayValue(0)` returns `"0"`.

- [ ] **Step 2: Run view tests and verify failure**

Run: `node --test tests/details.test.js tests/roster.test.js`

Expected: FAIL because the view modules do not exist.

- [ ] **Step 3: Implement semantic HTML and view modules**

Create landmarks for header, legend, tree, details, roster, and fatal error status. Add a loading message. In `details.js`, render builder/model identity, known technical fields, narrative paragraphs, collection status, and predecessor/successor buttons. In `roster.js`, render owned and ordered groups using accessible tables on wide screens and responsive row layout on narrow screens.

Do not use `innerHTML` with data strings; build elements and assign `textContent`. Relationship and tree buttons call the same selection callback.

- [ ] **Step 4: Implement the coordinator and failure path**

In `app.js`, fetch all four `/data/*.json` files concurrently, normalize their top-level arrays into a `DataBundle`, log each validation error with `console.error`, and continue rendering valid records where possible. Select `emd-f3` initially when present, otherwise the first prototype. A selection updates tree state and rerenders details without rebuilding the roster.

On fetch or parse failure, replace loading content with: `Unable to load roster data. Start a local server from the repository root (for example: python3 -m http.server 8000) and reload this page.`

- [ ] **Step 5: Add restrained responsive styling**

Define CSS variables for paper/background, ink, muted ink, lines, owned, ordered, wanted, historical, and selected states. Use a readable system/serif pairing without remote fonts. Make the tree horizontally scrollable, selected nodes unmistakable, focus rings visible, status text explicit, major regions stack below 850px, and animations disabled under `prefers-reduced-motion: reduce`.

- [ ] **Step 6: Run all automated tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit the functional application**

```bash
git add index.html src tests/details.test.js tests/roster.test.js
git commit -m "Build interactive roster interface"
```

---

### Task 5: Persistent project guidance and end-to-end verification

**Files:**
- Create: `README.md`
- Create: `PROJECT.md`
- Modify: `scripts/validate-data.js`

**Interfaces:**
- Consumes: The complete v0.1 application and approved design.
- Produces: Human and AI operating guidance, exact run instructions, and final verification evidence.

- [ ] **Step 1: Add documentation-content checks**

Extend `tests/data-integrity.test.js` to read `README.md` and `PROJECT.md`. Assert README contains `python3 -m http.server 8000`, the prototype/collection distinction, data-edit locations, verification policy, and GitHub source-of-truth statement. Assert PROJECT contains all ten requested AI-assistant rules and the headings `Collection philosophy`, `Railroad scope`, `Status semantics`, `Data quality`, `Evolution tree`, and `Future goals`.

- [ ] **Step 2: Run tests and verify documentation checks fail**

Run: `npm test`

Expected: FAIL because `README.md` and `PROJECT.md` do not exist.

- [ ] **Step 3: Write README and PROJECT guidance**

Document `python3 -m http.server 8000` followed by `http://localhost:8000/`, directory responsibilities, data editing, domain separation, data verification, and GitHub collaboration. In PROJECT.md, capture the complete supplied philosophy, BNSF predecessor scope, status semantics, rule against invented facts and ownership, tree-as-navigation principle, Markdown narrative recommendation, gaps, future filters, images, railroad genealogy, and the exact ten AI rules from the brief.

- [ ] **Step 4: Run automated verification**

Run: `npm test`

Expected: all tests PASS.

Run: `node scripts/validate-data.js`

Expected: validation success summary with exact record counts.

Run: `git diff --check`

Expected: no output and exit status 0.

- [ ] **Step 5: Run local HTTP and browser smoke tests**

Start: `python3 -m http.server 8000`

Verify with HTTP requests that `/`, `/src/app.js`, and all four `/data/*.json` resources return status 200. Open `http://localhost:8000/` in a browser and verify: all four lanes render; selecting a node updates details and selection styling; predecessor/successor buttons navigate; the roster shows one owned and two ordered rows; narrow viewport remains usable; and the console has no runtime errors.

- [ ] **Step 6: Commit documentation and any smoke-test fixes**

```bash
git add README.md PROJECT.md tests/data-integrity.test.js scripts/validate-data.js index.html src data
git commit -m "Document and verify roster v0.1"
```

- [ ] **Step 7: Review, create the requested release commit if necessary, and push**

Run: `git status --short --branch` and `git log --oneline --decorate -6`.

If implementation was developed through the task commits above, retain those reviewable commits; do not create an empty aggregate commit. If the work is still uncommitted, commit it as `Initial interactive roster architecture`. Push `main` to `origin`, then record `git rev-parse HEAD` for the final report.

Expected final state: clean working tree, `main` tracking `origin/main`, and all local commits present on GitHub.
