import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const model = await import('../src/model.mjs').catch(() => ({}));
const glossary = JSON.parse(await readFile(new URL('../data/glossary.json', import.meta.url)));
const terms = glossary.terms;

test('search finds Chinese, abbreviations and aliases without mixing Offline RL with RL', () => {
  assert.equal(typeof model.searchTerms, 'function', 'search behavior is implemented');
  for (const query of ['ppo', '近端策略优化', 'Proximal Policy Optimization']) {
    assert.equal(model.searchTerms(terms, query)[0].id, 'proximal_policy_optimization');
  }
  assert.equal(model.searchTerms(terms, 'Behavioural Cloning')[0].id, 'behavior_cloning');
  assert.equal(model.searchTerms(terms, 'RL')[0].id, 'reinforcement_learning');
  assert.equal(model.searchTerms(terms, '不存在的技术').length, 0);
});

test('preview preserves the center; recenter and browser links preserve mode and term', () => {
  assert.equal(typeof model.reduceState, 'function', 'navigation behavior is implemented');
  const state = {center: 'behavior_cloning', preview: null, view: 'concept', step: null, edge: null};
  const preview = model.reduceState(state, {type: 'preview', id: 'dataset_aggregation'});
  assert.equal(preview.center, state.center);
  assert.equal(preview.preview, 'dataset_aggregation');
  const route = model.reduceState(preview, {type: 'view', view: 'engineering'});
  assert.equal(route.center, state.center);
  const centered = model.reduceState(route, {type: 'center', id: 'dataset_aggregation'});
  assert.equal(centered.center, 'dataset_aggregation');
  assert.equal(centered.preview, null);
  const hash = model.stateHash(centered);
  assert.deepEqual(model.parseHash(hash, terms), {center: 'dataset_aggregation', view: 'engineering', preview: null, step: null, edge: null});
  assert.equal(model.parseHash('#term=bogus&view=bad', terms).center, 'proximal_policy_optimization');
});

test('graph preserves evidence and the original arrow direction for incoming relationships', () => {
  assert.equal(typeof model.neighborhood, 'function', 'graph behavior is implemented');
  const relations = [
    {id:'a', from:'behavior_cloning', to:'imitation_learning', group:'hierarchy', label:'属于', evidence:[{source_id:'source'}]},
    {id:'b', from:'behavior_cloning', to:'policy', group:'purpose', label:'学习得到', evidence:[{source_id:'source'}]},
    {id:'c', from:'policy', to:'markov_decision_process', group:'related', label:'相关', evidence:[{source_id:'source'}]}
  ];
  const incoming = model.neighborhood('imitation_learning', relations);
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0].neighborId, 'behavior_cloning');
  assert.equal(incoming[0].from, 'behavior_cloning');
  assert.equal(incoming[0].to, 'imitation_learning');
  assert.equal(model.neighborhood('policy', relations).find(x=>x.id==='c').group, 'related');
  assert.equal(model.neighborhood('force_closure', relations).length, 0);
});

test('engineering occurrences are explicit and never inferred from generic related terms', () => {
  assert.equal(typeof model.termOccurrences, 'function', 'route linking is implemented');
  const route = {nodes:[{id:'train',term_ids:['policy']},{id:'run',term_ids:['policy']},{id:'camera',term_ids:[]}]};
  assert.deepEqual(model.termOccurrences('policy', route).map(n=>n.id), ['train','run']);
  assert.equal(model.termOccurrences('tactile_sensing', route).length, 0);
});
