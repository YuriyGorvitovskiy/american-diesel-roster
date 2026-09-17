import assert from "node:assert/strict";
import test from "node:test";

import { verticalScaleForColumns } from "../src/railroad-pages.js";

test("railroad genealogy expands vertical spacing for zoomed card heights", () => {
  const positions = [
    { x: 100, baseY: 72, railroad: { id: "first" } },
    { x: 100, baseY: 184, railroad: { id: "second" } },
    { x: 350, baseY: 128, railroad: { id: "other-column" } },
  ];
  const heights = new Map([
    ["first", 140],
    ["second", 140],
    ["other-column", 300],
  ]);

  assert.equal(verticalScaleForColumns(positions, heights), 160 / 112);
});

test("railroad genealogy keeps its accepted spacing when cards already fit", () => {
  const positions = [
    { x: 100, baseY: 72, railroad: { id: "first" } },
    { x: 100, baseY: 184, railroad: { id: "second" } },
  ];
  const heights = new Map([["first", 66], ["second", 66]]);

  assert.equal(verticalScaleForColumns(positions, heights), 1);
});
