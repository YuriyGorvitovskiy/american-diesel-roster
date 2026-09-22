import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles, validateData } from "../scripts/validate-data.js";

test("seed data has valid identifiers and references", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  assert.deepEqual(validateData(data), []);
  assert.equal(data.prototypes.length, 58);
  assert.equal(data.items.length, 3);
  assert.equal(data.orders.length, 4);
  assert.equal(data.railroads.length, 30);
  assert.equal(data.railroads.find(({ id }) => id === "great-northern").slug, "gn");
  assert.deepEqual(data.railroads.find(({ id }) => id === "bnsf").predecessors, ["burlington-northern", "santa-fe"]);
  assert.equal(data.historicalLocomotives.length, 7);
  assert.equal(data.sources.length, 97);
  assert.equal(data.items[0].prototypeId, "emd-f3");
  assert.equal(data.orders.find(({ id }) => id === "order-cbq-e7a-9931b").deposit.amount, 0);
  const et44 = data.prototypes.find(({ id }) => id === "ge-et44ac");
  assert.equal(et44.model, "ET44AC");
  assert.notEqual(et44.model, "ET44C4");
  assert.equal(et44.axleConfiguration, "C-C");
  assert.equal(et44.tractionType, "AC");
  assert.equal(et44.horsepower, 4400);
  assert.deepEqual(et44.predecessors, ["ge-es44ac"]);
  assert.deepEqual(et44.operatorIds, ["bnsf"]);
  assert.equal(et44.narrative.some((paragraph) => paragraph.includes("3674")), false);
  assert.equal("operatedCount" in et44.timeline.lineageService[0], false);

  const locomotive = data.historicalLocomotives.find(({ id }) => id === "bnsf-3674");
  assert.equal(locomotive.prototypeId, "ge-et44ac");
  assert.equal(locomotive.builtDate, "2023-08");
  assert.deepEqual(locomotive.serviceTimeline, [
    { railroadId: "bnsf", roadNumber: "3674", start: 2023, end: null, sourceIds: ["scaletrains-sxt43710", "rrpicturearchives-bnsf-3674"] },
  ]);

  const order = data.orders.find(({ id }) => id === "order-bnsf-et44ach-3674");
  assert.equal(order.prototypeId, "ge-et44ac");
  assert.equal(order.historicalLocomotiveId, "bnsf-3674");
  assert.equal(order.manufacturer, "ScaleTrains");
  assert.equal(order.manufacturerSku, "SXT43710");
  assert.equal(order.scale, "HO (1:87.1)");
  assert.equal(order.soundControl, "DCC & Sound · ESU LokSound 5");
  assert.equal(order.expectedDate, "2027-02");
  assert.equal(order.manufacturerUrl, "https://www.scaletrains.com/rivet-counter-ho-scale-ge-et44ach-bnsf-heritage-iii-10.html");
  assert.equal(order.retailer, "ScaleTrains");
  assert.equal(order.retailerUrl, order.manufacturerUrl);
  assert.deepEqual(order.sourceIds, ["scaletrains-sxt43710", "scaletrains-sxt43710-product-image"]);
  assert.deepEqual(order.images, [{
    type: "manufacturer-product",
    localPath: null,
    sourcePage: "https://www.scaletrains.com/rivet-counter-ho-scale-ge-et44ach-bnsf-heritage-iii-10.html",
    remoteImageUrl: "https://www.scaletrains.com/media/catalog/product/cache/832b44601db91560d95f56fa687bb4de/s/x/sxt43706-bnsf_side.jpg",
    caption: "ScaleTrains Rivet Counter BNSF Heritage III ET44ACH product image",
    credit: "ScaleTrains",
    date: null,
    storage: "remote",
    sourceIds: ["scaletrains-sxt43710-product-image"],
  }]);
});

test("ATSF comparison preserves the approved historical precision and propulsion shift", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const atsf = data.railroads.find(({ id }) => id === "santa-fe");
  const [early, late] = atsf.statistics.snapshots;
  assert.deepEqual([early.year, late.year], [1935, 1995]);
  assert.deepEqual([early.metrics.steam.value, early.metrics.diesel.value, early.metrics.dieselShare.value], ["~1,900", "3", "<1%"]);
  assert.deepEqual([late.metrics.steam.value, late.metrics.diesel.value, late.metrics.dieselShare.value], ["0", "1,595", "100%"]);
  assert.deepEqual(
    ["capitalization", "employees", "routeMiles", "locomotives", "rollingStock"].map((key) => early.metrics[key].value),
    ["~$600M", "~40,000", "~12,000 mi", "~1,900", "~85,000"],
  );
  assert.deepEqual(
    ["capitalization", "employees", "routeMiles", "locomotives", "rollingStock"].map((key) => late.metrics[key].value),
    ["$5.35B", "~15,000", "9,126 mi", "1,595", "~26,000"],
  );
});

