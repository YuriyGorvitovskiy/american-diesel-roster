import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles } from "../scripts/validate-data.js";
import {
  buildRosterRows,
  derivePrototypeStatus,
  formatPrototypeName,
  getRelatedPrototypes,
  indexById,
} from "../src/model.js";

const data = await loadDataFiles(new URL("..", import.meta.url));

test("prototype status reflects physical and planning records", () => {
  assert.equal(derivePrototypeStatus("emd-f3", data), "owned");
  assert.equal(derivePrototypeStatus("emd-gp35", data), "ordered");
  assert.equal(derivePrototypeStatus("emd-e7", data), "ordered");
  assert.equal(derivePrototypeStatus("emd-sd9", data), "wanted");
  assert.equal(derivePrototypeStatus("emd-ft", data), "historical_only");
});

test("owned status comes solely from a physical collection item", () => {
  const withoutCollectionItems = { ...data, items: [] };
  assert.equal(derivePrototypeStatus("emd-f3", withoutCollectionItems), "historical_only");
});

test("ordered status comes solely from active orders", () => {
  const withoutOrders = { ...data, orders: [] };
  assert.equal(derivePrototypeStatus("emd-e7", withoutOrders), "historical_only");
  assert.equal(derivePrototypeStatus("emd-gp35", withoutOrders), "historical_only");
});

test("prototype intent cannot synthesize physical status", () => {
  const prototype = { id: "test", collectionRelevance: "owned" };
  assert.equal(derivePrototypeStatus("test", { prototypes: [prototype], items: [], orders: [] }), "historical_only");
});

test("roster joins owned items and orders without combining records", () => {
  const rows = buildRosterRows(data);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(({ status }) => status), ["owned", "ordered", "ordered"]);
  assert.deepEqual(rows.map(({ sourceType }) => sourceType), ["collection", "order", "order"]);
  assert.deepEqual(rows.map(({ prototypeName }) => prototypeName), ["EMD F3", "EMD E7", "EMD GP35"]);
  assert.equal(rows[0].railroadName, null);
  assert.equal(rows[1].railroadName, "Chicago, Burlington & Quincy");
});

test("prototype naming and relationship lookup use stable IDs", () => {
  const prototypeById = indexById(data.prototypes);
  assert.equal(formatPrototypeName(prototypeById.get("emd-e7")), "EMD E7");
  const related = getRelatedPrototypes(prototypeById.get("emd-sd9"), prototypeById);
  assert.deepEqual(related.predecessors.map(({ id }) => id), ["emd-sd7"]);
  assert.deepEqual(related.successors.map(({ id }) => id), ["emd-sd18", "emd-sd24"]);
});
