// Tests of the level copy (odd/tasks/0004-sync-levels.md). Run: node --test "tool/**/*.test.mjs"
// They use temporary folders only: no network, no clone of hexablock-api.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { differences, syncLevels } from './sync-levels.mjs';

const write = (root, rel, text) => {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), text);
};
const folders = () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-levels-'));
  return { api: path.join(base, 'api'), app: path.join(base, 'app') };
};

test('should_copy_every_level_when_the_app_has_none', () => {
  const { api, app } = folders();
  write(api, 'hexa-fit/hexa-fit-001.json', '{"n":1}');
  write(api, 'hexa-sort/hexa-sort-001.json', '{"n":1}');

  const result = syncLevels(api, app);

  assert.deepEqual(result, { copied: 2, removed: 0, equal: 0 });
  assert.deepEqual(differences(api, app), []);
});

test('should_keep_files_that_are_not_levels_when_syncing', () => {
  const { api, app } = folders();
  write(api, 'hexa-fit/hexa-fit-001.json', '{"n":1}');
  write(app, 'source.json', '{"commit":"abc"}');
  write(app, 'README.md', 'kept');
  write(app, 'hexa-fit/notes.txt', 'kept');

  syncLevels(api, app);

  assert.equal(fs.readFileSync(path.join(app, 'source.json'), 'utf8'), '{"commit":"abc"}');
  assert.equal(fs.readFileSync(path.join(app, 'README.md'), 'utf8'), 'kept');
  assert.equal(fs.readFileSync(path.join(app, 'hexa-fit/notes.txt'), 'utf8'), 'kept');
});

test('should_copy_only_changed_levels_and_remove_stale_ones_when_the_app_has_an_old_copy', () => {
  const { api, app } = folders();
  write(api, 'hexa-fit/hexa-fit-001.json', '{"v":1}');
  write(api, 'hexa-fit/hexa-fit-002.json', '{"v":2}');
  write(app, 'hexa-fit/hexa-fit-001.json', '{"v":1}');
  write(app, 'hexa-fit/hexa-fit-002.json', '{"v":1}');
  write(app, 'hexa-fit/hexa-fit-099.json', '{"old":true}');

  const result = syncLevels(api, app);

  assert.deepEqual(result, { copied: 1, removed: 1, equal: 1 });
  assert.equal(fs.existsSync(path.join(app, 'hexa-fit/hexa-fit-099.json')), false);
  assert.deepEqual(differences(api, app), []);
});

test('should_list_every_difference_when_the_copy_is_out_of_date', () => {
  const { api, app } = folders();
  write(api, 'hexa-fit/hexa-fit-001.json', '{"v":2}');
  write(api, 'hexa-sort/hexa-sort-001.json', '{}');
  write(app, 'hexa-fit/hexa-fit-001.json', '{"v":1}');
  write(app, 'hexa-fit/hexa-fit-099.json', '{}');

  const lines = differences(api, app);

  assert.deepEqual(lines.sort(), [
    'different from the API: hexa-fit/hexa-fit-001.json',
    'missing in the app: hexa-sort/hexa-sort-001.json',
    'not in the API any more: hexa-fit/hexa-fit-099.json',
  ]);
});
