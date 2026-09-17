import assert from "node:assert/strict";
import test from "node:test";

import { groupRosterRows, rosterColumns, rosterRowView } from "../src/roster.js";

test("roster grouping preserves owned items and orders", () => {
  const rows = [{ id: "a", status: "ordered" }, { id: "b", status: "owned" }, { id: "c", status: "ordered" }];
  assert.deepEqual(groupRosterRows(rows), {
    owned: [{ id: "b", status: "owned" }],
    ordered: [{ id: "a", status: "ordered" }, { id: "c", status: "ordered" }],
  });
});

test("Collection columns put livery after railroad and store after manufacturer", () => {
  assert.deepEqual(rosterColumns.map(([key]) => key), [
    "prototypeName", "railroadName", "livery", "roadNumber", "manufacturer", "retailer",
  ]);
});

test("Collection rows expose internal prototype and external commerce links", () => {
  assert.deepEqual(rosterRowView({
    prototypeId: "emd-e7", manufacturer: "Rapido", manufacturerUrl: "https://rapidotrains.com/",
    retailer: "TrainWorld", retailerUrl: "https://www.trainworld.com/",
  }), {
    prototypeHref: "/locomotive.html?id=emd-e7",
    manufacturerHref: "https://rapidotrains.com/",
    retailerHref: "https://www.trainworld.com/",
    image: null,
  });
});

test("Collection rows preserve an available owner model image", () => {
  assert.deepEqual(rosterRowView({
    prototypeId: "emd-nw2",
    image: { localPath: "images/collection/nw2.png", caption: "Owner model photograph" },
  }), {
    prototypeHref: "/locomotive.html?id=emd-nw2",
    manufacturerHref: null,
    retailerHref: null,
    image: { src: "images/collection/nw2.png", alt: "Owner model photograph" },
  });
});
