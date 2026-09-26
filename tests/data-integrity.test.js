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
  assert.equal(data.sources.length, 121);
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

test("BNSF comparison uses the shared five-metric schema", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const bnsf = data.railroads.find(({ id }) => id === "bnsf");
  const [early, late] = bnsf.statistics.snapshots;
  const commonKeys = ["routeMiles", "employees", "locomotives", "rollingStock", "capitalization"];

  assert.deepEqual(Object.keys(early.metrics).sort(), [...commonKeys].sort());
  assert.deepEqual(Object.keys(late.metrics).sort(), [...commonKeys].sort());
  assert.deepEqual(commonKeys.map((key) => early.metrics[key].value), ["35,000", "43,000", "4,434", "95,655", "≈ $13B"]);
  assert.deepEqual(commonKeys.map((key) => late.metrics[key].value), [">32,500", "≈35,000", "≈6,700", "≈70,700", "$51.634B"]);
  assert.match(late.metrics.capitalization.note, /Book equity/);
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

test("Great Northern preserves the supplied history and 1938 versus 1968–1969 snapshots", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const gn = data.railroads.find(({ id }) => id === "great-northern");
  const [early, late] = gn.statistics.snapshots;

  assert.equal(gn.history.length, 5);
  assert.match(gn.history[3], /1926.*first diesel locomotive/);
  assert.match(gn.history[3], /production-series diesel milestone.*1938/);
  assert.match(gn.history[4], /March 2, 1970/);
  assert.deepEqual([early.year, early.label], [1938, "First production-series diesel"]);
  assert.deepEqual([late.year, late.label], ["1968–1969", "Eve of Burlington Northern"]);
  assert.deepEqual(
    ["routeMiles", "employees", "locomotives", "rollingStock", "capitalization"].map((key) => early.metrics[key].value),
    ["8,071.54", "16,330", "960", "51,569", "$579.9M"],
  );
  assert.deepEqual(
    ["routeMiles", "employees", "locomotives", "rollingStock", "capitalization"].map((key) => late.metrics[key].value),
    ["8,277", "15,913", "607", "41,770", "$528.3M"],
  );
  assert.equal(early.metrics.locomotives.note, "942 steam · 15 electric · 3 diesel");
  assert.equal(early.metrics.rollingStock.note, "50,754 freight · 815 passenger · excludes 1,947 company-service cars");
  assert.equal(late.metrics.locomotives.note, "607 diesel-electric · 1969");
  assert.equal(late.metrics.rollingStock.note, "41,256 freight · 514 passenger · excludes 2,734 caboose & work equipment · 1968");
  assert.equal(late.metrics.capitalization.note, "1968");
  assert.equal(late.metrics.employees.note, "1968");
  assert.equal(late.metrics.routeMiles.note, "1968");
  assert.deepEqual(early.sourceIds, [
    "great-northern-1938-annual-report",
    "great-northern-1940-annual-report",
  ]);
  assert.deepEqual(late.sourceIds, [
    "great-northern-1968-annual-report",
    "great-northern-equipment-no-42-1968",
    "great-northern-equipment-no-43-1969",
  ]);
  assert.ok(gn.sourceIds.includes("great-northern-condensed-history-1969"));
  assert.ok(gn.sourceIds.includes("great-northern-1940-annual-report"));
  assert.ok(gn.sourceIds.includes("bnsf-history-legacy"));
  assert.ok(gn.sourceIds.includes("great-northern-empire-nw2-roster"));
});

test("Northern Pacific identifies the source periods in its late snapshot date", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const np = data.railroads.find(({ id }) => id === "northern-pacific");
  const late = np.statistics.snapshots[1];

  assert.equal(late.date, "1966 financial · 1968 equipment · late-1960s operations");
});

