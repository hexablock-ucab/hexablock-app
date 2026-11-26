// Tests of the class-model generator. Run: node --test "tool/**/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, generateRepo, differences, typeArgs } from './generate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MODEL = path.join(ROOT, 'docs/diagrams/class-model.json');
const loadModel = () => JSON.parse(fs.readFileSync(MODEL, 'utf8'));

test('should_match_every_committed_file_when_generated_from_class_model_json', () => {
  const { files, errors, warnings } = generateRepo(ROOT);

  const diff = differences(ROOT, files);

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(diff, [], `run node tool/class-model/generate.mjs and commit: ${diff.join(', ')}`);
});

test('should_report_the_view_as_different_when_the_json_changes_and_the_puml_does_not', () => {
  const model = loadModel();
  const board = model.classes.find((c) => c.name === 'BoardBuilder');
  board.operations[0].name = 'renamedForTheTest';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'class-model-'));
  fs.mkdirSync(path.join(tmp, 'docs/diagrams'), { recursive: true });
  const committed = generateRepo(ROOT).files;
  for (const [rel, text] of committed) {
    fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
    fs.writeFileSync(path.join(tmp, rel), text);
  }

  const { files } = generate(model, {});
  const diff = differences(tmp, files);

  assert.ok(diff.includes('docs/diagrams/class-diagram-engine-board.puml'), `differences: ${diff.join(', ')}`);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('should_report_an_error_when_a_relation_targets_an_unknown_class', () => {
  const model = loadModel();
  model.classes[0].relations.push({ type: 'association', target: 'NoSuchClass', targetType: 'NoSuchClass' });

  const { errors } = generate(model, {});

  assert.ok(errors.some((e) => e.includes('unknown relation target NoSuchClass')), errors.join('\n'));
});

test('should_draw_a_create_constructor_from_the_attributes_when_the_class_is_a_value_object', () => {
  const model = loadModel();

  const { files } = generate(model, {});

  const view = files.get('docs/diagrams/class-diagram-engine-progress.puml');
  assert.match(view, /\+«create» Score\(points : int\)\n/);
  assert.match(view, /\{static\} \+«create» zero\(\) : Score\n/);
  const board = files.get('docs/diagrams/class-diagram-engine-board.puml');
  assert.match(board, /~«create» Board\(topology : ITopology, coordinates : List<Coordinate>, contents : Map<Coordinate, TCell>\)\n/);
});

test('should_add_a_note_with_the_uml_bound_when_a_type_parameter_has_one', () => {
  const model = loadModel();

  const { files } = generate(model, {});

  const view = files.get('docs/diagrams/class-diagram-engine-cycle.puml');
  assert.match(view, /note left of SlideMergeRule : TCell > IMergeable~<TCell>\n/);
});

test('should_split_nested_type_arguments_when_reading_a_bound_type', () => {
  const args = typeArgs('IGameRules<ColorId, Map<Coordinate, int>, LinesState>');

  assert.deepEqual(args, ['ColorId', 'Map<Coordinate, int>', 'LinesState']);
});
