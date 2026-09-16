import assert from "node:assert/strict";
import test from "node:test";

import { MANUFACTURER_PROTOTYPES } from "../src/manufacturer-prototype.js";

for (const manufacturer of ["emd", "ge"]) {
  test(`${manufacturer.toUpperCase()} prototype data documents every selected model`, () => {
    const page = MANUFACTURER_PROTOTYPES[manufacturer];
    const models = page.families.flatMap(({ models }) => models);

    assert.ok(models.length >= (manufacturer === "emd" ? 40 : 28));
    assert.equal(new Set(models.map(({ model }) => model)).size, models.length);
    assert.ok(models.every(({ production, years, railroadIds, source }) => (
      Number.isInteger(production)
      && typeof years === "string"
      && railroadIds.length > 0
      && typeof source === "string"
    )));
    assert.equal(page.caption, `Number in each node = ${manufacturer.toUpperCase()}-built production.`);
  });
}

test("GE Tier 4 nodes distinguish four- and six-motor BNSF locomotives", () => {
  const models = MANUFACTURER_PROTOTYPES.ge.families.flatMap(({ models }) => models.map(({ model }) => model));
  assert.equal(models.includes("ET44AC/H"), true);
  assert.equal(models.includes("ET44C4"), true);
  assert.equal(models.includes("U30B"), true);
  assert.equal(models.includes("C36-7"), false);
});

test("EMD switcher generations stay chronological and include BN-family omissions", () => {
  const families = MANUFACTURER_PROTOTYPES.emd.families;
  const nw = families.find(({ id }) => id === "emd-nw-switchers");
  const earlySw = families.find(({ id }) => id === "emd-sw-early");
  const lateSw = families.find(({ id }) => id === "emd-sw-late");

  assert.deepEqual(nw.models.map(({ model }) => model), ["NW1", "NW2", "NW3", "NW5"]);
  assert.deepEqual(earlySw.models.map(({ model }) => model), ["SW1", "SW7", "SW8", "SW9", "SW1200"]);
  assert.deepEqual(lateSw.models.map(({ model }) => model), ["SW1000", "SW1500"]);
  assert.equal(lateSw.models.find(({ model }) => model === "SW1000").production, 119);
});

test("EMD cab-unit rows follow introduction chronology", () => {
  const families = MANUFACTURER_PROTOTYPES.emd.families;
  const earlyE = families.find(({ id }) => id === "emd-e-early");
  const lateE = families.find(({ id }) => id === "emd-e-late");
  const f = families.find(({ id }) => id === "emd-f-units");
  const cowls = families.find(({ id }) => id === "emd-cowl-units");

  assert.deepEqual(earlyE.models.map(({ model }) => model), ["E1", "E3", "E6", "E5"]);
  assert.deepEqual(lateE.models.map(({ model }) => model), ["E7", "E8", "E9"]);
  assert.deepEqual(f.models.map(({ model }) => model), ["FT", "F3", "F7", "FP7", "F9"]);
  assert.deepEqual(cowls.models.map(({ model }) => model), ["FP45", "F45", "SDP40F"]);
  assert.equal(earlyE.models.find(({ model }) => model === "E3").production, 19);
});

test("EMD GP rows distinguish 645, Dash-2-era, and late generations", () => {
  const families = MANUFACTURER_PROTOTYPES.emd.families;
  const rows = ["emd-gp-early", "emd-gp-645", "emd-gp-dash2", "emd-gp-modern"]
    .map((id) => families.find((family) => family.id === id));

  assert.deepEqual(rows.map(({ label, models }) => ({
    label,
    models: models.map(({ model }) => model),
  })), [
    { label: "GP · EARLY", models: ["GP7", "GP9", "GP20", "GP18", "GP30", "GP35"] },
    { label: "GP · 645", models: ["GP40", "GP38", "GP38AC"] },
    { label: "GP · DASH-2 ERA", models: ["GP38-2", "GP40-2", "GP39-2", "GP15-1", "GP40X"] },
    { label: "GP · LATE", models: ["GP50", "GP60", "GP60M", "GP60B"] },
  ]);
});

test("EMD SD rows follow product chronology inside each generation", () => {
  const families = MANUFACTURER_PROTOTYPES.emd.families;
  const expected = new Map([
    ["emd-sd-early", ["SD7", "SD9", "SD24"]],
    ["emd-sd-645", ["SD45", "SD40", "SDP40", "SDP45", "SD39"]],
    ["emd-sd-dash2", ["SD40-2", "SD45-2", "SD38-2"]],
    ["emd-sd-modern", ["SD50", "SD60M", "SD70MAC", "SD75M", "SD75I", "SD70ACe"]],
  ]);

  for (const [id, models] of expected) {
    assert.deepEqual(families.find((family) => family.id === id).models.map(({ model }) => model), models);
  }
  assert.equal(
    families.flatMap(({ models }) => models).find(({ model }) => model === "SD75M").production,
    76,
  );
  assert.equal(
    families.flatMap(({ models }) => models).find(({ model }) => model === "SD75I").production,
    207,
  );
});

test("EMD generations stay in compact, independently readable rows", () => {
  const longestRow = Math.max(...MANUFACTURER_PROTOTYPES.emd.families.map(({ models }) => models.length));
  assert.ok(longestRow <= 7);
});

test("Frisco predecessor audit is represented in both manufacturer selections", () => {
  const emd = MANUFACTURER_PROTOTYPES.emd.families.flatMap(({ models }) => models);
  const ge = MANUFACTURER_PROTOTYPES.ge.families.flatMap(({ models }) => models);

  assert.equal(emd.find(({ model }) => model === "MP15DC").production, 351);
  assert.equal(emd.find(({ model }) => model === "GP38AC").production, 261);
  assert.equal(ge.find(({ model }) => model === "45-ton").railroadIds.includes("SLSF"), true);
  assert.ok(["NW2", "SW7", "E8", "F7", "GP15-1", "SD45"].every((name) => (
    emd.find(({ model }) => model === name).railroadIds.includes("SLSF")
  )));
  assert.ok(["44-ton", "U25B", "U30B", "B30-7"].every((name) => (
    ge.find(({ model }) => model === name).railroadIds.includes("SLSF")
  )));
});

test("every selected model records an eligible BNSF-genealogy railroad", () => {
  const genealogy = new Set(["ATSF", "GN", "NP", "CB&Q", "SP&S", "SLSF", "BN", "BNSF"]);
  const models = Object.values(MANUFACTURER_PROTOTYPES).flatMap(({ families }) => (
    families.flatMap(({ models }) => models)
  ));

  assert.ok(models.every(({ railroadIds }) => railroadIds.some((id) => genealogy.has(id))));
  assert.ok(models.every(({ railroadIds }) => railroadIds.every((id) => genealogy.has(id))));
});