test("SP&S preserves its diesel-era history and 1940 versus 1968 snapshots", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const sps = data.railroads.find(({ id }) => id === "spokane-portland-seattle");
  const [early, late] = sps.statistics.snapshots;
  const metricKeys = ["routeMiles", "employees", "locomotives", "rollingStock", "capitalization"];

  assert.equal(sps.name, "Spokane, Portland and Seattle Railway");
  assert.equal(sps.history.length, 4);
  assert.match(sps.history[0], /1905.*Portland & Seattle Railway.*1908/);
  assert.match(sps.history[0], /Great Northern Railway and Northern Pacific Railway/);
  assert.match(sps.history[1], /Oregon Trunk Railway.*Oregon Electric Railway/);
  assert.match(sps.history[2], /ALCO.*C424.*C425.*C415.*C636/);
  assert.match(sps.history[3], /March 2, 1970/);
  assert.equal(sps.predecessorLabel, "Affiliates");
  assert.deepEqual([early.year, early.label], [1940, "First Diesels"]);
  assert.deepEqual([late.year, late.label], [1968, "Pre-BN"]);
  assert.deepEqual(metricKeys.map((key) => early.metrics[key].value), ["~915", "~2,000", "~105", "~730", "~$100 million"]);
  assert.deepEqual(metricKeys.map((key) => late.metrics[key].value), ["922", "~2,500", "112", "3,411", "~$160 million"]);
  assert.match(early.metrics.locomotives.note, /89 steam.*14 electric.*production diesels in 1940/);
  assert.equal(late.metrics.rollingStock.note, "3,363 freight cars · 48 passenger cars");
  assert.deepEqual(sps.paintSchemes.map(({ id }) => id), [
    "early-pullman-green-yellow",
    "early-fa-freight",
    "empire-builder-passenger",
    "intermediate-fa-freight",
    "1964-broad-yellow",
  ]);
  assert.deepEqual(sps.paintSchemes.map(({ representativeLocomotive }) => representativeLocomotive), [
    "ALCO RS2 #60",
    "ALCO FA1 #858",
    "EMD E7A #750",
    "ALCO FA1 #857",
    "ALCO C636 · SP&S #341 / BN #4367",
  ]);
  const faBroadSideBand = sps.paintSchemes.find(({ id }) => id === "intermediate-fa-freight");
  const broadYellow = sps.paintSchemes.find(({ id }) => id === "1964-broad-yellow");
  assert.equal(sps.paintSchemes.some(({ representativeLocomotive }) => representativeLocomotive.includes("#860") || representativeLocomotive.includes("#97")), false);
  assert.deepEqual([faBroadSideBand.startYear, faBroadSideBand.periodLabel, faBroadSideBand.category], [1964, "1964", "Experimental freight cab unit"]);
  assert.deepEqual([broadYellow.startYear, broadYellow.periodLabel, broadYellow.category], [1964, "1964", "Standard late-SP&S scheme"]);
  assert.match(broadYellow.description, /Introduced with the new C424 locomotives in 1964/);
  assert.equal(sps.paintSchemes[0].photo.localPath, "/images/railroads/sps-rs2-60-early-pullman-green-yellow-ai.png");
  assert.equal(sps.paintSchemes[0].photo.kind, "AI reconstruction from archival reference");
  assert.equal(sps.paintSchemes[1].photo.localPath, "/images/railroads/sps-fa1-858-early-fa-freight-ai.png");
  assert.equal(sps.paintSchemes[1].photo.kind, "AI reconstruction from archival reference");
  assert.equal(sps.paintSchemes.every(({ paintIdentity }) => paintIdentity === undefined), true);
  assert.equal(broadYellow.photo.localPath, "/images/railroads/sps-c636-341-bn-4367-broad-yellow-ai.png");
  assert.equal(broadYellow.photo.kind, "AI reconstruction from archival reference");
  assert.match(broadYellow.description, /C636 No\. 341.*Burlington Northern No\. 4367/);
  assert.equal(faBroadSideBand.photo.localPath, "/images/railroads/sps-fa1-857-intermediate-fa-freight-ai.png");
  assert.equal(faBroadSideBand.photo.kind, "AI reconstruction from archival reference");
  assert.match(sps.paintSchemes[0].description, /RS2 No\. 60, built in 1949, represents this restrained pre-broad-yellow treatment\./);
  assert.match(sps.paintSchemes[1].description, /The first SP&S FA units arrived in May 1948\. FA1 No\. 858, built in 1949/);
  assert.equal(sps.paintSchemes[2].periodLabel, "1951");
  assert.equal(sps.paintSchemes[2].startYear, 1951);
  assert.equal(sps.paintSchemes[2].description, "E7A No. 750, built in 1948, was repainted in June 1951 into Great Northern's Mid-Century Empire Builder colors while retaining SP&S identity. Though short-lived, the scheme gave SP&S its most distinctive passenger-diesel appearance.");
  assert.equal(sps.paintSchemes[2].photo.localPath, "/images/railroads/sps-e7a-750-1951-empire-builder-ai.png");
  assert.equal(sps.paintSchemes[2].photo.remoteImageUrl, undefined);
  assert.equal(sps.paintSchemes[2].photo.sourcePage, "https://streamlinermemories.info/?p=15627");
  assert.equal(sps.paintSchemes[2].photo.kind, "AI restoration from historical color reference");
  assert.equal(sps.paintSchemes[2].photo.caption, "EMD E7A #750 in its 1951 Empire Builder appearance.");
  assert.equal(sps.paintSchemes[2].photo.credit, "Source: Streamliner Memories");
  assert.deepEqual(sps.paintSchemes[2].sourceIds, ["streamliner-memories-sps-750-color-scheme"]);
  assert.doesNotMatch(JSON.stringify(sps.paintSchemes[2]), /1969|solid-green|as-delivered/i);
  assert.equal(faBroadSideBand.name, "FA Broad Side Band");
  assert.match(faBroadSideBand.description, /another documented SP&S FA paint variation/);
  assert.doesNotMatch(faBroadSideBand.description, /intermediate.*standard/i);
  for (const scheme of sps.paintSchemes.filter(({ id }) => id !== "empire-builder-passenger")) {
    assert.equal(scheme.photo.sourcePage, "https://www.thedieselshop.us/SP&Sprofile.HTML");
    assert.equal(scheme.sourceIds.includes("diesel-shop-sps-profile"), true);
    assert.ok(scheme.photo.credit.includes("The Diesel Shop"));
  }
  assert.deepEqual(sps.sourceIds, [
    "trains-sps-fallen-flags-statistics",
    "spshs-diesel-roster",
    "american-rails-spokane-portland-seattle",
    "mnhs-sps-records",
    "diesel-shop-sps-profile",
  ]);
});

