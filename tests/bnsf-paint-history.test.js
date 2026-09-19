import assert from "node:assert/strict";
import test from "node:test";
import { loadDataFiles, validateData } from "../scripts/validate-data.js";

test("BNSF paint history retains all 16 accepted appearances in chronological order", async () => {
  const { railroads, sources } = await loadDataFiles(new URL("..", import.meta.url));
  const schemes = railroads.find(({ id }) => id === "bnsf").paintSchemes;
  const ids = schemes.map(({ id }) => id);
  assert.deepEqual(ids, [
    "premium-heritage",
    "bnsf-lettered-warbonnet",
    "bnsf-kodachrome",
    "bnsf-executive-green",
    "bnsf-cascade-green",
    "bnsf-blue-yellow",
    "great-pumpkin",
    "heritage-i",
    "heritage-ii",
    "simplified-heritage-ii",
    "golden-swoosh",
    "heritage-iii",
    "heritage-iv",
    "blue-white-smurfs",
    "twenty-fifth-anniversary",
    "america250",
  ]);
  for (const id of ids) {
    const scheme = schemes.find((item) => item.id === id);
    assert.ok(scheme, `${id} is present`);
    assert.ok(scheme.photo.remoteImageUrl, `${id} has a historical photograph`);
    assert.ok(scheme.photo.sourcePage, `${id} links to the photograph source`);
    for (const sourceId of scheme.sourceIds) assert.ok(sources.some((source) => source.id === sourceId));
  }
});

test("paint history rejects broken provenance and incomplete photographs", async () => {
  const data = structuredClone(await loadDataFiles(new URL("..", import.meta.url)));
  const bnsf = data.railroads.find(({ id }) => id === "bnsf");
  bnsf.statistics.snapshots[0].sourceIds = ["missing-snapshot-source"];
  bnsf.paintSchemes[0].sourceIds = ["missing-scheme-source"];
  bnsf.paintSchemes[1].id = bnsf.paintSchemes[0].id;
  bnsf.paintSchemes[2].photo.remoteImageUrl = "";

  const errors = validateData(data);
  assert.ok(errors.some((error) => error.includes('unknown source "missing-snapshot-source"')));
  assert.ok(errors.some((error) => error.includes('unknown source "missing-scheme-source"')));
  assert.ok(errors.some((error) => error.includes("Duplicate BNSF paint scheme id")));
  assert.ok(errors.some((error) => error.includes("remoteImageUrl")));
});
