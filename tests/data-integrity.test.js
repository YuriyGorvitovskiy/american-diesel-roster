import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles, validateData } from "../scripts/validate-data.js";

test("seed data has valid identifiers and references", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  assert.deepEqual(validateData(data), []);
  assert.equal(data.prototypes.length, 23);
  assert.equal(data.items.length, 1);
  assert.equal(data.orders.length, 2);
  assert.equal(data.railroads.length, 6);
  assert.equal(data.items[0].prototypeId, "emd-f3");
  assert.equal(data.orders.find(({ id }) => id === "order-cbq-e7a-9931b").deposit.amount, 0);
});

test("duplicate prototype identifiers are rejected", () => {
  const prototype = { id: "emd-f3", predecessors: [], successors: [], operatorIds: [] };
  const errors = validateData({ prototypes: [prototype, prototype], items: [], orders: [], railroads: [] });
  assert.ok(errors.includes('Duplicate prototype id "emd-f3".'));
});

test("orders cannot reference an unknown railroad", () => {
  const errors = validateData({
    prototypes: [{ id: "emd-f3", predecessors: [], successors: [], operatorIds: [] }],
    items: [],
    orders: [{ id: "bad-order", prototypeId: "emd-f3", railroadId: "missing" }],
    railroads: [],
  });
  assert.ok(errors.includes('Order "bad-order" references unknown railroad "missing".'));
});

test("prototype intent excludes physical and order states", () => {
  const errors = validateData({
    prototypes: [{ id: "emd-f3", collectionRelevance: "owned", predecessors: [], successors: [], operatorIds: [] }],
    items: [],
    orders: [],
    railroads: [],
  });
  assert.ok(errors.includes('Prototype "emd-f3" has invalid collection intent "owned".'));
});
