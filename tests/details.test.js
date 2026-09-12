import assert from "node:assert/strict";
import test from "node:test";

import { buildDetailFields, createNarrativeSections, displayValue } from "../src/details.js";

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
