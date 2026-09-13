# GE Evolution Tree Design

## Goal

Add a complete, readable North American GE road-locomotive evolution page from the Universal Series through the ET44 generation. Reuse the existing evolution-tree nodes, status treatment, production counts, links, and interaction. The four current orders remain the only ordered records; all newly introduced prototypes are historical context.

## Scope

Include the principal serial-production domestic road models needed to show GE's progression. Exclude export-only, industrial, gas-turbine, passenger, rebuild, and one-off experimental locomotives. This first interactive iteration establishes the tree structure and visual grouping; detailed individual cards can be enriched later from cited research.

## Visual organization

The GE page uses named generation sections instead of EMD family lanes:

1. **U-Series**
   - B-B: U25B → U28B → U30B → U33B → U36B
     - U23B branches below U25B and aligns beneath U28B.
   - C-C: U25C → U28C → U30C → U33C → U36C
     - U23C branches below U25C and aligns beneath U28C.
2. **Dash Series** — one section with visible Dash 7, Dash 8, and Dash 9 stages
   - B-B: B23-7 / B30-7 / B36-7 → B32-8 / B36-8 / B40-8 → B40-9
   - C-C: C30-7 / C36-7 → C32-8 / C39-8 / C40-8 / C44-8 → C40-9 / C44-9
3. **Evolution Series**
   - DC · C-C: ES44DC
   - AC · C-C: ES44AC → ET44AC
   - AC · A1A-A1A (C4): ES44C4 → ET44C4

Models separated by slashes occupy the same generation stage and may branch from the same predecessor rather than implying a false strict sequence.

## Data and relationships

Each node remains a normal Prototype record with verified model name, production years, total production when available, axle arrangement, traction type, collection relevance, sources, predecessors, and successors. Relationships describe model-family development, not ownership or corporate railroad succession.

U25B and U33C retain their existing ordered status derived from `data/orders.json`. Their current direct relationship is removed because four- and six-axle Universal lines are separate. New nodes use `historical_only` and must not create purchase recommendations.

## Rendering

The tree renderer gains a manufacturer-specific lane configuration. Existing EMD and ALCO presentation must remain unchanged. GE row headings are configuration data. U23B and U23C use a localized orthogonal branch that enters the left edge of each node; all other nodes reuse the existing edge drawing.

The initial layout may be wider than the viewport and use the existing horizontal scrolling container. No new graph-layout dependency is introduced.

## Research and provenance

Unknown values remain null. Production figures and dates shown in nodes require stable source records in `data/sources.json`. Operator timelines are not added speculatively; when later populated, counts must follow the project rule and include only locomotives actually operated by each railroad.

## Prototype acceptance

The running GE page should visibly show all three named series sections, distinct B-B and C-C lines, the C4 Evolution branch, continuous readable edges, U23B/U23C branches beneath U28B/U28C, and ordered emphasis on U25B and U33C. The accepted result is preserved by automated layout assertions before integration.
