import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ALCO_PRODUCTION_CAPTION,
  ALCO_PROTOTYPE_FAMILIES,
  resolveAlcoPrototypeStatus,
} from "../src/alco-prototype.js";
import { derivePrototypeStatus } from "../src/model.js";

test("ALCO evolution nodes use ALCO-built production counts only", () => {
  const productionByModel = Object.fromEntries(
    ALCO_PROTOTYPE_FAMILIES.flatMap(({ models }) => models),
  );

  assert.deepEqual(productionByModel, {
    HH600: 78,
    HH660: 43,
    HH1000: 34,
    "S-1": 543,
    "S-2": 1462,
    "S-4": 651,
    "S-6": 126,
    "FA-1": 417,
    "FB-1": 229,
    "FA-2": 331,
    "FB-2": 182,
    "DL-107": 8,
    "DL-108": 3,
    "PA-1": 169,
    "PB-1": 39,
    "RS-1": 466,
    "RS-2": 368,
    "RS-3": 1272,
    "RS-11": 356,
    "RSD-4": 36,
    "RSD-5": 204,
    "RSD-7": 29,
    "RSD-15": 75,
    C415: 26,
    C424: 98,
    C425: 91,
    C636: 34,
  });
});

test("ALCO evolution caption states the ALCO-only convention", () => {
  assert.equal(ALCO_PRODUCTION_CAPTION, "Number in each node = ALCO-built production.");
});

test("ALCO node status is derived from shared project data", async () => {
  const [locomotives, collection, orders] = await Promise.all([
    readFile(new URL("../data/locomotives.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/collection.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../data/orders.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  const data = {
    prototypes: locomotives.prototypes,
    items: collection.items,
    orders: orders.orders,
  };
  const getStatus = (id) => derivePrototypeStatus(id, data);

  assert.equal(resolveAlcoPrototypeStatus("RS-3", getStatus), "wanted");
  assert.equal(resolveAlcoPrototypeStatus("C425", getStatus), "historical_only");
});
