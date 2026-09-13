# Tabbed Reference Navigation Design

## Purpose

Restructure American Diesel Roster from one long interactive page into a small,
bookmarkable historical reference site. The change preserves the existing
prototype, historical-locomotive, collection, order, railroad, and source data.
It changes navigation and page composition, not historical interpretation or
collection facts.

## Page architecture

The site uses two static HTML entry points and shared vanilla JavaScript:

- `index.html` renders a concise introduction at `/`. `/?view=collection`,
  `/?view=emd`, `/?view=alco`, `/?view=ge`, and `/?view=bnsf` select top-level
  reference views.
- `locomotive.html?id=<prototype-id>` renders one prototype detail view.

Both entry points use the same compact navigation and footer. A small shared
shell module owns the wordmark, navigation markup, and active-state
semantics. Page-specific modules render only the main content. This avoids large
HTML duplication without creating a client-side framework or custom router.

Navigation is URL-driven. Top-level tabs are ordinary links, tree nodes and
collection entries are ordinary links to detail URLs, and lineage relationships
are ordinary links between detail URLs. Browser Back, Forward, refresh, open in
new tab, and bookmarking therefore work without an in-memory navigation stack.

## Persistent shell

The navigation order is Collection, EMD, ALCO, GE, BNSF. Collection is the
first tab. The compact wordmark sits at the far left, links to the introductory
home page, and is followed by the navigation. The bar is full-width and sticky.
The current section is identified visually and with `aria-current="page"`.
On locomotive details, the manufacturer tab is active when it maps to a
top-level manufacturer view; EMD details therefore keep EMD active.

The existing restrained paper, serif-heading, and historical-reference style is
retained. The accepted prototype establishes these visual decisions:

- four-pixel status borders;
- very light status-tinted node backgrounds;
- footer legend swatches that use the same border thickness, tint, and color;
- a restrained underline for the active top-level tab.

The selected/focused state remains independent from status. Keyboard focus uses
the existing gold outline treatment rather than changing the collection color.

## Top-level views

### Collection

Collection joins the existing physical collection and active-order records for
display while preserving their distinct source types. It shows owned items and
ordered items with prototype name, railroad, road number, model manufacturer,
status, and an available model image where appropriate. Each row or card links
to its prototype detail URL.

Historical-only prototypes never appear as physical collection entries. Wanted
targets remain outside this initial Collection view.

The Collection column order is prototype, railroad, livery, road number, model
manufacturer, and store. When a verified manufacturer or retailer URL is known,
its name links to that external site in a new browser tab.

### Manufacturer views

Manufacturer selection is data-driven so a future manufacturer tree can be
added without changing the shell or URL scheme. EMD renders the existing tree.
ALCO and GE render the same page shell and a restrained “Not yet populated”
state; no data is invented.

The EMD tree retains the product series/lineage lanes NW, F, E, GP, and SD and
their current designation explanations. It does not reinterpret those lanes as
operating-role categories. Horizontal scrolling remains available when the tree
is wider than the viewport.

### BNSF

BNSF renders a concise placeholder explaining that the future view will contain
BNSF predecessor genealogy, a railroad timeline, and purchases by predecessor
roads. No genealogy or timeline visualization is included in this change.

## Tree nodes

Each node shows the prototype model and total prototype production count. Counts
use locale-friendly thousands separators, so NW1 displays `27` and NW2 displays
`1,145`. An unknown `productionCount` displays a subtle dash. No count is
invented.

Visible status words are removed. Status continues to be derived from the
existing physical item, active order, wanted intent, and historical-only
precedence. It is communicated through the accepted border/tint treatment and
matching legend. The node accessible name includes the model, production count
when known, and status, for example “NW2, 1,145 produced, owned.” A note below
the tree states: “Number in each node = total prototype production.”

Nodes are anchors linking to `locomotive.html?id=<prototype-id>`, not buttons
that update content farther down the page.

## Locomotive detail view

The dedicated detail page reuses the existing detail renderer and presentation
with only the adaptations required for a standalone page. It preserves prototype
specifications and narrative, historical locomotive records and timeline,
remote historical photography, owner model photography, collection information,
sources, and predecessor/successor relationships.

A lightweight Back control calls browser history when a previous entry exists;
the persistent navigation and lineage links remain available regardless. Browser
history is the natural return mechanism, while direct URL loading never depends
on prior state. An unknown or missing prototype ID produces a clear error inside
the shared shell rather than rendering an unrelated default locomotive.

## Data and rendering flow

A shared data loader fetches the existing JSON documents from paths that work
from both root-level HTML entry points. The loader returns the current data shape
unchanged. Existing model functions continue to derive prototype status, detail
data, and collection rows. Small URL helpers build and parse top-level and detail
URLs so behavior can be tested without a browser framework.

The top-level entry point parses `view`, defaults missing or unknown values to
the introductory home page, marks the active tab, and dispatches to the
Collection, manufacturer, or BNSF renderer. The detail entry point parses `id`, resolves that prototype,
marks the appropriate manufacturer tab, and renders the existing detail card.

Fetch failures retain a visible local-server instruction. Empty manufacturer
views and invalid detail IDs use explicit, accessible messages.

## Responsive behavior

Top-level navigation may scroll horizontally on very narrow screens rather than
wrapping into an ambiguous multi-row control. The EMD tree keeps its readable
minimum width and horizontal scrolling. Collection continues to use the existing
responsive table/card behavior. A detail page contains only one locomotive card,
eliminating the previous tree-to-detail vertical scroll.

## Verification

Automated coverage focuses on behavior rather than static markup:

- NW1 renders `27` and no visible “historical” text in its node;
- NW2 renders `1,145` and no visible “owned” text in its node;
- unknown production counts render a dash without fabrication;
- status classes and accessible names still reflect derived status;
- tree and collection links produce the expected detail URL;
- direct detail URL parsing renders the requested prototype without prior state;
- historical-only prototypes are absent from Collection;
- invalid detail IDs produce an explicit error.

Completion requires `npm test`, `node scripts/validate-data.js`, and
`git diff --check`, followed by browser smoke tests for Collection, EMD, ALCO,
GE, BNSF, NW1 detail, NW2 detail, refresh, and Back/Forward from detail to EMD.

## Scope exclusions

This change does not add or research locomotives, alter historical or collection
facts, implement BNSF genealogy, populate ALCO or GE, add advanced Collection
filters, redesign the detail card, introduce a backend, or add a framework.
