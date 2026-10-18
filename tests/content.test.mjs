import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const glossary = JSON.parse(await readFile(new URL('../data/glossary.json', import.meta.url)));
const annotations = await readFile(new URL('../data/annotations.json', import.meta.url)).then(JSON.parse).catch(()=>null);

test('published graph relationships have valid endpoints and individually traceable evidence', () => {
  assert.ok(annotations, 'the cited graph fixture exists');
  const termIds = new Set(glossary.terms.map(t=>t.id));
  const sources = new Set([...glossary.sources, ...annotations.sources].map(s=>s.id));
  for (const relation of annotations.relations) {
    assert.ok(termIds.has(relation.from) && termIds.has(relation.to), relation.id);
    assert.ok(relation.label && relation.explanation && relation.evidence.length, relation.id);
    for (const ref of relation.evidence) assert.ok(sources.has(ref.source_id) && ref.locator, relation.id);
  }
});

test('real route includes vision training and control feedback without invented tactile or ACT stages', () => {
  assert.ok(annotations, 'the documented engineering fixture exists');
  const route = annotations.route;
  const ids = new Set(route.nodes.map(n=>n.id));
  assert.equal(route.paper_url, 'https://arxiv.org/html/1808.00177v5');
  assert.ok(ids.has('vision-training') && ids.has('policy-training') && ids.has('inference'));
  for (const node of route.nodes) assert.ok(node.inputs.length && node.outputs.length && node.evidence.length, node.id);
  for (const edge of route.edges) assert.ok(ids.has(edge.from) && ids.has(edge.to) && edge.label && edge.evidence.length, edge.id);
  const used = route.nodes.flatMap(n=>n.term_ids);
  const termIds = new Set(glossary.terms.map(t=>t.id));
  assert.ok(used.every(id=>termIds.has(id)), 'all route term links resolve');
  const sources = new Set([...glossary.sources,...annotations.sources].map(s=>s.id));
  for (const history of Object.values(annotations.history)) {
    assert.ok(history.evidence.length && history.basis);
    assert.ok(history.evidence.every(ref=>sources.has(ref.source_id) && ref.locator));
  }
  assert.ok(used.includes('proximal_policy_optimization'));
  assert.ok(!used.includes('tactile_sensing') && !used.includes('action_chunking_with_transformers'));
  assert.ok(route.edges.some(e=>e.feedback));
});
