import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles, validateData } from "../scripts/validate-data.js";

test("seed data has valid identifiers and references", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  assert.deepEqual(validateData(data), []);
  assert.equal(data.prototypes.length, 24);
  assert.equal(data.items.length, 2);
  assert.equal(data.orders.length, 2);
  assert.equal(data.railroads.length, 6);
  assert.equal(data.historicalLocomotives.length, 1);
  assert.equal(data.sources.length, 6);
  assert.equal(data.items[0].prototypeId, "emd-f3");
  assert.equal(data.orders.find(({ id }) => id === "order-cbq-e7a-9931b").deposit.amount, 0);
});

test("NW2 class, historical locomotive, and HO model remain distinct", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const nw2 = data.prototypes.find(({ id }) => id === "emd-nw2");
  assert.equal(nw2.horsepower, 1000);
  assert.equal(nw2.axleConfiguration, "B-B");
  assert.equal(nw2.productionCount, 1145);
  assert.equal(nw2.collectionRelevance, "historical_only");

  const locomotive = data.historicalLocomotives.find(({ id }) => id === "cbq-9245");
  assert.equal(locomotive.prototypeId, "emd-nw2");
  assert.equal(locomotive.serialNumber, "3641");
  assert.equal(locomotive.frameNumber, "E699-26");

  const item = data.items.find(({ id }) => id === "collection-cbq-9245-bli");
  assert.equal(item.prototypeId, "emd-nw2");
  assert.equal(item.historicalLocomotiveId, "cbq-9245");
  assert.equal(item.manufacturerProductNumber, "2947");
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

test("collection items cannot reference an unknown historical locomotive", () => {
  const errors = validateData({
    prototypes: [{ id: "emd-nw2", collectionRelevance: "historical_only", predecessors: [], successors: [], operatorIds: [], sourceIds: [] }],
    items: [{ id: "bad-item", prototypeId: "emd-nw2", historicalLocomotiveId: "missing", sourceIds: [] }],
    orders: [], railroads: [], historicalLocomotives: [], sources: [],
  });
  assert.ok(errors.includes('Collection item "bad-item" references unknown historical locomotive "missing".'));
});

test("entities cannot reference an unknown source", () => {
  const errors = validateData({
    prototypes: [{ id: "emd-nw2", collectionRelevance: "historical_only", predecessors: [], successors: [], operatorIds: [], sourceIds: ["missing"] }],
    items: [], orders: [], railroads: [], historicalLocomotives: [], sources: [],
  });
  assert.ok(errors.includes('Prototype "emd-nw2" references unknown source "missing".'));
});
