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
  prototypePageHeading,
} from "../src/model.js";

const data = await loadDataFiles(new URL("..", import.meta.url));

test("prototype status reflects physical and planning records", () => {
  assert.equal(derivePrototypeStatus("emd-f3", data), "owned");
  assert.equal(derivePrototypeStatus("emd-gp35", data), "owned");
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
});

test("prototype intent cannot synthesize physical status", () => {
  const prototype = { id: "test", collectionRelevance: "owned" };
  assert.equal(derivePrototypeStatus("test", { prototypes: [prototype], items: [], orders: [] }), "historical_only");
});

test("roster joins owned items and orders without combining records", () => {
  const rows = buildRosterRows(data);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map(({ status }) => status), ["owned", "owned", "owned", "ordered", "ordered", "ordered", "ordered"]);
  assert.deepEqual(rows.map(({ sourceType }) => sourceType), ["collection", "collection", "collection", "order", "order", "order", "order"]);
  assert.deepEqual(rows.map(({ prototypeName }) => prototypeName), ["EMD F3", "EMD GP35", "EMD NW2", "EMD E7", "GE ET44AC", "GE U25B", "GE U33C"]);
  assert.equal(rows[0].railroadName, null);
  assert.equal(rows[1].railroadName, "Great Northern");
  assert.equal(rows[2].railroadName, "Chicago, Burlington & Quincy");
  assert.equal(rows[3].railroadName, "Chicago, Burlington & Quincy");
  assert.equal(rows[3].manufacturerUrl, "https://rapidotrains.com/");
  assert.equal(rows[3].retailerUrl, "https://www.trainworld.com/");
  assert.ok(rows.every(({ status }) => status !== "historical_only"));
  assert.deepEqual(rows[2].image, {
    type: "collection-model",
    localPath: "images/collection/cbq-9245-bli-side.png",
    sourcePage: null,
    remoteImageUrl: null,
    caption: "Owner’s cleaned Broadway Limited Imports HO model of CB&Q 9245",
    credit: "Owner photograph",
    date: null,
    storage: "local-owner",
  });
});

test("GP35 delivery is represented as an owned model, not an active order", () => {
  const detail = buildPrototypeDetail("emd-gp35", data);
  assert.deepEqual(detail.collectionItems.map(({ id }) => id), ["collection-gn-gp35-3035"]);
  assert.deepEqual(detail.orders, []);
  assert.equal(detail.collectionItems[0].historicalLocomotiveId, "gn-3035");
  assert.deepEqual(detail.collectionItems[0].images, [{
    type: "collection-model",
    localPath: "images/collection/gn-gp35-3035-side.png",
    sourcePage: null,
    remoteImageUrl: null,
    caption: "Owner’s Broadway Limited Imports HO model of Great Northern GP35 3035",
    credit: "Owner photograph",
    date: null,
    storage: "local-owner",
  }]);
});

test("prototype naming and relationship lookup use stable IDs", () => {
  const prototypeById = indexById(data.prototypes);
  assert.equal(formatPrototypeName(prototypeById.get("emd-e7")), "EMD E7");
  const related = getRelatedPrototypes(prototypeById.get("emd-sd9"), prototypeById);
  assert.deepEqual(related.predecessors.map(({ id }) => id), ["emd-sd7"]);
  assert.deepEqual(related.successors.map(({ id }) => id), ["emd-sd18", "emd-sd24"]);
});

test("prototype page headings expand the builder and avoid repeating it in the model title", () => {
  assert.deepEqual(prototypePageHeading({ builder: "EMD", model: "NW2", variant: null }), {
    builderName: "Electro-Motive Division",
    modelName: "NW2",
  });
  assert.deepEqual(prototypePageHeading({ builder: "EMC", model: "SW1", variant: "Phase II" }), {
    builderName: "Electro-Motive Corporation",
    modelName: "SW1 Phase II",
  });
  assert.equal(prototypePageHeading({ builder: "ALCO", model: "RS-3" }).builderName, "American Locomotive Company");
  assert.equal(prototypePageHeading({ builder: "GE", model: "U25B" }).builderName, "General Electric");
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
    "pwrs-bli-nw2-2014",
    "great-northern-empire-nw2-roster",
    "american-rails-great-northern-roster",
    "diesel-shop-cbq-roster",
    "brhs-diesel-roster",
    "diesel-shop-northern-pacific-roster",
    "atsf-nw2-master-roster",
  ]);
  assert.deepEqual(data.sources, originalSources);
});

test("prototype detail includes sources cited only by service timelines", () => {
  const detail = buildPrototypeDetail("emd-nw2", {
    prototypes: [{
      id: "emd-nw2", collectionRelevance: "historical_only", predecessors: [], successors: [], sourceIds: [],
      timeline: { manufacturing: { start: 1939, end: 1949, sourceIds: ["manufacturing-source"] }, lineageService: [{ railroadId: "cbq", start: 1940, end: 1970, sourceIds: ["service-source"] }] },
    }],
    historicalLocomotives: [{ id: "cbq-9245", prototypeId: "emd-nw2", railroadId: "cbq", sourceIds: [], serviceTimeline: [{ railroadId: "cbq", start: 1946, end: 1970, sourceIds: ["identity-source"] }] }],
    items: [], orders: [], railroads: [{ id: "cbq", name: "CB&Q" }],
    sources: [
      { id: "manufacturing-source" }, { id: "service-source" }, { id: "identity-source" },
    ],
  });
  assert.deepEqual(detail.sources.map(({ id }) => id), ["manufacturing-source", "service-source", "identity-source"]);
});
