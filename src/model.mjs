export const DEFAULT_TERM = 'proximal_policy_optimization';

const normalize = value => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s‐‑–—-]+/g, ' ');

export function searchTerms(terms, query) {
  const q = normalize(query);
  if (!q) return terms;
  return terms.map(term => {
    const names = [term.name.abbreviation, term.name.zh, term.name.en, ...term.name.aliases].filter(Boolean).map(normalize);
    const score = names.some(n => n === q) ? 0 : names.some(n => n.startsWith(q)) ? 1 : names.some(n => n.includes(q)) ? 2 : 99;
    return {term, score};
  }).filter(row => row.score < 99).sort((a,b) => a.score - b.score || a.term.name.zh.localeCompare(b.term.name.zh, 'zh')).map(row => row.term);
}

export function reduceState(state, action) {
  switch (action.type) {
    case 'preview': return {...state, preview: action.id, step: null, edge: action.edge ?? null};
    case 'center': return {...state, center: action.id, preview: null, step: null, edge: null};
    case 'view': return {...state, view: action.view, step: null, edge: null};
    case 'step': return {...state, step: action.id, preview: null, edge: null};
    case 'edge': return {...state, edge: action.id, step: null, preview: null};
    case 'reset-preview': return {...state, preview: null, step: null, edge: null};
    default: return state;
  }
}

export function stateHash(state) {
  return `#${new URLSearchParams({term: state.center, view: state.view})}`;
}

export function parseHash(hash, terms) {
  const query = new URLSearchParams(hash.replace(/^#/, ''));
  const center = terms.some(term=>term.id===query.get('term')) ? query.get('term') : DEFAULT_TERM;
  return {center, view: query.get('view') === 'engineering' ? 'engineering' : 'concept', preview: null, step: null, edge: null};
}

export function neighborhood(center, relations) {
  return relations.filter(relation=>relation.from===center || relation.to===center).map(relation=>({
    ...relation, neighborId: relation.from===center ? relation.to : relation.from
  }));
}

export function termOccurrences(id, route) {
  return route.nodes.filter(node=>node.term_ids.includes(id));
}
