import assert from "node:assert/strict";
import test from "node:test";

import * as railroadPages from "../src/railroad-pages.js";

const { paintSchemeEyebrow, railroadNarrativeParagraphs, railroadRelationships, sourceReferenceFor, statisticEntriesFor, verticalScaleForColumns } = railroadPages;

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
