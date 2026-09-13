# Tabbed Reference Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the long single-page roster with persistent top-level tabs, focused manufacturer and Collection views, and bookmarkable locomotive detail URLs.

**Architecture:** Keep the app static and dependency-free. `index.html` dispatches URL-selected top-level views, `locomotive.html` renders one URL-selected detail, and shared data, URL, and shell modules keep both entry points consistent. Navigation uses ordinary anchors so browser history, refresh, bookmarking, and opening in a new tab work natively.

**Tech Stack:** Vanilla HTML, CSS, ES modules, JSON, Node’s built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-tabbed-reference-navigation-design.md`

## Global Constraints

- Preserve all existing historical facts, collection ownership, orders, IDs, and source provenance.
- Keep vanilla HTML/CSS/JavaScript and JSON; add no backend, framework, database, dependency, or build step.
- Top-level navigation order is Collection, EMD, ALCO, GE, BNSF; `/` is the introductory home page.
- EMD lanes remain product series/lineages NW, F, E, GP, SD with the existing designation explanations.
- Do not populate ALCO or GE, and do not implement the BNSF genealogy or timeline.
- Tree nodes show model and locale-formatted total production; unknown values use a subtle dash.
- Visible node status comes from border/tint treatment and the matching legend; accessible names retain status.
- Reuse the existing locomotive detail presentation rather than redesigning it.
- Completion requires `npm test`, `node scripts/validate-data.js`, `git diff --check`, and browser smoke tests.

## File structure

- Create `locomotive.html`: static entry point for one detail URL.
- Create `src/data.js`: shared JSON path map, loader, and dangling-reference diagnostics.
- Create `src/navigation.js`: pure URL helpers and persistent shell rendering.
- Create `src/locomotive-page.js`: direct detail-page startup and invalid-ID handling.
- Modify `index.html`: shared header/nav plus one top-level content mount.
- Modify `src/app.js`: URL-driven top-level view dispatcher.
- Modify `src/tree.js`: linked nodes, production-count presentation, and accessible labels.
- Modify `src/roster.js`: linked Collection rows with status and available model images.
- Modify `src/details.js`: linked lineage relationships.
- Modify `src/style.css`: accepted navigation, node, legend, empty-state, and detail-navigation styling.
- Modify `PROJECT.md`: durable navigation and UI principles.
- Modify `README.md`: current entry points and repository structure.
- Create `tests/navigation.test.js`: URL contract tests.
- Modify `tests/tree.test.js`, `tests/roster.test.js`, and `tests/details.test.js`: renderer contracts.

---

### Task 1: Shared URL and data foundations

**Files:**
- Create: `src/navigation.js`
- Create: `src/data.js`
- Create: `tests/navigation.test.js`
- Modify: `src/app.js`

**Interfaces:**
- Produces: `TOP_LEVEL_VIEWS`, `normalizeView(value)`, `topLevelUrl(view)`, `locomotiveUrl(id)`, `parsePrototypeId(search)`, `loadData()`, and `findDanglingReferences(data)`.
- Consumers: top-level app, tree, roster, detail renderer, and locomotive page.

- [ ] **Step 1: Write failing URL-contract tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  locomotiveUrl, normalizeView, parsePrototypeId, topLevelUrl,
} from "../src/navigation.js";

test("top-level URLs default Collection to the root", () => {
  assert.equal(topLevelUrl("collection"), "./");
  assert.equal(topLevelUrl("emd"), "./?view=emd");
  assert.equal(normalizeView(null), "collection");
  assert.equal(normalizeView("unknown"), "collection");
});

test("detail URLs encode and parse stable prototype IDs", () => {
  assert.equal(locomotiveUrl("emc-nw1"), "./locomotive.html?id=emc-nw1");
  assert.equal(parsePrototypeId("?id=emc-nw1"), "emc-nw1");
  assert.equal(parsePrototypeId(""), null);
});
```

- [ ] **Step 2: Run the tests and verify the module is missing**

Run: `node --test tests/navigation.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/navigation.js`.

