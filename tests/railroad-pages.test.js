import assert from "node:assert/strict";
import test from "node:test";

import * as railroadPages from "../src/railroad-pages.js";

const { paintSchemeEyebrow, paintSchemesIntroText, railroadNarrativeParagraphs, railroadRelationships, sourceReferenceFor, statisticEntriesFor, verticalScaleForColumns } = railroadPages;

test("railroad relationships resolve navigable predecessor and successor records", () => {
  const railroads = [
    { id: "atn", slug: "atn", name: "Alabama, Tennessee & Northern Railroad" },
    { id: "frisco", slug: "frisco", name: "St. Louis–San Francisco Railway", predecessors: ["atn"], successor: "burlington-northern" },
    { id: "burlington-northern", slug: "bn", name: "Burlington Northern" },
  ];

  const relationships = railroadRelationships(railroads[1], railroads);
  assert.deepEqual(relationships.predecessors.map(({ slug }) => slug), ["atn"]);
  assert.equal(relationships.predecessorLabel, "Predecessors");
  assert.equal(relationships.successor.slug, "bn");
});

test("railroad genealogy subtitle derives its diesel-era count from the loaded collection", () => {
  assert.equal(
    railroadPages.genealogySubtitle?.(Array.from({ length: 17 })),
    "17 railroads in the diesel-era lineage of today’s BNSF Railway. Select any company to open its record.",
  );
});

test("railroad relationships support an affiliate label without changing their links", () => {
  const railroads = [
    { id: "oregon-electric", slug: "oregon-electric", name: "Oregon Electric Railway" },
    { id: "oregon-trunk", slug: "oregon-trunk", name: "Oregon Trunk Railway" },
    {
      id: "spokane-portland-seattle",
      slug: "sps",
      name: "Spokane, Portland and Seattle Railway",
      predecessors: ["oregon-electric", "oregon-trunk"],
      predecessorLabel: "Affiliates",
    },
  ];

  const relationships = railroadRelationships(railroads[2], railroads);
  assert.equal(relationships.predecessorLabel, "Affiliates");
  assert.deepEqual(relationships.predecessors.map(({ slug }) => slug), ["oregon-electric", "oregon-trunk"]);
});

test("railroad genealogy expands vertical spacing for zoomed card heights", () => {
  const positions = [
    { x: 100, baseY: 72, railroad: { id: "first" } },
    { x: 100, baseY: 184, railroad: { id: "second" } },
    { x: 350, baseY: 128, railroad: { id: "other-column" } },
  ];
  const heights = new Map([
    ["first", 140],
    ["second", 140],
    ["other-column", 300],
  ]);

  assert.equal(verticalScaleForColumns(positions, heights), 160 / 112);
});

test("railroad genealogy keeps its accepted spacing when cards already fit", () => {
  const positions = [
    { x: 100, baseY: 72, railroad: { id: "first" } },
    { x: 100, baseY: 184, railroad: { id: "second" } },
  ];
  const heights = new Map([["first", 66], ["second", 66]]);

  assert.equal(verticalScaleForColumns(positions, heights), 1);
});

test("CB&Q uses the common five-field operating-scale order", () => {
  assert.deepEqual(statisticEntriesFor({ id: "chicago-burlington-quincy" }), [
    ["routeMiles", "System mileage"],
    ["employees", "Employees"],
    ["locomotives", "Locomotives"],
    ["rollingStock", "Non-locomotive rolling stock"],
    ["capitalization", "Capitalization"],
  ]);
});

test("Great Northern uses the shared five-field operating-scale order", () => {
  assert.deepEqual(statisticEntriesFor({ id: "great-northern" }), [
    ["routeMiles", "System mileage"],
    ["employees", "Employees"],
    ["locomotives", "Locomotives"],
    ["rollingStock", "Non-locomotive rolling stock"],
    ["capitalization", "Capitalization"],
  ]);
});

test("Northern Pacific uses the shared five-field operating-scale order", () => {
  assert.deepEqual(statisticEntriesFor({ id: "northern-pacific" }), [
    ["routeMiles", "System mileage"],
    ["employees", "Employees"],
    ["locomotives", "Locomotives"],
    ["rollingStock", "Non-locomotive rolling stock"],
    ["capitalization", "Capitalization"],
  ]);
});

test("SP&S uses the shared five-field operating-scale order", () => {
  assert.deepEqual(statisticEntriesFor({ id: "spokane-portland-seattle" }), [
    ["routeMiles", "System mileage"],
    ["employees", "Employees"],
    ["locomotives", "Locomotives"],
    ["rollingStock", "Non-locomotive rolling stock"],
    ["capitalization", "Capitalization"],
  ]);
});

test("BNSF and future railroads use the shared five-field operating-scale order", () => {
  const expected = [
    ["routeMiles", "System mileage"],
    ["employees", "Employees"],
    ["locomotives", "Locomotives"],
    ["rollingStock", "Non-locomotive rolling stock"],
    ["capitalization", "Capitalization"],
  ];
  assert.deepEqual(statisticEntriesFor({ id: "bnsf" }), expected);
  assert.deepEqual(statisticEntriesFor({ id: "future-railroad" }), expected);
});

