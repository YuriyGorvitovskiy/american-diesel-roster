import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles } from "../scripts/validate-data.js";
import { layoutTree } from "../src/tree.js";

const data = await loadDataFiles(new URL("..", import.meta.url));

test("layout gives every prototype a node in ordered branch lanes", () => {
  const layout = layoutTree(data.prototypes);
  assert.equal(layout.nodes.length, 25);
  const laneY = Object.fromEntries(layout.nodes.map(({ branch, y }) => [branch, y]));
  assert.ok(laneY.switcher < laneY["freight-cab"]);
  assert.ok(laneY["freight-cab"] < laneY["passenger-cab"]);
  assert.ok(laneY["passenger-cab"] < laneY.gp);
  assert.ok(laneY.gp < laneY.sd);
  for (const branch of ["switcher", "freight-cab", "passenger-cab", "gp", "sd"]) {
    const positions = layout.nodes.filter((node) => node.branch === branch).map(({ x }) => x);
    assert.deepEqual(positions, positions.toSorted((a, b) => a - b));
  }
});

test("layout edges exactly represent declared successor relationships", () => {
  const layout = layoutTree(data.prototypes);
  const expected = data.prototypes.flatMap((prototype) => prototype.successors.map((target) => `${prototype.id}->${target}`)).sort();
  const actual = layout.edges.map(({ sourceId, targetId }) => `${sourceId}->${targetId}`).sort();
  assert.deepEqual(actual, expected);
});

test("layout skips dangling successor relationships", () => {
  const layout = layoutTree([{ id: "source", model: "Source", branch: "gp", successors: ["missing"] }]);
  assert.deepEqual(layout.edges, []);
});
