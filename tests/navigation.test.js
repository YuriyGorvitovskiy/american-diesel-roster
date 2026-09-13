import assert from "node:assert/strict";
import test from "node:test";

import {
  locomotiveUrl,
  navigationItems,
  normalizeView,
  parsePrototypeId,
} from "../src/navigation.js";

test("unknown and missing views resolve to the separate home view", () => {
  assert.equal(normalizeView(null), "home");
  assert.equal(normalizeView("unknown"), "home");
  assert.equal(normalizeView("collection"), "collection");
});

test("navigation keeps Collection first and gives every section a real URL", () => {
  assert.deepEqual(navigationItems("emd"), [
    { id: "collection", label: "Collection", href: "./?view=collection", current: false },
    { id: "emd", label: "EMD", href: "./?view=emd", current: true },
    { id: "alco", label: "ALCO", href: "./?view=alco", current: false },
    { id: "ge", label: "GE", href: "./?view=ge", current: false },
    { id: "bnsf", label: "BNSF", href: "./?view=bnsf", current: false },
  ]);
});

test("detail URLs encode and parse stable prototype IDs", () => {
  assert.equal(locomotiveUrl("emc-nw1"), "./locomotive.html?id=emc-nw1");
  assert.equal(parsePrototypeId("?id=emc-nw1"), "emc-nw1");
  assert.equal(parsePrototypeId(""), null);
});
