# American Diesel Roster v0.1 Design

## Purpose and scope

American Diesel Roster is a personal, interactive historical reference for an
HO-scale collection. Version 0.1 establishes the domain model, data-driven
locomotive evolution tree, locomotive detail view, and unified owned/ordered
roster. It deliberately does not attempt exhaustive historical research,
advanced graph layout, editing tools, filtering, a backend, or a polished final
visual design.

The application will use semantic HTML, CSS, vanilla JavaScript ES modules, and
JSON data. It will have no package dependency or build step. A small local HTTP
server command will be documented because browsers commonly block JSON fetches
from `file://` pages.

## Domain model

### Prototypes

`data/locomotives.json` is the historical prototype catalog. Every prototype
has a stable ID and may contain builder, model, production dates, horsepower,
axle configuration, traction type, production count, narrative sections,
operator IDs, image metadata, predecessor IDs, and successor IDs. Unknown facts
are represented as `null` or empty collections; the seed data will not invent
facts that were not supplied and verified.

Relationships are stored as ID arrays so the genealogy can branch. A small
presentation hint identifies the broad tree lane—cab/freight, passenger, GP, or
SD—for the intentionally simple v0.1 layout. This hint does not encode individual
HTML nodes or edges.

A prototype also carries its collection relationship: `owned`, `ordered`,
`wanted`, or `historical_only`. This describes how the prototype relates to the
collection, not a physical HO model. The application will derive the strongest
applicable relationship from confirmed collection and order records where
appropriate while retaining an explicit wanted or historical-only designation
for prototypes without a physical record.

### Physical collection and orders

`data/collection.json` contains only confirmed physical HO items. Each item has
its own stable ID and references a prototype and, when known, a railroad by ID.
HO manufacturer, road number, livery, SKU, purchase information, notes, and
collection photographs belong to this record rather than the prototype.

`data/orders.json` contains unfulfilled purchases. An order has its own ID and
references a prototype and railroad. It may hold model manufacturer, road
number, livery, SKU, retailer, order and expected dates, price, deposit, notes,
and order status. Missing values remain `null`.

The UI presents collection items and active orders in one roster for practical
viewing, clearly labels their status, and never merges their underlying records.
Historical-only and wanted prototypes do not appear as physical roster entries.

### Railroads and images

`data/railroads.json` contains stable IDs, display names, reporting marks, and
predecessor/successor ID arrays. Version 0.1 seeds only Great Northern, Northern
Pacific, Chicago, Burlington & Quincy, Spokane, Portland & Seattle, Burlington
Northern, and BNSF.

Prototype and collection records may reference arrays of local image metadata
with path, caption, source, and credit fields. The image directories are created,
but v0.1 will not download or hotlink photographs.

## Seed data policy

The prototype catalog will include the requested EMD sample across four lanes:

- Freight cab units: FT, F3, F7
- Passenger cab units: E7, E8
- GP road-switchers: GP7, GP9, GP30, GP35, GP40, GP40-2
- SD road-switchers: SD7, SD9, SD18, SD24, SD35, SD40, SD40-2,
  SD45, SD50, SD60, SD70MAC, and SD70ACe

Only relationships and identity information needed to demonstrate the tree are
seeded. Unverified dates, horsepower, production counts, technical claims, and
operator histories remain null or absent.

Confirmed collection information is limited to:

- One owned EMD F3 with railroad, road number, and HO manufacturer unknown.
- One ordered Great Northern orange/green EMD GP35 with other order details
  unknown.
- One ordered Rapido EMD E7A in CB&Q silver/Zephyr paint, road number 9931B,
  through TrainWorld, with a zero-dollar preorder deposit.
- Wanted prototype relationships for EMD SD9 and ALCO RS-3.
- Recorded gaps for SP&S representation, ALCO C425, and GE AC4400CW. Prototypes
  outside the requested EMD seed tree may be represented as future goals in
  project documentation rather than fabricated as researched catalog entries.

## Application architecture

`index.html` provides semantic application regions and static explanatory copy.
`src/app.js` loads all JSON datasets, performs lightweight integrity validation,
builds ID indexes, joins display data, owns the selected prototype ID, and
coordinates rendering. `src/tree.js` calculates the lane layout, creates SVG
relationship lines and clickable prototype controls, and exposes selection
updates. `src/roster.js` renders the unified collection/order roster. A focused
detail module may be split out if it keeps `app.js` materially smaller; otherwise
the detail renderer remains a small coordinator concern in v0.1.

Data loading proceeds as follows:

1. Fetch all four JSON documents concurrently.
2. Validate unique IDs and referenced prototype, railroad, predecessor, and
   successor IDs.
3. Build read-only lookup maps and derived collection-status information.
4. Render the tree, initial detail selection, and unified roster.
5. Route tree and relationship-link actions through one selection function so
   all views remain synchronized.

## Interface and interaction

The page has a compact project header and status legend followed by three
conceptual areas:

1. The evolution tree uses separate horizontal lanes for freight cab, passenger
   cab, GP, and SD development. Nodes and edges come from JSON. Horizontal
   scrolling is preferable to shrinking a large tree into illegibility.
2. The locomotive detail panel shows only available technical fields, narrative
   sections, collection relevance, and clickable predecessor/successor controls.
3. The roster shows owned collection items and incoming orders together while
   visibly preserving the distinction.

Owned nodes receive the strongest collection emphasis; ordered and wanted nodes
have distinct text-and-color treatments; historical/contextual nodes are subdued.
The selected node has an obvious focus treatment independent of status. Color is
never the only status cue.

Tree nodes and relationship links are real buttons, operable by keyboard. The
page uses semantic landmarks, visible focus states, status labels, responsive
layout, and reduced-motion handling. On narrow screens the major regions stack.

## Failure handling

If data cannot be loaded, the application replaces its loading state with a
plain-language error that includes the documented local-server remedy. Invalid
or dangling references are reported in the browser console and omitted from the
affected relationship or display rather than crashing the entire interface.
Unknown optional fields are omitted or shown as “Unknown” only where that label
helps comprehension; JavaScript `undefined` is never displayed.

## Verification

Verification will include:

- A dependency-free Node script that parses every JSON file and checks unique IDs
  and cross-file references.
- Focused unit tests for pure layout/status derivation functions using Node's
  built-in test runner where those functions warrant isolation.
- A local HTTP-server smoke test confirming all application and data resources
  return successfully.
- Browser inspection of the initial render, node selection, predecessor/successor
  navigation, roster statuses, narrow layout, and console output.
- A final file-structure and Git status review before committing and pushing.

## Documentation and future direction

`README.md` explains the project, local server command, structure, data ownership,
editing locations, and verification policy. It identifies GitHub as the source of
truth shared by the owner, ChatGPT, and Codex.

`PROJECT.md` is persistent domain guidance for future human and AI work. It
records the collection philosophy, BNSF predecessor focus, domain boundaries,
status semantics, data-quality rules, evolution-tree purpose, and future goals.
It will recommend considering per-prototype Markdown narratives when histories
become too substantial for comfortable JSON editing, without adding Markdown
processing to v0.1.

Deferred work includes researched locomotive specifications and histories,
prototype and model photographs, automatic graph layout, filters, railroad
genealogy visualization, editing tools, and persistence beyond source-controlled
JSON.
