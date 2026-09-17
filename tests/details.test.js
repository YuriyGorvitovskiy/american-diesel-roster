import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCollectionFields,
  buildDetailFields,
  buildHistoricalFields,
  buildImageItems,
  buildOrderFields,
  buildTimelineItems,
  createNarrativeSections,
  detailSectionHeadingTag,
  displayValue,
  relationshipView,
  showImageFallback,
} from "../src/details.js";

test("standalone detail sections continue below the page H1 at heading level two", () => {
  assert.equal(detailSectionHeadingTag(false), "h2");
  assert.equal(detailSectionHeadingTag(true), "h3");
});

test("detail fields omit unknown facts and retain known zero values", () => {
  const fields = buildDetailFields({ builder: "EMD", model: "Test", years: null, horsepower: 0, axleConfiguration: null, tractionType: "AC", productionCount: null });
  assert.deepEqual(fields, [{ label: "Horsepower", value: "0" }, { label: "Traction", value: "AC" }]);
});

test("lineage relationships link to bookmarkable detail URLs", () => {
  assert.deepEqual(relationshipView({ id: "emd-nw2", builder: "EMD", model: "NW2" }), {
    label: "EMD NW2",
    href: "./locomotive.html?id=emd-nw2",
  });
});

test("narrative sections preserve separate paragraphs", () => {
  assert.deepEqual(createNarrativeSections({ narrative: ["First.", "Second."] }), ["First.", "Second."]);
});

test("display values distinguish missing data from zero", () => {
  assert.equal(displayValue(null), "Unknown");
  assert.equal(displayValue(0), "0");
});

test("prototype details include researched role and engine fields", () => {
  const fields = buildDetailFields({
    role: "Switcher", years: "1939–1949", horsepower: 1000,
    axleConfiguration: "B-B", tractionType: "Diesel-electric",
    primeMover: "EMD 12-567 or 12-567A", engineConfiguration: "V12",
    productionCount: 1145,
  });
  assert.deepEqual(fields.map(({ label }) => label), [
    "Role", "Years", "Horsepower", "Axles", "Traction",
    "Prime mover", "Engine", "Production",
  ]);
});

test("historical fields show verified identity and omit missing values", () => {
  const fields = buildHistoricalFields({
    railroadName: "Chicago, Burlington & Quincy", roadNumber: "9245",
    builtDate: "1946-08", serialNumber: "3641", orderNumber: "E699",
    frameNumber: "E699-26", builtAs: "CB&Q 9245",
    laterIdentities: [{ railroadName: "Burlington Northern", roadNumber: "542" }],
    retiredDate: "1983-05", unknownFact: null,
  });
  assert.deepEqual(fields.map(({ value }) => value), [
    "Chicago, Burlington & Quincy", "9245", "August 1946", "3641",
    "E699", "E699-26", "CB&Q 9245", "Burlington Northern 542", "May 1983",
  ]);
});

test("collection fields show model facts and hide unknown ownership details", () => {
  const fields = buildCollectionFields({
    manufacturer: "Broadway Limited Imports", manufacturerProductNumber: "2947",
    scale: "HO", railroadName: "Chicago, Burlington & Quincy", roadNumber: "9245",
    livery: "Black/gray", soundControl: "Paragon2 Sound & DCC",
    purchaseDate: null, purchasePrice: null,
  });
  assert.deepEqual(fields.map(({ label }) => label), [
    "Manufacturer", "Product number", "Scale", "Railroad", "Road number",
    "Livery", "Sound / control",
  ]);
  assert.ok(fields.every(({ value }) => value !== "Unknown"));
});

test("incoming model fields expose preorder-specific facts", () => {
  const fields = buildOrderFields({
    manufacturer: "ScaleTrains", productLine: "Rivet Counter", manufacturerSku: "SXT43710",
    scale: "HO (1:87.1)", railroadName: "BNSF", roadNumber: "3674", livery: "Heritage III",
    soundControl: "DCC & Sound · ESU LokSound 5", expectedDate: "2027-02",
  });
  assert.deepEqual(fields, [
    { label: "Manufacturer", value: "ScaleTrains" },
    { label: "Product line", value: "Rivet Counter" },
    { label: "Item number", value: "SXT43710" },
    { label: "Scale", value: "HO (1:87.1)" },
    { label: "Railroad", value: "BNSF" },
    { label: "Road number", value: "3674" },
    { label: "Livery", value: "Heritage III" },
    { label: "Sound / control", value: "DCC & Sound · ESU LokSound 5" },
    { label: "Expected delivery", value: "February 2027" },
  ]);
});

test("image items preserve local owner and remote reference provenance", () => {
  assert.deepEqual(buildImageItems([
    { type: "collection-model", localPath: "images/model.jpg", sourcePage: null, remoteImageUrl: null, caption: "BLI model", credit: "Owner photograph", date: null, storage: "local-owner" },
    { type: "historical-prototype", localPath: null, sourcePage: "https://example.com/source", remoteImageUrl: "https://example.com/9245.jpg", caption: "CB&Q 9245 in service", credit: "Chuck Zeiler", date: "1964-10-11", storage: "remote" },
    { type: "historical-prototype", localPath: null, sourcePage: null, remoteImageUrl: "https://example.com/orphan.jpg", caption: "Missing source", credit: "Unknown", date: "1964-10-11", storage: "remote" },
  ]), [
    { type: "collection-model", src: "images/model.jpg", sourcePage: null, caption: "BLI model", credit: "Owner photograph", date: null, attribution: "Owner photograph", storage: "local-owner" },
    { type: "historical-prototype", src: "https://example.com/9245.jpg", sourcePage: "https://example.com/source", caption: "CB&Q 9245 in service", credit: "Chuck Zeiler", date: "1964-10-11", attribution: "Chuck Zeiler · October 11, 1964", storage: "remote" },
  ]);
});

test("failed remote images reveal their source-preserving fallback", () => {
  const visual = { hidden: false };
  const fallback = { hidden: true };
  showImageFallback(visual, fallback);
  assert.equal(visual.hidden, true);
  assert.equal(fallback.hidden, false);
});

test("historical timeline presents complete events in year-month format", () => {
  assert.deepEqual(buildTimelineItems([
    { date: "1946-08", event: "Built as CB&Q 9245." },
    { date: "1964-10", event: "Prototype photographed." },
    { date: null, event: "Undated event." },
  ]), [
    { date: "1946-08", label: "1946, August", event: "Built as CB&Q 9245." },
    { date: "1964-10", label: "1964, October", event: "Prototype photographed." },
  ]);
});
