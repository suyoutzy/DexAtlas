export const CATEGORY_COLORS = {
  manipulation_tasks:'#dc82c7', robotics_foundations:'#9b9ee0', sensing_and_mapping:'#63cbd8',
  learning_foundations:'#92afe8', learning_paradigms:'#bb99df', learning_settings:'#7eb9d7',
  learning_algorithms:'#a48bd6', policy_models:'#87b3e4', named_policy_methods:'#ce92cf', simulation_transfer:'#80c9d0'
};
export const endpoint = value => typeof value==='object' ? value.id : value;

export function buildGraph(glossary,annotations,framework) {
  const nodes = glossary.terms.map((term,index)=>({id:term.id,kind:'term',label:term.name.abbreviation||term.name.zh,title:term.name.zh,category:term.category_id,color:CATEGORY_COLORS[term.category_id]||'#a0a8cf',index}));
  nodes.push(...framework.stages.map((stage,index)=>({id:`stage:${stage.id}`,stageId:stage.id,kind:'stage',label:stage.short,title:stage.title,color:'#E3BE7C',index})));
  const links = [
    ...annotations.relations.map(r=>({...structuredClone(r),id:`concept:${r.id}`,recordId:r.id,kind:'concept'})),
    ...framework.flows.map(r=>({...structuredClone(r),id:`flow:${r.id}`,recordId:r.id,kind:'flow',from:`stage:${r.from}`,to:`stage:${r.to}`})),
    ...framework.usages.map(r=>({...structuredClone(r),id:`usage:${r.id}`,recordId:r.id,kind:'usage',from:`stage:${r.stage_id}`,to:r.term_id}))
  ].map(r=>({...r,source:r.from,target:r.to}));
  const ids=new Set(nodes.map(n=>n.id));
  for(const edge of links) if(!ids.has(edge.from)||!ids.has(edge.to)) throw new Error(`无法定位关系端点：${edge.id}`);
  return {nodes,links};
}

export function nodeTextVisible(node,state,links=[]) {
  return node.kind==='stage'||state.showLabels||node.id===state.focused||node.id===state.hovered||!!(state.hovered&&links.some(link=>link.from===state.hovered&&link.to===node.id||link.to===state.hovered&&link.from===node.id));
}
export function parseSceneHash(hash,terms,stages) {
  const query=new URLSearchParams(hash.replace(/^#/,''));
  if(terms.some(t=>t.id===query.get('term'))) return {kind:'term',id:query.get('term')};
  if(stages.some(s=>s.id===query.get('stage'))) return {kind:'stage',id:query.get('stage')};
  return {kind:'overview',id:null};
}
export function sceneHash(route) {
  return route.kind==='overview'?'':`#${new URLSearchParams({[route.kind]:route.id})}`;
}
