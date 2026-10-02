import assert from 'node:assert/strict';
import test from 'node:test';
import { loadDataFiles, validateData } from '../scripts/validate-data.js';
import { paintSchemesReferenceFor, statisticEntriesFor } from '../src/railroad-pages.js';

test('Pacific Coast uses GN paint identity and distinguishes operating estimates from report inventory', async () => {
  const data = await loadDataFiles(new URL('..', import.meta.url));
  const pc = data.railroads.find(({ id }) => id === 'pacific-coast');
  assert.equal(pc.parentSystem, 'great-northern');
  assert.equal(pc.history.length, 4);
  assert.deepEqual(pc.reportingMarks, ['PC']);
  assert.deepEqual(pc.paintSchemes, []);
  assert.equal(paintSchemesReferenceFor(pc, data.railroads).railroad.id, 'great-northern');
  const [early, late] = pc.statistics.snapshots;
  assert.deepEqual([early.year, late.year], [1952, 1969]);
  assert.deepEqual(Object.keys(late.metrics), statisticEntriesFor(pc).map(([key]) => key));
  assert.equal(late.metrics.employees.value, '40');
  assert.equal(late.metrics.routeMiles.value, '32.03');
  assert.match(late.metrics.capitalization.note, /1,000,000.*145,000.*1,145,000/);
  for (const key of ['locomotives', 'rollingStock']) {
    assert.match(late.metrics[key].value, /^~/);
    assert.match(late.metrics[key].note, /less than one year/);
    assert.match(late.metrics[key].note, /project estimate/);
  }
  assert.deepEqual(validateData(data), []);
});
