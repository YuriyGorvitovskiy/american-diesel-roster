import assert from "node:assert/strict";
import test from "node:test";

import { loadDataFiles } from "../scripts/validate-data.js";
import { formatProductionCount, layoutTree, treeNodeView } from "../src/tree.js";

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
  const nodeIds = new Set(layout.nodes.map(({ id }) => id));
  const expected = data.prototypes
    .filter(({ id }) => nodeIds.has(id))
    .flatMap((prototype) => prototype.successors.filter((target) => nodeIds.has(target)).map((target) => `${prototype.id}->${target}`))
    .sort();
  const actual = layout.edges.map(({ sourceId, targetId }) => `${sourceId}->${targetId}`).sort();
  assert.deepEqual(actual, expected);
});

test("GE Universal rows place U23 branches below the main progression", () => {
  const layout = layoutTree(data.prototypes, "ge");
  for (const [mainModel, branchModel] of [["U28B", "U23B"], ["U28C", "U23C"]]) {
    const main = layout.nodes.find(({ model }) => model === mainModel);
    const branch = layout.nodes.find(({ model }) => model === branchModel);
    assert.equal(branch.x, main.x);
    assert.ok(branch.y > main.y);
    assert.equal(layout.edges.find(({ targetId }) => targetId === branch.id).angled, true);
  }
});

test("layout skips dangling successor relationships", () => {
  const layout = layoutTree([{ id: "source", model: "Source", branch: "gp", successors: ["missing"] }]);
  assert.deepEqual(layout.edges, []);
});

test("tree nodes expose production instead of visible status text", () => {
  assert.deepEqual(treeNodeView({ id: "emc-nw1", model: "NW1", productionCount: 27 }, "historical_only"), {
    href: "/locomotive.html?id=emc-nw1",
    model: "NW1",
    production: "27",
    status: "historical_only",
    accessibleLabel: "NW1, 27 produced, historical context",
  });
  assert.equal(formatProductionCount(1145), "1,145");
});

test("unknown tree production renders a dash without inventing a total", () => {
  assert.deepEqual(treeNodeView({ id: "emd-ft", model: "FT", productionCount: null }, "historical_only"), {
    href: "/locomotive.html?id=emd-ft",
    model: "FT",
    production: "—",
    status: "historical_only",
    accessibleLabel: "FT, production unknown, historical context",
  });
});