test("CB&Q comparison preserves the approved 1934 and pre-merger operating snapshots", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const cbq = data.railroads.find(({ id }) => id === "chicago-burlington-quincy");
  const [early, late] = cbq.statistics.snapshots;

  assert.deepEqual([early.year, late.year], [1934, 1968]);
  assert.deepEqual(
    ["routeMiles", "employees", "locomotives", "rollingStock", "capitalization"].map((key) => early.metrics[key].value),
    ["9,143.98 mi", "~22,700", "1,068", "47,132", "~$390.5M"],
  );
  assert.deepEqual(
    ["routeMiles", "employees", "locomotives", "rollingStock", "capitalization"].map((key) => late.metrics[key].value),
    ["8,509 mi", "16,938", "672", "41,080", "~$420.0M"],
  );
  assert.ok(cbq.statistics.notes.some((note) => note.includes("Pioneer Zephyr")));
  assert.ok(cbq.sourceIds.includes("cbq-1934-annual-report"));
  assert.ok(cbq.sourceIds.includes("moodys-1969-transportation-manual"));
  assert.equal(early.metrics.routeMiles.label, late.metrics.routeMiles.label);
  assert.equal(early.metrics.routeMiles.label, "Route miles / miles of road operated");
  assert.equal(early.metrics.employees.label, "Employees · 1933 average");
  assert.equal(cbq.sourceIds.includes("great-northern-1968-annual-report"), false);
});

test("CB&Q paint cards retain the reviewed sequence, identities, and image provenance", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const schemes = data.railroads.find(({ id }) => id === "chicago-burlington-quincy").paintSchemes;
  assert.deepEqual(schemes.map(({ id }) => id), [
    "early-black-aluminum", "blackbird", "grayback-freight", "passenger-silver-black-whisker",
    "passenger-silver-red-whisker", "chinese-red",
  ]);
  assert.equal(schemes[1].periodLabel, "1940s–1960s");
  assert.equal(schemes[2].representativeLocomotive, "FW&D F7 751A — Burlington subsidiary");
  assert.match(schemes[3].representativeLocomotive, /9911A.*Silver Pilot/);
  assert.equal(schemes[4].representativeLocomotive, "CB&Q E8A 9946B");
  assert.equal(schemes[4].photo.sourcePage, "http://railfan44.blogspot.com/2013/07/the-last-decade-of-cb-on-racetrack.html");
  assert.equal(schemes[4].photo.credit, "Railfan44 — The Last Decade of CB&Q on the Racetrack");
  assert.equal(schemes[4].photo.date, "1966-01-26");
  assert.equal(schemes[4].photo.kind, "Historical photograph");
  assert.ok(schemes[4].photo.remoteImageUrl.includes("XCBQ9946B-660126"));
  assert.equal(schemes[4].photo.localPath, undefined);
  for (const scheme of schemes) {
    assert.ok(scheme.photo.sourcePage);
    assert.ok(scheme.photo.credit);
    assert.ok(scheme.photo.alt);
    assert.ok(scheme.photo.remoteImageUrl || scheme.photo.localPath);
    if (scheme.photo.localPath) assert.equal(scheme.photo.kind, "AI reconstruction from archival reference");
  }
  assert.equal(schemes[2].photo.sourcePage, "https://www.american-rails.com/cbq.html");
  assert.ok(schemes[5].photo.remoteImageUrl);
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
  const gp35 = data.prototypes.find(({ id }) => id === "emd-gp35");
  assert.equal(gp35.timeline.lineageService.find(({ railroadId }) => railroadId === "burlington-northern").operatedCount, 79);
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

test("ongoing timeline spans allow a null end year", () => {
  const errors = validateData({
    prototypes: [{
      id: "ge-et44ac", collectionRelevance: "historical_only", predecessors: [], successors: [], operatorIds: [],
      timeline: {
        manufacturing: { start: 2015, end: null, sourceIds: [] },
        lineageService: [],
      },
    }],
    items: [], orders: [], railroads: [], historicalLocomotives: [], sources: [],
  });
  assert.equal(errors.some((error) => error.includes("integer start and end years")), false);
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

test("orders cannot reference an unknown historical locomotive", () => {
  const errors = validateData({
    prototypes: [{ id: "ge-et44ac", predecessors: [], successors: [], operatorIds: [] }],
    items: [],
    orders: [{ id: "bad-order", prototypeId: "ge-et44ac", historicalLocomotiveId: "missing" }],
    railroads: [],
    historicalLocomotives: [],
  });
  assert.ok(errors.includes('Order "bad-order" references unknown historical locomotive "missing".'));
});

test("orders must match their referenced historical locomotive", () => {
  const errors = validateData({
    prototypes: [{ id: "ge-et44ac", predecessors: [], successors: [], operatorIds: [] }],
    items: [],
    orders: [{
      id: "mismatched-order", prototypeId: "ge-et44ac", railroadId: "bnsf",
      roadNumber: "3674", historicalLocomotiveId: "other-locomotive",
    }],
    railroads: [{ id: "bnsf", predecessors: [], successors: [] }],
    historicalLocomotives: [{
      id: "other-locomotive", prototypeId: "ge-et44ac", railroadId: "bnsf", roadNumber: "9999",
    }],
  });
  assert.ok(errors.includes('Order "mismatched-order" does not match historical locomotive "other-locomotive".'));
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
