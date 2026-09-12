import assert from "node:assert/strict";
import test from "node:test";

import { groupRosterRows } from "../src/roster.js";

test("roster grouping preserves owned items and orders", () => {
  const rows = [{ id: "a", status: "ordered" }, { id: "b", status: "owned" }, { id: "c", status: "ordered" }];
  assert.deepEqual(groupRosterRows(rows), {
    owned: [{ id: "b", status: "owned" }],
    ordered: [{ id: "a", status: "ordered" }, { id: "c", status: "ordered" }],
  });
});
