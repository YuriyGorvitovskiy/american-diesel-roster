import assert from 'node:assert/strict';
import test from 'node:test';
import { loadDataFiles } from '../scripts/validate-data.js';

test('Orient Texas describes operated resources and references shared Santa Fe paint history', async () => {
  const data = await loadDataFiles(new URL('..', import.meta.url));
  const railroad = data.railroads.find(({ id }) => id === 'kcmo-texas');
  assert.equal(railroad.parentSystem, 'santa-fe');
  assert.equal(railroad.successor, 'santa-fe');
  assert.deepEqual(railroad.statistics?.snapshots.map(({ year, metrics }) => [year, ...Object.values(metrics).map(({ value }) => value)]), [
    [1951, '603 mi', '~900', '~35', '~1,700', '~$9M'],
    [1964, '603 mi', '~550', '~30', '~1,700', '~$9M'],
  ]);
  assert.match(railroad.statistics.intro, /not.*legally owned/i);
  assert.match(railroad.history[0], /effective January 1, 1931/);
  assert.equal(railroad.statistics.snapshots[0].label, 'Early Documented Diesel Operation');
  assert.ok(railroad.sourceIds.includes('fraser-chronicle-kcmo-strike-1928'));
  assert.ok(railroad.sourceIds.includes('us-supreme-court-kcmo-valuation-1929'));
  assert.equal(railroad.sourceIds.includes('sfhms-atsf-eunit-assignments'), false);
  assert.match(railroad.statistics.snapshots[1].context, /2867.*Presidio.*1961/);
  assert.deepEqual(railroad.paintSchemes, []);
  assert.equal(railroad.paintSchemesReference, 'santa-fe');
  assert.ok(railroad.sourceIds.includes('smu-atsf-2867-presidio-1961'));
  assert.ok(railroad.statistics.snapshots.every((snapshot) => !('date' in snapshot)));
});
