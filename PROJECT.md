# American Diesel Roster — Project Context

## Project purpose

American Diesel Roster is not merely an inventory. It is an interactive
historical reference that explains the development of American diesel
locomotives through the owner's HO-scale collection. Its central navigation path
is: evolution tree → locomotive detail → predecessor or successor → collection
information.

## Collection philosophy

The collection represents major stages in diesel development rather than every
locomotive produced. Prefer historically important, substantially mass-produced
types. Experimental and very small-production types normally need not be owned,
although transitional or unsuccessful designs can provide important context in
the historical tree without becoming purchase targets.

Four-axle GP and six-axle SD development are both important. Passenger cab units
and freight/road-switcher development are separate branches. Technological
transitions, including DC to AC traction, should eventually be visible.
Historically authentic repaint schemes are acceptable; a model need not show its
prototype's as-built paint. The goal is to tell diesel history through the
collection, not to turn every interesting locomotive into a recommendation.

## Railroad scope

The principal focus is BNSF and its predecessor lineage: Great Northern,
Northern Pacific, Chicago, Burlington & Quincy, Spokane, Portland & Seattle,
Burlington Northern, and BNSF. Union Pacific is not a primary collection
railroad. Railroad records use stable IDs and can later support a separate
corporate-lineage visualization.

SP&S representation is a confirmed collection gap.

## Prototype, historical locomotive, and collection-item distinction

A Prototype describes a real locomotive class: builder, model, dates,
horsepower, axle configuration, traction, production, history, operators,
images, and predecessor/successor relationships.

A Historical Locomotive describes one real locomotive identity, such as CB&Q
9245: its prototype class, railroad identities and road numbers, build record,
serial and order numbers, renumberings, retirement, photographs, and individual
biography. Road-number-specific history must never be placed on the generic
Prototype because it does not apply to every member of the class.

A Collection Item describes one physical HO model: prototype reference,
railroad, road number, model manufacturer, SKU, purchasing information, notes,
and photographs. When it represents a known real locomotive, it references both
the Prototype and Historical Locomotive. Multiple items may reference the same
prototype or historical identity. These concepts must never be collapsed.

Orders are separate records because an ordered model is not yet a physical
collection item. The UI may join both record types for display but must preserve
their origin and meaning.

## Status semantics

- `owned`: derived only from an owner-confirmed record in `data/collection.json`.
- `ordered`: derived only from an active record in `data/orders.json`.
- `wanted`: the prototype is a confirmed collection target or gap, without a
  physical item or active order.
- `historical_only`: the prototype explains history but is not currently a
  collection target.

Prototype-level collection intent is limited to `wanted` and `historical_only`.
It never stores `owned` or `ordered`, because those states have authoritative
records elsewhere. The displayed status uses physical collection item, active
order, wanted intent, then historical-only intent precedence. Historical-only is
a prototype's relationship to the collection, not a pretend physical object.

## Data quality

Unknown is preferable to guessed. Never fabricate ownership, dates, horsepower,
production totals, operators, technical details, road numbers, manufacturers,
prices, SKUs, or order dates. Use `null` or an empty collection until reliable
research or owner confirmation is available. Historical research must be cited
and verified before it enters the catalog.

Known facts at v0.1 are deliberately limited:

- EMD F3 is owned; railroad, road number, and manufacturer are unknown.
- Great Northern orange/green EMD GP35 is ordered.
- Rapido EMD E7A, CB&Q silver/Zephyr, road number 9931B, is ordered through
  TrainWorld with a $0 preorder deposit.
- EMD SD9 and ALCO RS-3 are wanted; CB&Q is an interesting SD9 target.
- ALCO C425 is absent as a class and GE AC4400CW is a later historical gap.

## Evolution tree

The tree is primary navigation, not decoration. Relationships live in data as ID
arrays and must permit branching. The initial fixed-lane layout is a legible
v0.1 compromise, not a permanent graph engine. Transitional prototypes may
appear even when they are not collection targets.

## Narrative and images

Narrative history may eventually span several paragraphs. JSON arrays are
adequate for v0.1. When editing becomes cumbersome, consider one Markdown file
per prototype, but do not add Markdown processing until there is a concrete
need.

Prototype images and photographs of collection items remain separate. Store
local paths with caption, source, and credit metadata. Do not hotlink or download
unverified images.

## Research provenance

Reusable source metadata belongs in `data/sources.json`. Domain records cite it
with stable `sourceIds`; narrative prose should not contain raw source URLs.
Source metadata may be recorded even when copyright or licensing prevents a
referenced image from being stored locally. Conflicting sources must remain
visible in provenance, while the catalog stores only the best-supported value
and documents material uncertainty.

## Future goals

- Verified technical specifications and long-form histories
- Prototype and physical-model photography
- Builder, axle, traction, collection-status, railroad, and era filters
- ALCO and GE evolution branches
- Railroad genealogy visualization
- More capable automatic graph layout when the catalog demands it
- Accessible editing or data-maintenance tools if source JSON becomes limiting

## Instructions for AI assistants

1. Read PROJECT.md before making domain changes.
2. Never invent collection ownership.
3. Never invent prototype facts.
4. Unknown is preferable to guessed.
5. Preserve prototype/collection separation.
6. Transitional locomotives may belong in the historical tree without being purchase targets.
7. Do not turn every historically interesting locomotive into a recommendation to buy.
8. Changes to collection status must be based on owner confirmation.
9. Keep historical narrative separate from HO-model purchasing data.
10. Prefer historically significant mass-production representatives when suggesting collection gaps.
11. Keep road-number-specific biography on a Historical Locomotive, never on its generic Prototype.
12. Preserve source provenance through stable IDs and never substitute a similar locomotive image for the exact subject.
