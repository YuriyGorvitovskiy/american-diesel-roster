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
npm start
```

Then open [http://localhost:8000/](http://localhost:8000/).

The root page introduces the collection. Top-level reference views use query
URLs such as `/?view=collection` and `/?view=emd`. Locomotive records use
bookmarkable URLs such as `/locomotive.html?id=emc-nw1`.
Railroad records use paths such as `/railroads/gn`; the local server routes
those paths back to the application entry point.

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

A **historical locomotive** is one real engine, such as CB&Q 9245. Its build
record, serial number, railroad identities, renumberings, retirement, individual
narrative, and prototype photographs belong in
`data/historical-locomotives.json`. A collection item may reference both its
generic prototype and this specific identity.

Incoming models remain separate in `data/orders.json`, even though the interface
shows owned and ordered records together. Railroad identity and lineage live in
`data/railroads/index.json` and one file per company in `data/railroads/`. All cross-file relationships use stable IDs.

Physical and order records are authoritative: `owned` is derived only from
`data/collection.json`, and `ordered` only from active records in
`data/orders.json`. Prototype-level collection intent is restricted to `wanted`
and `historical_only`, preventing duplicated status from drifting.

Research references are normalized in `data/sources.json` and linked from
domain records by stable `sourceIds`.

## Repository structure

```text
index.html                 Home and top-level-view entry point
locomotive.html            Bookmarkable locomotive-detail entry point
src/app.js                 Top-level view coordination
src/locomotive-page.js     Direct locomotive-detail coordination
src/data.js                Shared JSON loading and reference diagnostics
src/navigation.js          URL contract and persistent navigation
src/model.js               Pure joins and status derivation
src/timeline.js            Pure chronological timeline view model
src/timeline-palette.js    Permanent manufacturing and railroad identities
src/service-timeline.js    Accessible SVG timeline rendering
src/tree.js                Linked evolution-tree layout and rendering
src/details.js             Prototype detail rendering
src/roster.js              Owned/ordered roster rendering
src/style.css              Visual system and responsive layout
data/                      Source-controlled catalog data
data/historical-locomotives.json  Individual real-locomotive identities
data/sources.json           Reusable research provenance
images/prototype/           Future prototype photographs
images/collection/          Future photographs of physical HO models
scripts/validate-data.js    ID and reference validation
scripts/serve.js            Local static server with railroad-route fallback
tests/                     Dependency-free Node tests
PROJECT.md                 Persistent domain and architecture guidance
```

## Editing policy

Edit prototype facts only after checking reliable historical sources. Never fill
unknown fields by inference; `null` is preferable to an attractive guess. Change
ownership or collection status only after owner confirmation. Do not put HO-model
purchasing data on prototype records.

GitHub is the source of truth shared between the owner, ChatGPT, and Codex.