- [ ] **Step 3: Implement the pure URL contract**

```js
export const TOP_LEVEL_VIEWS = ["collection", "emd", "alco", "ge", "bnsf"];

export function normalizeView(value) {
  return TOP_LEVEL_VIEWS.includes(value) ? value : "collection";
}

export function topLevelUrl(view) {
  return view === "collection" ? "./" : `./?view=${encodeURIComponent(view)}`;
}

export function locomotiveUrl(id) {
  return `./locomotive.html?id=${encodeURIComponent(id)}`;
}

export function parsePrototypeId(search) {
  return new URLSearchParams(search).get("id");
}
```

- [ ] **Step 4: Extract data loading from `src/app.js`**

Move the existing `paths`, `loadData`, and `findDanglingReferences` logic into
`src/data.js`, export the latter two functions, and import them from `src/app.js`.
Keep every JSON path root-relative to the two root-level HTML files:

```js
const paths = {
  prototypes: "./data/locomotives.json",
  items: "./data/collection.json",
  orders: "./data/orders.json",
  railroads: "./data/railroads.json",
  historicalLocomotives: "./data/historical-locomotives.json",
  sources: "./data/sources.json",
};
```

- [ ] **Step 5: Run focused and full tests**

Run: `node --test tests/navigation.test.js && npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit the shared foundations**

```bash
git add src/navigation.js src/data.js src/app.js tests/navigation.test.js
git commit -m "Add shared navigation and data foundations"
```

### Task 2: Persistent page shell

**Files:**
- Modify: `src/navigation.js`
- Modify: `tests/navigation.test.js`
- Modify: `index.html`
- Create: `locomotive.html`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `TOP_LEVEL_VIEWS` and `topLevelUrl(view)` from Task 1.
- Produces: `renderNavigation(container, activeView)` and identical shell mounts in both HTML entry points.

- [ ] **Step 1: Add a failing shell-definition test**

Add a pure definition that the DOM renderer consumes:

```js
import { navigationItems } from "../src/navigation.js";

