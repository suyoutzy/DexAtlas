export const RELATION_TYPES=Object.freeze({
 is_a:'是目标通用概念中的一种子类或子问题',method_in:'是目标范式或方法族中的具体方法',setting_of:'是目标范式的数据或训练设置',
 uses:'使用目标组件或概念',can_use:'在明确条件或实现中可选用目标',produces:'产生目标类型的结果',optimizes:'优化目标对象或参数',
 formalizes:'为目标提供数学形式化',supports:'为目标提供支持，不表示必选或保证成功',evaluates:'为分析或评价目标提供依据',
 addresses:'针对目标问题的方法，不保证独立解决',affected_by:'受到目标问题或条件的影响',acts_in:'选择目标动作空间中的元素',
 defined_by:'由目标等规格共同确定',differs_from:'按明确维度区别，非上下位关系',defined_on:'在目标空间或域中表述',parameterizes:'可通过参数化表示目标'
});
export const RELATION_PREDICATES=new Set(Object.keys(RELATION_TYPES));
export function deriveRelatedTerms(id,relations){
 return relations.filter(r=>r.from===id&&r.review?.status==='reviewed').map(r=>({term_id:r.to,relation:r.predicate,note:r.explanation}));
}
export function validateContent(glossary,annotations,framework){
 const errors=[],sources=new Map(),terms=new Map(),stages=new Set(framework.stages.map(s=>s.id)),categories=new Set(glossary.categories.map(c=>c.id));
 const error=(where,message)=>errors.push(where+'：'+message);
 for(const s of [...glossary.sources,...annotations.sources,...framework.sources]){
  if(sources.has(s.id))error(s.id,'重复来源');sources.set(s.id,s);
  for(const key of ['title','url','kind','authority_basis','usage_boundary','checked_on','verification'])if(!s[key])error(s.id,'缺少来源字段 '+key);
  if(!/^https?:\/\//.test(s.url))error(s.id,'无效来源网址');
 }
 function metadataRefs(value,where){
  if(Array.isArray(value)){value.forEach((v,i)=>metadataRefs(v,where+'['+i+']'));return;}
  if(!value||typeof value!=='object')return;
  for(const [key,v] of Object.entries(value)){
   if(/(^|_)source_ids$/.test(key)){if(!Array.isArray(v))error(where+'.'+key,'来源 ID 列表必须是数组');else for(const id of v)if(!sources.has(id))error(where+'.'+key,'未知来源元数据引用 '+id);}
   else metadataRefs(v,where+'.'+key);
  }
 }
 for(const [name,value] of Object.entries({glossary,annotations,framework}))metadataRefs(value,name);
 function refs(rows,where){
  if(!rows?.length){error(where,'缺少证据');return;}
  for(const r of rows){if(!sources.has(r.source_id))error(where,'未知来源 '+r.source_id);else if(sources.get(r.source_id).verification==='metadata_only')error(where,'仅元数据来源不能证明正文命题 '+r.source_id);if(!(r.locator||r.use))error(where,'缺少证据定位');}
 }
 for(const t of glossary.terms){
  if(terms.has(t.id))error(t.id,'重复术语');terms.set(t.id,t);
  for(const k of ['definition','type','category_id','role'])if(!t[k])error(t.id,'缺少词条字段 '+k);
  if(!categories.has(t.category_id))error(t.id,'未知导航分组');
  if(!t.name.en||!t.name.zh||!Array.isArray(t.name.aliases))error(t.id,'名称不完整');
  if(t.review?.status!=='reviewed')error(t.id,'词条未审核');
  refs(t.references,t.id);
  for(const k of ['definition','role','applications','current_value'])refs(t.claim_evidence?.[k],t.id+'.'+k);
  if(!t.applications?.length||!t.current_value.conditions||!t.current_value.limitations)error(t.id,'缺少应用或条件局限');
  if(JSON.stringify(t.related_terms)!==JSON.stringify(deriveRelatedTerms(t.id,annotations.relations)))error(t.id,'兼容关系与主关系表不一致');
 }
 const edgeIds=new Set(),triples=new Set();
 for(const r of annotations.relations){
  if(edgeIds.has(r.id))error(r.id,'重复关系 ID');edgeIds.add(r.id);
  if(!terms.has(r.from)||!terms.has(r.to)||r.from===r.to)error(r.id,'无效关系端点');
  if(!RELATION_PREDICATES.has(r.predicate))error(r.id,'未知关系类型');
  if(!glossary.relation_types?.[r.predicate])error(r.id,'未声明关系类型 '+r.predicate);
  if(!['hierarchy','usage','purpose','contrast'].includes(r.group))error(r.id,'无效显示分组');
  if(!['general','case','comparison'].includes(r.scope)||!r.context||!r.explanation)error(r.id,'缺少关系范围或限定');
  if(r.review?.status!=='reviewed'||!r.review.basis)error(r.id,'关系未审核或缺少依据类别');
  const key=[r.from,r.predicate,r.to,r.context].join('|');if(triples.has(key))error(r.id,'重复关系命题');triples.add(key);refs(r.evidence,r.id);
 }
 const hierarchy=new Map();for(const r of annotations.relations)if(r.predicate==='is_a'){if(!hierarchy.has(r.from))hierarchy.set(r.from,[]);hierarchy.get(r.from).push(r.to);}
 const done=new Set(),path=new Set();function visit(id){if(path.has(id)){error(id,'上下位循环');return;}if(done.has(id))return;path.add(id);for(const next of hierarchy.get(id)||[])visit(next);path.delete(id);done.add(id);}for(const id of hierarchy.keys())visit(id);
 for(const u of framework.usages){if(!stages.has(u.stage_id)||!terms.has(u.term_id))error(u.id,'无效工程用途端点');if(!u.context||u.review?.status!=='reviewed')error(u.id,'缺少工程用途范围或审核');refs(u.evidence,u.id);}
 for(const f of framework.flows){if(!stages.has(f.from)||!stages.has(f.to)||f.scope!=='editorial_navigation')error(f.id,'工程导航必须标明编辑性范围');refs(f.evidence,f.id);}
 for(const [id,h] of Object.entries(annotations.history)){if(!terms.has(id)||!h.basis)error(id,'无效沿革');refs(h.evidence,id+'.history');}
 return errors;
}