test("railroad sources without URLs render as text instead of broken links", () => {
  assert.deepEqual(sourceReferenceFor({ title: "Annual report", publisher: "Railroad", url: "https://example.com/report" }), {
    label: "Annual report — Railroad",
    url: "https://example.com/report",
  });
  assert.deepEqual(sourceReferenceFor({ title: "Archival source", publisher: "Archive" }), {
    label: "Archival source — Archive",
    url: null,
  });
});

test("railroad narratives support multiple historical overview paragraphs", () => {
  assert.deepEqual(
    railroadNarrativeParagraphs({ history: ["First paragraph.", "Second paragraph."], description: "Summary." }),
    ["First paragraph.", "Second paragraph."],
  );
  assert.deepEqual(railroadNarrativeParagraphs({ description: "Existing summary." }), ["Existing summary."]);
});

test("paint scheme headings omit an unsupplied category", () => {
  assert.equal(paintSchemeEyebrow({ periodLabel: "1926–1941" }), "1926–1941");
  assert.equal(paintSchemeEyebrow({ periodLabel: "1941–1962", category: "Passenger" }), "1941–1962 · Passenger");
});

test("paint scheme galleries expose their optional introductory copy", () => {
  assert.equal(
    paintSchemesIntroText({ paintSchemesIntro: "Railroad-specific context." }),
    "Railroad-specific context.",
  );
  assert.equal(paintSchemesIntroText({}), null);
});

test("paint scheme references resolve a railroad and its section link", () => {
  const reference = railroadPages.paintSchemesReferenceFor?.(
    { paintSchemesReference: "santa-fe" },
    [{ id: "santa-fe", slug: "atsf", name: "Atchison, Topeka & Santa Fe Railway" }],
  );

  assert.deepEqual(reference, {
    railroad: { id: "santa-fe", slug: "atsf", name: "Atchison, Topeka & Santa Fe Railway" },
    href: "/railroads/atsf#paint-schemes",
  });
});

test("paint scheme references resolve multiple sponsor sections in order", () => {
  const railroads = [
    { id: "chicago-burlington-quincy", slug: "cbq" },
    { id: "burlington-northern", slug: "bn" },
  ];
  assert.deepEqual(railroadPages.paintSchemesReferencesFor?.({
    paintSchemesReferences: railroads.map(({ id }) => id),
  }, railroads), railroads.map((railroad) => ({
    railroad, href: `/railroads/${railroad.slug}#paint-schemes`,
  })));
  assert.deepEqual(railroadPages.paintSchemesReferencesFor?.({ paintSchemesReference: "burlington-northern" }, railroads), [
    { railroad: railroads[1], href: "/railroads/bn#paint-schemes" },
  ]);
  assert.deepEqual(railroadPages.paintSchemesReferencesFor?.({}, railroads), []);
});

test("paint-scheme media keeps the original beside the AI version without changing either record", () => {
  const original = { remoteImageUrl: "https://archive.example/original.jpg", sourcePage: "https://archive.example/item", caption: "Original No. 239", credit: "Photographer", date: "1964-03-28" };
  const photo = { localPath: "/images/repaint.png", sourcePage: original.sourcePage, caption: "AI repaint No. 200", credit: "AI repaint", kind: "AI repaint from historical photograph" };
  const scheme = { referencePhoto: original, photo };
  const before = structuredClone(scheme);
  const assets = railroadPages.paintSchemeImages?.(scheme);
  assert.deepEqual(assets?.map(({ type, src, caption }) => ({ type, src, caption })), [
    { type: "historical", src: original.remoteImageUrl, caption: original.caption },
    { type: "reconstruction", src: photo.localPath, caption: photo.caption },
  ]);
  assert.equal(assets[0].sourceUrl, original.sourcePage);
  assert.equal(assets[0].credit, original.credit);
  assert.equal(assets[0].date, original.date);
  assert.equal(assets[1].kind, photo.kind);
  assert.deepEqual(scheme, before);
});

test("paint-scheme media preserves standalone original photos and existing ATSF image arrays", () => {
  const photo = { remoteImageUrl: "https://archive.example/original.jpg", sourcePage: "https://archive.example/item", caption: "Original", credit: "Photographer" };
  assert.deepEqual(railroadPages.paintSchemeImages?.({ photo })?.map(({ type, src }) => ({ type, src })), [
    { type: "historical", src: photo.remoteImageUrl },
  ]);
  const images = [{ type: "historical", src: photo.remoteImageUrl }, { type: "reconstruction", src: "/images/ai.png" }];
  assert.deepEqual(railroadPages.paintSchemeImages?.({ images }), images);
  assert.deepEqual(railroadPages.paintSchemeImages?.({ image: { kind: "pending" } }), []);
});
