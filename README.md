# American Diesel Roster

American Diesel Roster is a personal interactive reference that tells the history
of American diesel-locomotive development through an HO-scale collection. It
combines a navigable prototype genealogy with confirmed physical models,
incoming orders, collection targets, and historically important context.

Version 0.1 is intentionally small: a static HTML/CSS/JavaScript application with
JSON data and no dependencies or build step.

## Run locally

Browsers normally prevent `file://` pages from fetching JSON. From the repository
root, start a local server:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/).

Run automated checks with:

```bash
npm test
node scripts/validate-data.js
```

## Data model

A **prototype** is a real locomotive class, such as the EMD SD9. Prototype
history, specifications, relationships, and prototype photographs belong in
`data/locomotives.json`.

A **collection item** is one particular HO model. Its railroad, road number,
manufacturer, SKU, purchase information, and model photographs belong in
`data/collection.json`. Multiple collection items may reference one prototype.

Incoming models remain separate in `data/orders.json`, even though the interface
shows owned and ordered records together. Railroad identity and lineage live in
`data/railroads.json`. All cross-file relationships use stable IDs.

Physical and order records are authoritative: `owned` is derived only from
`data/collection.json`, and `ordered` only from active records in
`data/orders.json`. Prototype-level collection intent is restricted to `wanted`
and `historical_only`, preventing duplicated status from drifting.

## Repository structure

```text
index.html                 Page structure
src/app.js                 Data loading and selection coordination
src/model.js               Pure joins and status derivation
src/tree.js                Evolution-tree layout and rendering
src/details.js             Prototype detail rendering
src/roster.js              Owned/ordered roster rendering
src/style.css              Visual system and responsive layout
data/                      Source-controlled catalog data
images/prototype/           Future prototype photographs
images/collection/          Future photographs of physical HO models
scripts/validate-data.js    ID and reference validation
tests/                     Dependency-free Node tests
PROJECT.md                 Persistent domain and architecture guidance
```

## Editing policy

Edit prototype facts only after checking reliable historical sources. Never fill
unknown fields by inference; `null` is preferable to an attractive guess. Change
ownership or collection status only after owner confirmation. Do not put HO-model
purchasing data on prototype records.

GitHub is the source of truth shared between the owner, ChatGPT, and Codex.
