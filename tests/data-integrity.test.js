import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles, validateData } from "../scripts/validate-data.js";

test("seed data has valid identifiers and references", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  assert.deepEqual(validateData(data), []);
  assert.equal(data.prototypes.length, 25);
  assert.equal(data.items.length, 2);
  assert.equal(data.orders.length, 2);
  assert.equal(data.railroads.length, 7);
  assert.equal(data.historicalLocomotives.length, 2);
  assert.equal(data.sources.length, 14);
  assert.equal(data.items[0].prototypeId, "emd-f3");
  assert.equal(data.orders.find(({ id }) => id === "order-cbq-e7a-9931b").deposit.amount, 0);
});

test("NW1 provides historical context for the owned NW2 without a collection item", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const nw1 = data.prototypes.find(({ id }) => id === "emc-nw1");
  const nw2 = data.prototypes.find(({ id }) => id === "emd-nw2");
  const locomotive = data.historicalLocomotives.find(({ id }) => id === "cbq-9201");

  assert.equal(nw1.horsepower, 900);
  assert.equal(nw1.axleConfiguration, "B-B");
  assert.equal(nw1.productionCount, 27);
  assert.deepEqual(nw1.successors, ["emd-nw2"]);
  assert.ok(nw2.predecessors.includes("emc-nw1"));
  assert.equal(locomotive.prototypeId, "emc-nw1");
  assert.equal(data.items.some(({ prototypeId }) => prototypeId === "emc-nw1"), false);
  assert.equal(data.orders.some(({ prototypeId }) => prototypeId === "emc-nw1"), false);
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
  assert.equal(item.retailer, null);
  assert.equal("walthersPartNumber" in item, false);
  assert.deepEqual(item.sourceIds, ["pwrs-bli-nw2-2014"]);
  assert.equal("sourceIds" in item.images[0], false);
});

test("NW1 timeline stops GN service at the 1953 rebuild and omits non-operators", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const nw1 = data.prototypes.find(({ id }) => id === "emc-nw1");
  assert.deepEqual(nw1.timeline.lineageService.map(({ railroadId }) => railroadId), [
    "chicago-burlington-quincy", "great-northern",
  ]);
  assert.deepEqual(nw1.timeline.manufacturing, { start: 1937, end: 1939, sourceIds: ["american-rails-early-emc-switchers"] });
  assert.equal(nw1.timeline.lineageService.find(({ railroadId }) => railroadId === "great-northern").end, 1953);
});

test("timeline fleet counts use operatedCount only", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const timelineSpans = data.prototypes.flatMap(({ timeline }) => timeline?.lineageService ?? []);
  assert.equal(timelineSpans.some((span) => "purchasedNewCount" in span), false);
  const nw1 = data.prototypes.find(({ id }) => id === "emc-nw1");
  assert.equal(nw1.timeline.lineageService.some((span) => "operatedCount" in span), false);
  const nw2 = data.prototypes.find(({ id }) => id === "emd-nw2");
  assert.deepEqual(nw2.timeline.lineageService.map(({ railroadId }) => railroadId), [
    "chicago-burlington-quincy", "great-northern", "northern-pacific", "burlington-northern", "santa-fe",
  ]);
  const np = nw2.timeline.lineageService.find(({ railroadId }) => railroadId === "northern-pacific");
  assert.equal(np.operatedCount, 7);
  assert.equal(nw2.timeline.lineageService.find(({ railroadId }) => railroadId === "chicago-burlington-quincy").operatedCount, 46);
  assert.equal(nw2.timeline.lineageService.find(({ railroadId }) => railroadId === "great-northern").operatedCount, 53);
  assert.equal(nw2.timeline.lineageService.some(({ railroadId }) => ["spokane-portland-seattle", "bnsf"].includes(railroadId)), false);
});

test("CB&Q 9245 specific timeline changes identity at the 1970 boundary", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const locomotive = data.historicalLocomotives.find(({ id }) => id === "cbq-9245");
  assert.deepEqual(locomotive.serviceTimeline, [
    { railroadId: "chicago-burlington-quincy", roadNumber: "9245", start: 1946, end: 1970, sourceIds: ["rrpicturearchives-cbq-9245"] },
    { railroadId: "burlington-northern", roadNumber: "542", start: 1970, end: 1983, sourceIds: ["trainpix-bn-nw2"] },
  ]);
});

test("service timelines reject reversed spans and unknown nested references", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const broken = structuredClone(data);
  broken.prototypes.find(({ id }) => id === "emd-nw2").timeline.lineageService[0] = {
    railroadId: "missing", start: 1970, end: 1940, sourceIds: ["missing"],
  };
  broken.historicalLocomotives.find(({ id }) => id === "cbq-9245").serviceTimeline[0].sourceIds = ["missing"];
  const errors = validateData(broken);
  assert.ok(errors.some((error) => error.includes("timeline references unknown railroad")));
  assert.ok(errors.some((error) => error.includes("timeline has reversed span")));
  assert.ok(errors.filter((error) => error.includes("references unknown source")).length >= 2);
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

test("historical timelines reject invalid calendar months", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const broken = structuredClone(data);
  broken.historicalLocomotives[0].timeline = [{ date: "1946-13", event: "Impossible month." }];
  assert.ok(validateData(broken).some((error) => error.includes("invalid timeline date")));
});

test("images require valid provenance for their storage strategy", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const broken = structuredClone(data);
  broken.items[1].images = [{
    type: "collection-model", localPath: null, sourcePage: null,
    remoteImageUrl: "https://example.com/wrong.jpg", caption: "", credit: null,
    date: null, storage: "local-owner",
  }];
  broken.historicalLocomotives[0].images = [{
    type: "historical-prototype", localPath: null, sourcePage: null,
    remoteImageUrl: "https://example.com/9245.jpg", caption: "Historical photograph",
    credit: "Chuck Zeiler", date: "1964-10", storage: "remote",
  }];
  const errors = validateData(broken);
  assert.ok(errors.some((error) => error.includes("local-owner image requires a localPath")));
  assert.ok(errors.some((error) => error.includes("local-owner image cannot use a remoteImageUrl")));
  assert.ok(errors.some((error) => error.includes("image caption")));
  assert.ok(errors.some((error) => error.includes("image credit")));
  assert.ok(errors.some((error) => error.includes("remote image requires a sourcePage")));
  assert.ok(errors.some((error) => error.includes("invalid image date")));
});
