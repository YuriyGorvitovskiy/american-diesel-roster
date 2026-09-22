import assert from "node:assert/strict";
import test from "node:test";

import { paintSchemeEyebrow, railroadNarrativeParagraphs, railroadRelationships, statisticEntriesFor, verticalScaleForColumns } from "../src/railroad-pages.js";

test("railroad relationships resolve navigable predecessor and successor records", () => {
  const railroads = [
    { id: "slse", slug: "slse", name: "Seattle, Lake Shore & Eastern" },
    { id: "spokane-palouse", slug: "spokane-palouse", name: "Spokane & Palouse Railway" },
    { id: "northern-pacific", slug: "np", name: "Northern Pacific Railway", predecessors: ["slse", "spokane-palouse"], successor: "burlington-northern" },
    { id: "burlington-northern", slug: "bn", name: "Burlington Northern" },
  ];

  const relationships = railroadRelationships(railroads[2], railroads);
  assert.deepEqual(relationships.predecessors.map(({ slug }) => slug), ["slse", "spokane-palouse"]);
  assert.equal(relationships.successor.slug, "bn");
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