test("navigation items preserve the required order and active state", () => {
  assert.deepEqual(navigationItems("emd"), [
    { id: "collection", label: "Collection", href: "./", current: false },
    { id: "emd", label: "EMD", href: "./?view=emd", current: true },
    { id: "alco", label: "ALCO", href: "./?view=alco", current: false },
    { id: "ge", label: "GE", href: "./?view=ge", current: false },
    { id: "bnsf", label: "BNSF", href: "./?view=bnsf", current: false },
  ]);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/navigation.test.js`

Expected: FAIL because `navigationItems` is not exported.

- [ ] **Step 3: Implement navigation definitions and renderer**

```js
const LABELS = { collection: "Collection", emd: "EMD", alco: "ALCO", ge: "GE", bnsf: "BNSF" };

export function navigationItems(activeView) {
  return TOP_LEVEL_VIEWS.map((id) => ({
    id, label: LABELS[id], href: topLevelUrl(id), current: id === activeView,
  }));
}

export function renderNavigation(container, activeView) {
  const list = document.createElement("ul");
  list.className = "site-nav-list";
  for (const item of navigationItems(activeView)) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (item.current) link.setAttribute("aria-current", "page");
    li.append(link);
    list.append(li);
  }
  container.replaceChildren(list);
}
```

- [ ] **Step 4: Replace the long `index.html` body with shared mounts**

Use the compact linked wordmark followed by navigation at the top, keep the
legend in the footer, and use:

```html
<nav id="site-navigation" class="site-nav" aria-label="Primary"></nav>
<main id="page-content">
  <p id="loading" role="status">Loading roster data…</p>
</main>
<script type="module" src="src/app.js"></script>
```

Create `locomotive.html` with the same compact navigation and footer legend plus
the main mount, but load `src/locomotive-page.js`.

- [ ] **Step 5: Add accepted persistent-navigation and matching legend CSS**

Implement `.site-nav`, `.site-nav-list`, `[aria-current="page"]`, and status
swatches using the accepted restrained underline, horizontal overflow, four-pixel
borders, and light tints. Do not change detail-card layout in this step.

- [ ] **Step 6: Run tests and inspect both shells through the local server**

Run: `npm test`

Open: `http://localhost:8000/` and
`http://localhost:8000/locomotive.html?id=emc-nw1`.

Expected: identical header/navigation/footer shells; detail main may still show
only its loading state until Task 5.

- [ ] **Step 7: Commit the shared shell**

```bash
git add index.html locomotive.html src/navigation.js src/style.css tests/navigation.test.js
git commit -m "Add persistent reference navigation shell"
```

### Task 3: Linked EMD tree with production counts

**Files:**
- Modify: `src/tree.js`
- Modify: `tests/tree.test.js`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `locomotiveUrl(id)` and existing `derivePrototypeStatus` callback.
- Produces: `formatProductionCount(value)`, `treeNodeView(prototype, status)`, and `renderTree(container, options)` with anchors rather than selection buttons.

- [ ] **Step 1: Write failing pure node-view tests**

```js
import { formatProductionCount, treeNodeView } from "../src/tree.js";

test("tree nodes show production totals instead of visible status", () => {
  assert.deepEqual(treeNodeView({ id: "emc-nw1", model: "NW1", productionCount: 27 }, "historical_only"), {
    href: "./locomotive.html?id=emc-nw1",
    model: "NW1",
    production: "27",
    status: "historical_only",
    accessibleLabel: "NW1, 27 produced, historical context",
  });
  assert.equal(formatProductionCount(1145), "1,145");
  assert.equal(formatProductionCount(null), "—");
});
```

- [ ] **Step 2: Run the tree tests and verify the new exports fail**

Run: `node --test tests/tree.test.js`

Expected: FAIL because the helpers are not exported.

- [ ] **Step 3: Implement node view data**

Use `Intl.NumberFormat("en-US")` for deterministic project output, map
`historical_only` to spoken “historical context,” and omit the production phrase
from the accessible name when the value is unknown.

- [ ] **Step 4: Change `renderTree` to render anchors**

Remove `selectedId`, `onSelect`, `aria-pressed`, and `updateTreeSelection`.
For each node, render:

```js
const view = treeNodeView(node, getStatus(node.id));
const link = document.createElement("a");
link.className = `tree-node status-${view.status}`;
link.href = view.href;
link.setAttribute("aria-label", view.accessibleLabel);
const model = document.createElement("strong");
model.textContent = view.model;
const production = document.createElement("small");
production.textContent = view.production;
link.append(model, production);
```

Append the exact explanatory note after the canvas:
“Number in each node = total prototype production.”

- [ ] **Step 5: Apply the accepted status visuals**

Update `.tree-node` to a four-pixel status border and light tint variables.
Remove selected-node styling. Keep gold `:focus-visible` distinct from all status
colors and preserve horizontal scrolling and mobile legibility.

- [ ] **Step 6: Run tests and inspect NW1/NW2 in the browser**

Run: `node --test tests/tree.test.js && npm test`

Expected: NW1 view is `27`, NW2 view is `1,145`, no visible status word is
created, and status remains in class names and accessible labels.

- [ ] **Step 7: Commit the linked tree**

```bash
git add src/tree.js src/style.css tests/tree.test.js
git commit -m "Link EMD tree nodes to production details"
```

### Task 4: URL-driven top-level views and Collection links

**Files:**
- Modify: `src/app.js`
- Modify: `src/roster.js`
- Modify: `src/model.js`
- Modify: `tests/roster.test.js`
- Modify: `tests/model.test.js`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `loadData`, `normalizeView`, `renderNavigation`, `renderTree`, `renderRoster`, and `locomotiveUrl`.
- Produces: `renderTopLevelView(main, view, data)` and Collection entries that link to prototypes.

- [ ] **Step 1: Add failing Collection row tests**

Assert that `buildRosterRows(data)` still returns exactly four physical/order
records, includes no `historical_only` status, and exposes any collection model
image selected from `record.images`:

```js
assert.ok(rows.every(({ status }) => ["owned", "ordered"].includes(status)));
assert.ok(rows.every(({ prototypeId }) => prototypeId));
assert.equal(rows.find(({ prototypeId }) => prototypeId === "emd-nw2").image?.localPath,
  "images/collection/cbq-9245-bli-side.png");
```

Add a pure roster-link assertion through an exported `rosterRowView(row)`:

```js
assert.equal(rosterRowView({ prototypeId: "emd-nw2" }).href,
  "./locomotive.html?id=emd-nw2");
```

- [ ] **Step 2: Run model and roster tests and verify failure**

Run: `node --test tests/model.test.js tests/roster.test.js`

Expected: FAIL because image projection and `rosterRowView` are absent.

- [ ] **Step 3: Project available model images without changing source data**

In `buildRosterRows`, add `image: record.images?.find(({ type }) => type === "collection-model") ?? null`.
Do not synthesize images for orders or items without one.

- [ ] **Step 4: Render Collection rows as linked entries**

Export `rosterRowView(row)` returning `{ ...row, href: locomotiveUrl(row.prototypeId) }`.
In the table, make the prototype name an anchor. Add Status as a column and an
available thumbnail beside the prototype name, with alt text from the source
caption. Keep the existing responsive table labels.

- [ ] **Step 5: Implement the top-level view dispatcher**

In `src/app.js`, parse `view` from `window.location.search`, render navigation,
load data once, and dispatch:

```js
switch (view) {
  case "emd": renderManufacturerView(main, "emd", data); break;
  case "alco": renderEmptyManufacturer(main, "ALCO"); break;
  case "ge": renderEmptyManufacturer(main, "GE"); break;
  case "bnsf": renderBnsfPlaceholder(main); break;
  default: renderCollectionView(main, data);
}
```

The EMD view contains only its heading, designation-preserving tree and note,
and no detail card or Collection roster. Empty-state copy must say “Not yet
populated.” BNSF copy must mention predecessor genealogy, railroad timeline, and
predecessor-road locomotive purchases.

- [ ] **Step 6: Run tests and smoke-test all five tabs**

Run: `npm test`

Open `/`, `/?view=emd`, `/?view=alco`, `/?view=ge`, and `/?view=bnsf`.

Expected: Collection is default; each link changes the real URL and active tab;
EMD alone shows the tree; placeholders remain restrained and factual.

- [ ] **Step 7: Commit top-level views**

```bash
git add src/app.js src/model.js src/roster.js src/style.css tests/model.test.js tests/roster.test.js
git commit -m "Add URL-driven reference views and Collection"
```

### Task 5: Bookmarkable locomotive detail page

**Files:**
- Create: `src/locomotive-page.js`
- Modify: `src/details.js`
- Modify: `tests/details.test.js`
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `loadData`, `parsePrototypeId`, `renderNavigation`, `locomotiveUrl`, `buildPrototypeDetail`, and `renderDetails`.
- Produces: direct URL detail rendering and linked predecessor/successor navigation.

- [ ] **Step 1: Add failing relationship-link tests**

Extract and test a pure view helper:

```js
import { relationshipView } from "../src/details.js";

test("lineage relationships link to bookmarkable detail URLs", () => {
  assert.deepEqual(relationshipView({ id: "emd-nw2", builder: "EMD", model: "NW2" }), {
    label: "EMD NW2",
    href: "./locomotive.html?id=emd-nw2",
  });
});
```

- [ ] **Step 2: Run the detail test and verify failure**

Run: `node --test tests/details.test.js`

Expected: FAIL because `relationshipView` is not exported.

- [ ] **Step 3: Replace relationship buttons with anchors**

Remove the `onSelect` callback from `renderDetails`. Make `relationshipGroup`
render anchors from `relationshipView(prototype)`. Preserve “None recorded.”

- [ ] **Step 4: Implement direct detail-page startup**

In `src/locomotive-page.js`:

```js
async function start() {
  const main = document.querySelector("#page-content");
  const id = parsePrototypeId(window.location.search);
  renderNavigation(document.querySelector("#site-navigation"), "emd");
  try {
    const data = await loadData();
    const detail = id ? buildPrototypeDetail(id, data) : null;
    if (!detail) return renderDetailError(main, id);
    document.title = `${formatPrototypeName(detail.prototype)} — American Diesel Roster`;
    renderDetailPage(main, detail);
  } catch (error) {
    console.error(error);
    renderLoadError(main);
  }
}
```

`renderDetailPage` adds a “← Back” button wired only to `window.history.back()`
and then calls the existing detail renderer. Persistent EMD navigation is always
available, so direct loads do not need fabricated history. `renderDetailError`
states whether the ID is missing or unknown and links to EMD and Collection.

- [ ] **Step 5: Run tests and direct-load smoke tests**

Run: `node --test tests/details.test.js && npm test`

Open and refresh:

- `/locomotive.html?id=emc-nw1`
- `/locomotive.html?id=emd-nw2`
- `/locomotive.html?id=missing`
- `/locomotive.html`

Expected: NW1 and NW2 restore the correct complete cards after refresh; invalid
states show explicit errors; lineage links have real URLs.

- [ ] **Step 6: Verify native history semantics**

Navigate from `/?view=emd` to NW1, press browser Back, then Forward.

Expected: Back returns to EMD at its real URL and Forward restores NW1. Repeat
with NW2 and confirm opening the node in a new tab works.

- [ ] **Step 7: Commit the detail page**

```bash
git add src/locomotive-page.js src/details.js src/style.css tests/details.test.js
git commit -m "Add bookmarkable locomotive detail pages"
```

### Task 6: Product documentation, verification, and review

**Files:**
- Modify: `PROJECT.md`
- Modify: `README.md`
- Review: all changed files

**Interfaces:**
- Consumes: completed observable behavior from Tasks 1–5.
- Produces: durable project guidance and release evidence.

- [ ] **Step 1: Update `PROJECT.md` principles**

Add a navigation section stating all required principles verbatim in substance:
top-level Collection/EMD/ALCO/GE/BNSF views; series/lineage grouping; model plus
total production in nodes; styling/legend as the primary visible status channel;
bookmarkable details; native browser history; standalone detail pages; separate
BNSF historical view.

- [ ] **Step 2: Update `README.md`**

Document `/` as Collection, the `?view=` manufacturer/BNSF URLs,
`locomotive.html?id=` detail URLs, and the new module responsibilities in the
repository tree. Keep the documented `python3 -m http.server 8000` workflow.

- [ ] **Step 3: Run the complete automated verification**

Run:

```bash
npm test
node scripts/validate-data.js
git diff --check
```

Expected: all tests pass, validation reports no errors, and `git diff --check`
prints nothing.

- [ ] **Step 4: Perform responsive browser verification**

At desktop and narrow/mobile widths, inspect Collection, EMD, ALCO, GE, BNSF,
NW1, and NW2. Confirm navigation remains usable, tree and tabs scroll
horizontally when required, detail content remains readable, remote-image
fallback remains usable, and no page introduces unintended excessive vertical
scrolling.

- [ ] **Step 5: Review the full diff against scope**

Run:

```bash
git diff 0be117c -- data PROJECT.md README.md index.html locomotive.html src tests
git status --short
```

Confirm no domain JSON changed, no dependency was added, no ALCO/GE/BNSF data or
visualization was invented, and `.superpowers/` remains ignored.

- [ ] **Step 6: Commit documentation**

```bash
git add PROJECT.md README.md
git commit -m "Document tabbed reference navigation"
```

- [ ] **Step 7: Request code review and address findings**

Use `superpowers:requesting-code-review`, fix any verified issues through the
appropriate test-first cycle, and rerun Step 3 after every code change.

- [ ] **Step 8: Push and open the PR**

Push `codex/tabbed-reference-navigation`, create the PR titled
“Add tabbed reference navigation and dedicated locomotive detail views,” and
include the navigation structure, URL approach, node/status changes, Collection,
placeholders, documentation, and verification evidence in the description.
