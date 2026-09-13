import assert from "node:assert/strict";
import test from "node:test";

import { timelinePatternColors } from "../src/timeline-palette.js";

test("railroad timeline identities keep the accepted global color pairs", () => {
  assert.deepEqual(timelinePatternColors("manufacturing"), ["#a92f27", "#a92f27"]);
  assert.deepEqual(timelinePatternColors("great-northern"), ["#255d8f", "#f7f4e9"]);
  assert.deepEqual(timelinePatternColors("chicago-burlington-quincy"), ["#b52d29", "#f7f4e9"]);
  assert.deepEqual(timelinePatternColors("northern-pacific"), ["#d7a91e", "#171814"]);
  assert.deepEqual(timelinePatternColors("spokane-portland-seattle"), ["#236044", "#e4bd32"]);
  assert.deepEqual(timelinePatternColors("santa-fe"), ["#20221f", "#f7f4e9"]);
  assert.deepEqual(timelinePatternColors("burlington-northern"), ["#32a852", "#f7f4e9"]);
  assert.deepEqual(timelinePatternColors("bnsf"), ["#ef7622", "#171814"]);
});

test("unknown timeline identities do not acquire an improvised palette", () => {
  assert.equal(timelinePatternColors("unknown-railroad"), null);
});
