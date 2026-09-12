# CB&Q 9245 NW2 Collection Card Design

## Scope

Add the first fully researched owned locomotive card: an EMD NW2 prototype, the
specific historical locomotive CB&Q 9245, and the owner's Broadway Limited
Imports HO model. This change establishes a reusable three-level identity model
without redesigning the existing tree, researching unrelated locomotives,
adding dependencies, downloading images, or changing existing collection facts.

## Domain boundaries

The data model will represent three distinct concepts:

1. `emd-nw2` is a generic locomotive `Prototype` in `data/locomotives.json`.
2. `cbq-9245` is a real `HistoricalLocomotive` in the new
   `data/historical-locomotives.json`.
3. `collection-cbq-9245-bli` is the owner's physical HO `CollectionItem` in
   `data/collection.json`.

The historical locomotive references the prototype by `prototypeId`. The
collection item references both with `prototypeId` and
`historicalLocomotiveId`. Road-number-specific biography never appears on the
generic prototype. Model-manufacturer and owner-specific facts never appear on
the prototype or historical locomotive.

The NW2 prototype keeps `collectionRelevance: "historical_only"`. Its displayed
`owned` status is derived only from the physical collection item, preserving the
status precedence established in PR #1.

## Prototype and tree

The NW2 prototype will store:

- Builder EMD, model NW2, role `switcher`
- February 1939 through December 1949
- 1,000 horsepower
- B-B axle configuration
- Diesel-electric power type
- EMD 12-567 or 12-567A prime mover
- V12 engine configuration
- Production count 1,145
- A concise narrative describing its early mass-production significance and
  role in establishing the 567 generation

The tree gains a `switcher` lane containing NW2. The lane is added to the
existing fixed-lane configuration; the layout algorithm is not redesigned.
NW1 is not added in this change because doing so would create a second,
deliberately incomplete prototype outside the focused researched card. The NW2
starts with empty predecessor and successor arrays until switcher genealogy is
expanded deliberately.

## Historical locomotive

`data/historical-locomotives.json` will contain a top-level
`historicalLocomotives` array. `cbq-9245` stores:

- `prototypeId: "emd-nw2"`
- Original identity: CB&Q 9245
- Build date August 1946
- EMD serial 3641
- EMD order E699
- Frame E699-26
- Later identity: Burlington Northern 542
- Retirement date May 1983
- A concise narrative that distinguishes documented October 1964 slogan use
  from the January 1966 photograph without claiming a broader paint-date range

Railroad identities use existing stable railroad IDs. Later identities are an
array so the pattern can represent multiple renumberings or owners later.

## Physical collection item

The new owner-confirmed collection item stores:

- `prototypeId: "emd-nw2"`
- `historicalLocomotiveId: "cbq-9245"`
- Broadway Limited Imports; HO scale
- CB&Q; road number 9245
- Black/gray livery with “Way of the Zephyrs” slogan
- Paragon2 Sound & DCC
- Manufacturer product number 2947
- Walthers part number 187-2947
- Null purchase date, price, retailer, decoder address, and other unknown facts

The item's local image path remains null. Product-source metadata records the
exact model without copying or hotlinking its catalog image.

## Research provenance

The new `data/sources.json` contains reusable records with stable ID, title,
publisher/site, URL, access date, and source type. Prototype, historical
locomotive, collection item, and image-reference records cite sources through
`sourceIds`; URLs are not embedded into narrative prose.

The six supplied sources are recorded:

- [EMD NW2 — Wikipedia](https://en.wikipedia.org/wiki/EMD_NW2)
- [EMD NW2 Switchers — American-Rails](https://www.american-rails.com/d139.html)
- [CB&Q 9245 photographs and identity — RR Picture Archives](https://www.rrpicturearchives.net/Locopicture.aspx?id=71202)
- [Burlington Northern NW2 roster — BN Photo Archives](https://archive.trainpix.com/bn/EMDORIG/NW2/INDEX.HTM)
- [BLI CB&Q 9245 product — Walthers](https://www.walthers.com/emd-nw2-w-sound-dcc-paragon2-tm-chicago-burlington-quincy-9245-black-gray-way-of-the-zephyrs-slogan)
- [BLI Paragon2 NW2 product announcement — PWRS](https://www.pwrs.ca/announcements/view.php?ID=8853)

Where sources conflict, claims use the explicitly corroborated value and retain
all source records. In particular, production count is 1,145; the conflicting
1,139 figure on American-Rails is not copied into data.

## Application flow and UI

`app.js` loads prototypes, collection items, orders, railroads, historical
locomotives, and sources concurrently. Model helpers index historical
locomotives and sources, then build a detail view model for the selected
prototype.

The existing detail card retains the prototype heading, status, specifications,
narrative, and genealogy. When records exist it adds:

1. A “Historical locomotive” section showing railroad, road number, build date,
   serial, order, frame, later identity, retirement, and narrative.
2. A “Collection model” section showing manufacturer, product number, scale,
   railroad, road number, livery, Walthers number, sound/control, and owned
   status.
3. A compact “Sources” list using source titles as external links.

Only non-null fields render. Data strings are assigned with `textContent`.
Existing roster behavior stays intact, with NW2 appearing as a second owned row.

## Validation and failure behavior

The validator loads both new data files, checks uniqueness in every collection,
and verifies all new `prototypeId`, `railroadId`,
`historicalLocomotiveId`, and `sourceIds` references. It also validates source
references in image metadata when present. A dangling reference makes CLI
validation fail with an entity-specific message.

Browser loading failure continues to use the existing fatal error treatment.
Missing optional display fields are omitted rather than rendered as `null` or
`undefined`. A missing related record is skipped so one malformed relationship
does not crash the entire card; the CLI validator remains the authoritative
guard before data is committed.

## Tests and verification

Tests will prove:

- `emd-nw2` exists with 1,000 hp, B-B configuration, and production count 1,145.
- `cbq-9245` references `emd-nw2` and the expected railroad identities.
- `collection-cbq-9245-bli` references both entities correctly.
- NW2 status derives as owned from `collection.json` and falls back to
  historical-only when that item is removed.
- New IDs and references validate without dangling targets.
- Historical and collection view models omit null and undefined fields.
- The tree adds the switcher lane without changing the existing lane layout
  algorithm.

Completion requires `npm test`, `node scripts/validate-data.js`,
`git diff --check`, HTTP checks for all data files, and a browser smoke test of
the NW2 node and complete three-level card.
