import assert from "node:assert/strict";
import test from "node:test";

import { buildTimelineView, yearFraction } from "../src/timeline.js";
import { loadDataFiles } from "../scripts/validate-data.js";

test("timeline positions equal year intervals at equal physical distances", () => {
  const bounds = { start: 1935, end: 1985 };
  const earlyDistance = yearFraction(1950, bounds) - yearFraction(1940, bounds);
  const lateDistance = yearFraction(1980, bounds) - yearFraction(1970, bounds);
  assert.ok(Math.abs(earlyDistance - .2) < Number.EPSILON);
  assert.ok(Math.abs(lateDistance - .2) < Number.EPSILON);
});

test("NW1 view contains manufacturing, CB&Q, and GN with rebuild cutoff", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const prototype = data.prototypes.find(({ id }) => id === "emc-nw1");
  const historical = data.historicalLocomotives.filter(({ prototypeId }) => prototypeId === prototype.id);
  const view = buildTimelineView(prototype, historical);
  assert.deepEqual(view.rows.map(({ identityId }) => identityId), [
    "manufacturing", "chicago-burlington-quincy", "great-northern",
  ]);
  assert.equal(view.rows.at(-1).end, 1953);
  assert.deepEqual(view.specific.segments.map(({ identityId }) => identityId), ["chicago-burlington-quincy"]);
});

test("NW2 view preserves accepted row order and continuous specific identity", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const prototype = data.prototypes.find(({ id }) => id === "emd-nw2");
  const historical = data.historicalLocomotives.filter(({ prototypeId }) => prototypeId === prototype.id);
  const view = buildTimelineView(prototype, historical);
  assert.deepEqual(view.rows.map(({ identityId }) => identityId), [
    "manufacturing", "chicago-burlington-quincy", "great-northern",
    "northern-pacific", "burlington-northern", "santa-fe",
  ]);
  assert.deepEqual(view.specific.segments.map(({ identityId, start, end }) => ({ identityId, start, end })), [
    { identityId: "chicago-burlington-quincy", start: 1946, end: 1970 },
    { identityId: "burlington-northern", start: 1970, end: 1983 },
  ]);
  assert.equal(view.rows.find(({ identityId }) => identityId === "chicago-burlington-quincy").detail.includes("46"), false);
  assert.deepEqual(view.legend.find(({ identityId }) => identityId === "manufacturing"), {
    identityId: "manufacturing",
    label: "Manufacturing",
    productionCount: 1145,
  });
  assert.deepEqual(view.legend.find(({ identityId }) => identityId === "chicago-burlington-quincy"), {
    identityId: "chicago-burlington-quincy",
    label: "Chicago, Burlington & Quincy",
    operatedCount: 46,
  });
  assert.equal(view.legendNote, "Count = locomotives operated");
});

test("timeline renders without a specific historical locomotive", async () => {
  const data = await loadDataFiles(new URL("..", import.meta.url));
  const prototype = data.prototypes.find(({ id }) => id === "emd-nw2");
  assert.equal(buildTimelineView(prototype, []).specific, null);
});

test("prototype without timeline has no timeline view", () => {
  assert.equal(buildTimelineView({ id: "emd-f3", model: "F3" }, []), null);
});

test("ongoing ranges retain null ends while rendering through the current year", () => {
  const prototype = {
    id: "ge-et44ac", model: "ET44AC", productionCount: null,
    timeline: {
      manufacturing: { start: 2015, end: null, sourceIds: [] },
      lineageService: [{ railroadId: "bnsf", start: 2023, end: null, sourceIds: [] }],
    },
  };
  const historical = [{
    id: "bnsf-3674",
    serviceTimeline: [{ railroadId: "bnsf", roadNumber: "3674", start: 2023, end: null, sourceIds: [] }],
  }];

  const view = buildTimelineView(prototype, historical, 2026);

  assert.deepEqual(view.rows.map(({ end, renderEnd, detail }) => ({ end, renderEnd, detail })), [
    { end: null, renderEnd: 2026, detail: "Manufacturing · ET44AC · 2015–present" },
    { end: null, renderEnd: 2026, detail: "BNSF · ET44AC · 2023–present" },
  ]);
  assert.deepEqual(view.specific.segments.map(({ end, renderEnd, detail }) => ({ end, renderEnd, detail })), [
    { end: null, renderEnd: 2026, detail: "BNSF 3674 · 2023–present" },
  ]);
});
