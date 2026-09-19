# BNSF paint-scheme history

## Scope and intent

Replace only the BNSF railroad page's paint-scheme placeholder with a chronological, photo-led historical reference. Preserve the existing hero, lineage, statistics, navigation, and other railroad pages. Browser-review iterations expanded the original brief to sixteen accepted entries. This is a history of recognizable BNSF-branded appearances, not a catalog of every predecessor locomotive with a reporting-mark patch.

## Data

`data/railroads/bnsf.json` stores sixteen ordered `paintSchemes` objects. Each has a stable `id`, name, first-use year when known, optional descriptive period label, category, representative locomotive, concise description, and `sourceIds`. A `photo` object carries an original source page, a verified direct remote image URL, caption, credit, and optional date. For entries without a verified end date, use a descriptive period label rather than implying that the livery disappeared when new application ended. The acquired blue-and-white locomotives are documented by 2010, but their acquisition year is left unknown.

Reusable source records belong in `data/sources.json`; scheme records cite them by stable ID. Source-page URLs are not embedded in narrative prose. A representative image must depict the stated locomotive in the stated appearance. Galleries and article pages are not treated as image URLs. No third-party images are copied into the repository.

The existing railroad records contain either empty arrays or simple string arrays. The renderer continues to handle those without errors; only structured entries get the new visual-history treatment.

## Presentation

The BNSF section presents sixteen substantial entries in first-appearance order beneath the Paint schemes heading. Each entry has a large photograph on one side and title, period label, category text, representative locomotive, and historical narrative on the other. Narrow layouts stack photograph before text. H4 is not presented as a replacement for H3.

Every photo links to its original source in a new tab and shows credit/source text. Failed hotlinks reveal a source-preserving fallback like the locomotive-detail page. No image is silently replaced with a different locomotive, and no unverified image URL is invented. Every entry needs a representative prototype photograph and original-source link; H4 and gallery-only sources are explicit research gates.

## Research and accuracy gates

Before adding each entry to authoritative data, verify its locomotive identity, paint appearance, chronology, and image provenance against the supplied sources and stronger primary or railroad-photo records where available. Resolve any conflict openly rather than smoothing it over. The Green Warbonnet, Great Pumpkin, Golden Swoosh, two BNSF-branded predecessor treatments, and the 25th Anniversary program remain separate entries. A photo of 7695 must show its gold/yellow emblem, not the adjacent H3 locomotive.

If a photo cannot be hotlinked appropriately, retain a verified original-source link and show the existing fallback presentation during review; do not download the file as a workaround. If no representative photo can be verified, stop short of calling the sixteen-entry result complete and report the specific unresolved entry.

## Verification and retention

First show a small, uncommitted browser candidate to settle the visual treatment. Once the user explicitly accepts it, preserve visual evidence, clean up the implementation, and add tests for ordering, required data, citation and photo fields, fallback behavior, missing/legacy scheme arrays, and genealogy navigation. Run the full test suite, data validation, `git diff --check`, and desktop/mobile browser checks before any commit or push. The accepted BNSF overview/statistics work is included in the same PR.
