import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles } from "../scripts/validate-data.js";
import {
  buildPrototypeDetail,
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
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map(({ status }) => status), ["owned", "owned", "ordered", "ordered"]);
  assert.deepEqual(rows.map(({ sourceType }) => sourceType), ["collection", "collection", "order", "order"]);
  assert.deepEqual(rows.map(({ prototypeName }) => prototypeName), ["EMD F3", "EMD NW2", "EMD E7", "EMD GP35"]);
  assert.equal(rows[0].railroadName, null);
  assert.equal(rows[1].railroadName, "Chicago, Burlington & Quincy");
  assert.equal(rows[2].railroadName, "Chicago, Burlington & Quincy");
});

test("prototype naming and relationship lookup use stable IDs", () => {
  const prototypeById = indexById(data.prototypes);
  assert.equal(formatPrototypeName(prototypeById.get("emd-e7")), "EMD E7");
  const related = getRelatedPrototypes(prototypeById.get("emd-sd9"), prototypeById);
  assert.deepEqual(related.predecessors.map(({ id }) => id), ["emd-sd7"]);
  assert.deepEqual(related.successors.map(({ id }) => id), ["emd-sd18", "emd-sd24"]);
});

test("NW2 ownership is derived only from its physical model", () => {
  assert.equal(derivePrototypeStatus("emd-nw2", data), "owned");
  const withoutNW2Model = {
    ...data,
    items: data.items.filter(({ id }) => id !== "collection-cbq-9245-bli"),
  };
  assert.equal(derivePrototypeStatus("emd-nw2", withoutNW2Model), "historical_only");
});

test("prototype detail joins class, historical identity, model, and sources", () => {
  const originalSources = structuredClone(data.sources);
  const detail = buildPrototypeDetail("emd-nw2", data);
  assert.equal(detail.prototype.id, "emd-nw2");
  assert.deepEqual(detail.historicalLocomotives.map(({ id }) => id), ["cbq-9245"]);
  assert.deepEqual(detail.collectionItems.map(({ id }) => id), ["collection-cbq-9245-bli"]);
  assert.deepEqual(detail.sources.map(({ id }) => id), [
    "wikipedia-emd-nw2",
    "american-rails-emd-nw2",
    "rrpicturearchives-cbq-9245",
    "trainpix-bn-nw2",
    "walthers-bli-nw2-9245",
    "pwrs-bli-nw2-2014",
  ]);
  assert.deepEqual(data.sources, originalSources);
});
