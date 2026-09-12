import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCollectionFields,
  buildDetailFields,
  buildHistoricalFields,
  createNarrativeSections,
  displayValue,
} from "../src/details.js";

test("detail fields omit unknown facts and retain known zero values", () => {
  const fields = buildDetailFields({ builder: "EMD", model: "Test", years: null, horsepower: 0, axleConfiguration: null, tractionType: "AC", productionCount: null });
  assert.deepEqual(fields, [{ label: "Horsepower", value: "0" }, { label: "Traction", value: "AC" }]);
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
    livery: "Black/gray", walthersPartNumber: "187-2947",
    soundControl: "Paragon2 Sound & DCC", purchaseDate: null, purchasePrice: null,
  });
  assert.deepEqual(fields.map(({ label }) => label), [
    "Manufacturer", "Product number", "Scale", "Railroad", "Road number",
    "Livery", "Walthers part number", "Sound / control",
  ]);
  assert.ok(fields.every(({ value }) => value !== "Unknown"));
});
