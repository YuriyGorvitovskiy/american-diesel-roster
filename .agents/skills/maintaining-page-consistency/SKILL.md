---
name: maintaining-page-consistency
description: Use when adding or changing railroad historical pages or locomotive detail pages in American Diesel Roster, especially section headings, statistical comparisons, fact labels, or field order.
---

# Maintain page consistency

Use the existing page components as the source of truth for shared presentation. A railroad's dates and historical interpretation belong in its content, while a section that serves the same purpose across railroads keeps the same heading and field sequence.

## Railroad pages

- Keep the shared section headings `Relationships`, `Operating scale`, `Paint schemes`, and `Sources` where those sections apply. Put railroad-specific periods in snapshot labels and dates, not in the `Operating scale` heading. A page without supplied statistics may retain the generic `Statistics` placeholder until it has snapshots.
- In a two-snapshot historical comparison with the five common fields, use this order in both columns: **System mileage → Employees → Locomotives → Non-locomotive rolling stock → Capitalization**. Keep labels and units precise to the source: route miles and total track miles are different measures.
- Preserve additional fields already documented for a railroad. Group them near the related common measure; do not erase or relabel them merely to make every page have identical fields.
- Keep unknown values visible as unavailable or omit them according to the existing component. Do not derive a locomotive/car split from a combined fleet total.

## Locomotive pages

- Reuse the existing section names for the same content: `Historical locomotive`, `Collection model`, `Incoming model`, `Sources`, `Predecessors`, and `Successors`.
- Keep prototype technical facts in the `buildDetailFields` order: **Role → Years → Horsepower → Axles → Traction → Prime mover → Engine → Production**. Keep historical identity, physical model, and incoming order facts in their own existing field groups; omit unknown facts rather than inventing placeholders.

## Before retaining a change

Compare the changed page with at least one peer page of the same kind. Check heading text, heading level, metric order, label meaning, units, approximate marks, and responsive layout. Update shared rendering code for a shared convention; use data for genuinely railroad-specific facts. Follow the repository's interactive-prototype process when presentation is being reviewed in the browser.