test("Northern Pacific paint cards preserve the accepted order, artwork, and scheme-local provenance", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const np = data.railroads.find(({ id }) => id === "northern-pacific");
  const schemes = np.paintSchemes;
  const paintSourceIds = [
    "rrpicturearchives-np-3309-black-yellow",
    "pnra-np-6500a-streamliner",
    "mor-np-6506a-loewy",
    "pnra-np-820-experimental-simplified",
    "railpictures-np-7005a-1960",
  ];

  assert.deepEqual(schemes.map(({ id }) => id), [
    "black-yellow-freight", "1947-streamliner", "loewy-passenger", "experimental-simplified",
  ]);
  assert.deepEqual(schemes.map(({ photo }) => photo.localPath), [
    "/images/railroads/np-3309-black-yellow-restored.png",
    "/images/railroads/np-6500a-1947-streamliner-reconstruction.png",
    "/images/railroads/np-6506a-loewy-passenger-reconstruction.png",
    "/images/railroads/np-820-experimental-simplified-restored.png",
  ]);
  assert.deepEqual(schemes.flatMap(({ sourceIds }) => sourceIds), paintSourceIds);
  assert.equal(paintSourceIds.some((id) => np.sourceIds.includes(id)), false);
  assert.equal(schemes[3].startYear, 1960);
  assert.equal(schemes[3].periodLabel, "1960–1970");
  assert.match(schemes[3].description, /^By 1960, Northern Pacific F9A No\. 7005A was wearing an experimental simplified paint treatment\. On No\. 7005A, the experimental treatment replaced the traditional passenger greens with a dark upper body/);
  assert.deepEqual(schemes[3].sourceIds, [
    "pnra-np-820-experimental-simplified",
    "railpictures-np-7005a-1960",
  ]);
  for (const scheme of schemes) {
    assert.ok(scheme.photo.sourcePage);
    assert.ok(scheme.photo.alt);
    assert.ok(scheme.photo.caption);
    assert.ok(scheme.photo.credit);
    assert.ok(scheme.photo.kind);
  }
});

test("Great Northern paint cards preserve the accepted order, artwork, and archive sources", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const schemes = data.railroads.find(({ id }) => id === "great-northern").paintSchemes;

  assert.deepEqual(schemes.map(({ id }) => id), [
    "basic-black", "empire-builder", "simplified-empire-builder", "big-sky-blue",
  ]);
  assert.deepEqual(schemes.map(({ periodLabel }) => periodLabel), [
    "1926–1941", "1941–1962", "1962–1967", "1967–1970",
  ]);
  assert.deepEqual(schemes.map(({ representativeLocomotive }) => representativeLocomotive), [
    "EMC NC #5101", "F7A #309A", "F7A #307A", "SD45 #422",
  ]);
  assert.deepEqual(schemes.map(({ photo }) => photo.localPath), [
    "/images/railroads/gn-5101-basic-black-generated.png",
    "/images/railroads/gn-309a-empire-builder-generated.png",
    "/images/railroads/gn-307a-simplified-empire-builder-generated.png",
    "/images/railroads/gn-422-big-sky-blue-generated.png",
  ]);
  assert.deepEqual(schemes.map(({ photo }) => photo.sourcePage), [
    "https://atom.pnrarchive.org/index.php/great-northern-diesel-locomotive-5101-in-1938",
    "https://atom.pnrarchive.org/index.php/great-northern-diesel-locomotive-309a-at-minneapolis-minnesota-1969",
    "https://atom.pnrarchive.org/index.php/great-northern-diesel-locomotive-307a-at-minneapolis-minnesota-1969",
    "https://atom.pnrarchive.org/index.php/great-northern-diesel-locomotive-422-at-la-grange-illinois-1968",
  ]);
  assert.deepEqual(schemes.map(({ paintIdentity }) => paintIdentity ?? null), [
    null,
    "Omaha Orange · Pullman Green · Imitation Gold",
    "Simplified Omaha Orange · Pullman Green",
    null,
  ]);
  assert.ok(schemes[2].description.includes("treated as one scheme"));
  for (const scheme of schemes) {
    assert.equal(scheme.photo.kind, "AI reconstruction from archival reference");
    assert.equal(scheme.photo.credit, "User-supplied generated / restored image");
    assert.ok(scheme.photo.caption);
    assert.ok(scheme.photo.alt);
  }
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
