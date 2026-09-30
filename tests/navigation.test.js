import assert from "node:assert/strict";
import test from "node:test";

import * as navigation from "../src/navigation.js";

const {
  locomotiveUrl,
  railroadUrl,
  navigationItems,
  normalizeView,
  parsePrototypeId,
  manufacturerViewForPrototype,
  prototypesForManufacturer,
} = navigation;

test("unknown and missing views resolve to the separate home view", () => {
  assert.equal(normalizeView(null), "home");
  assert.equal(normalizeView("unknown"), "home");
  assert.equal(normalizeView("collection"), "collection");
});

test("manufacturer routing groups EMC with EMD and leaves future trees isolated", () => {
  assert.equal(manufacturerViewForPrototype({ builder: "EMC" }), "emd");
  assert.equal(manufacturerViewForPrototype({ builder: "ALCO" }), "alco");
  assert.equal(manufacturerViewForPrototype({ builder: "GE" }), "ge");
  assert.deepEqual(prototypesForManufacturer([
    { id: "nw1", builder: "EMC" }, { id: "nw2", builder: "EMD" }, { id: "rs3", builder: "ALCO" },
  ], "emd").map(({ id }) => id), ["nw1", "nw2"]);
});

test("navigation keeps Collection first and gives every section a real URL", () => {
  assert.deepEqual(navigationItems("emd"), [
    { id: "collection", label: "Collection", href: "/?view=collection", current: false },
    { id: "emd", label: "EMD", href: "/?view=emd", current: true },
    { id: "alco", label: "ALCO", href: "/?view=alco", current: false },
    { id: "ge", label: "GE", href: "/?view=ge", current: false },
    { id: "bnsf", label: "BNSF", href: "/?view=bnsf", current: false },
  ]);
});

test("detail URLs encode and parse stable prototype IDs", () => {
  assert.equal(locomotiveUrl("emc-nw1"), "/locomotive.html?id=emc-nw1");
  assert.equal(parsePrototypeId("?id=emc-nw1"), "emc-nw1");
  assert.equal(parsePrototypeId(""), null);
});

test("railroad URLs use bookmarkable slugs", () => {
  assert.equal(railroadUrl("oregon-trunk"), "/railroads/oregon-trunk");
  assert.equal(railroadUrl("name with spaces"), "/railroads/name%20with%20spaces");
});

test("railroad section URLs preserve a bookmarkable paint-scheme target", () => {
  assert.equal(
    navigation.railroadSectionUrl?.("atsf", "paint-schemes"),
    "/railroads/atsf#paint-schemes",
  );
});

test("hash navigation scrolls the requested section into view", () => {
  const calls = [];
  const root = {
    getElementById(id) {
      assert.equal(id, "paint-schemes");
      return { scrollIntoView: (options) => calls.push(options) };
    },
  };

  assert.equal(navigation.scrollToHash?.("#paint-schemes", root), true);
  assert.deepEqual(calls, [{ behavior: "smooth", block: "start" }]);
});
