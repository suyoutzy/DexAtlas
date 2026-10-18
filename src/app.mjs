import {searchTerms,neighborhood} from './model.mjs';
import {buildGraph,parseSceneHash,sceneHash,CATEGORY_COLORS} from './atlas-model.mjs';
import {createGraphScene,supportsWebGL} from './graph-scene.mjs';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={
  back:'<path d="m10 6-6 6 6 6M4 12h16"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  labels:'<path d="M4 6V4h16v2M12 4v16M8 20h8"/>',
  overview:'<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/><circle cx="12" cy="12" r="3"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>'
};
for(const [key,paths] of Object.entries(icons)) $('#'+(key==='labels'?'labels':key)+'-button').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+paths+'</svg>';
const groups={hierarchy:'所属与细分',usage:'使用与被使用',purpose:'作用与应用',contrast:'相近与区别'};
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let glossary,annotations,framework,termMap,sourceMap,graphData,scene;
let route={kind:'overview',id:null},trail=[],showLabels=false,focusTimer,focusVersion=0,ready=false,graphAvailable=false;
let searchRows=[],searchIndex=0,readerReturn=null;
const name=id=>termMap.get(id)?.name.abbreviation||termMap.get(id)?.name.zh||framework.stages.find(s=>s.id===id)?.title||id;
const termName=id=>termMap.get(id)?.name.zh||id;
const announce=text=>$('#announcement').textContent=text;
const safeURL=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};
const sourceLinks=refs=>[...new Map((refs||[]).map(r=>[r.source_id+'|'+r.locator,r])).values()].map(ref=>{
  const source=sourceMap.get(ref.source_id);
  return source?'<a class="source-link" href="'+esc(safeURL(source.url))+'" target="_blank" rel="noopener noreferrer">'+esc(source.title)+'<span>↗</span><small>'+esc(ref.locator||ref.use||source.kind)+'</small></a>':'';
}).join('');
const stageById=id=>framework.stages.find(s=>s.id===id);
const chips=ids=>ids.map(id=>'<button class="term-chip" data-action="focus" data-kind="term" data-id="'+esc(id)+'">'+esc(name(id))+'</button>').join('');

async function readJSON(file) {
  const response=await fetch(new URL('../data/'+file,import.meta.url));
  if(!response.ok)throw new Error('无法读取 '+file);
  return response.json();
}
function setBack() {
  $('#back-button').hidden=trail.length===0;
  $('#back-separator').hidden=trail.length===0;
}
function closeReader() {
  $('#reader-panel').hidden=true;
  if(readerReturn?.isConnected)readerReturn.focus({preventScroll:true});
  readerReturn=null;
}
function closeConcept() {
  clearTimeout(focusTimer);focusVersion++;
  $('#concept-layer').hidden=true;
  if(!graphAvailable)$('#fallback-panel').hidden=false;
}
function closeSearch() {
  $('#search-panel').hidden=true;$('#search-button').setAttribute('aria-expanded','false');
}
function closeSettings() {
  $('#settings-panel').hidden=true;$('#settings-button').setAttribute('aria-expanded','false');
}
function dismissCards() {
  closeReader();closeConcept();$('#stage-panel').hidden=true;
}
function navigate(next,{push=true,fly=true}={}) {
  clearTimeout(focusTimer);const version=++focusVersion;
  closeSearch();closeSettings();closeReader();
  $('#concept-layer').hidden=true;$('#stage-panel').hidden=true;
  if(push&&sceneHash(next)!==sceneHash(route)) {
    trail=[...trail,{...route}].slice(-40);
    history.pushState({dexatlas:true,trail},'',location.pathname+location.search+sceneHash(next));
  }
  route=next;setBack();
  const focused=route.kind==='term'?route.id:route.kind==='stage'?'stage:'+route.id:null;
  scene?.update({focused,showLabels});
  $('#graph').dataset.focused=focused||'';
  $('#fallback-panel').hidden=graphAvailable||route.kind!=='overview';
  document.title=route.kind==='term'?termName(route.id)+' · DexAtlas':'DexAtlas · 灵巧操作术语图谱';
  if(route.kind==='term') {
    if(fly)scene?.focus(focused);
    focusTimer=setTimeout(()=>{if(version===focusVersion){renderConcept();announce('已聚焦'+termName(route.id));}},motion.matches||!graphAvailable?0:600);
  } else if(route.kind==='stage') {
    if(fly)scene?.focus(focused);
    renderStage(route.id);announce('工程环节：'+stageById(route.id).title);
  }
}
function openReader(html,kind='词条说明') {
  if($('#reader-panel').hidden)readerReturn=document.activeElement;
  $('#reader-kind').textContent=kind;
  $('#reader-content').innerHTML=html;
  $('#reader-panel').hidden=false;
  $('#reader-content').scrollTop=0;
  $('#reader-panel').focus({preventScroll:true});
}
function readTerm(id) {
  const term=termMap.get(id);if(!term)return;
  const historyRecord=annotations.history[id];
  const usage=framework.usages.filter(u=>u.term_id===id);
  const related=route.kind==='term'&&route.id!==id?annotations.relations.find(r=>(r.from===id&&r.to===route.id)||(r.to===id&&r.from===route.id)):null;
  openReader('<span class="eyebrow">'+esc(term.type)+'</span><h2>'+esc(term.name.zh)+'</h2><p class="english">'+esc(term.name.en)+(term.name.abbreviation?' · '+esc(term.name.abbreviation):'')+'</p>'+
    (route.kind!=='term'||route.id!==id?'<button class="accent-button" data-action="focus" data-kind="term" data-id="'+esc(id)+'">以此词为中心</button>':'')+
    '<section><h3>是什么</h3><p>'+esc(term.definition)+'</p></section><section><h3>解决什么问题</h3><p>'+esc(term.role)+'</p></section>'+
    (related?'<section class="relationship-note"><h3>与当前术语的联系</h3><p>'+esc(termName(related.from))+' · '+esc(related.label)+' · '+esc(termName(related.to))+'</p><p>'+esc(related.explanation)+'</p><button class="inline-button" data-action="relation" data-id="'+esc(related.id)+'">查看关系依据</button></section>':'')+
    '<details><summary>工程中的位置</summary>'+(usage.length?usage.map(u=>'<div class="usage-location"><button class="location-link" data-action="focus" data-kind="stage" data-id="'+esc(u.stage_id)+'">'+esc(stageById(u.stage_id).title)+'<small>'+esc(u.label)+'</small></button><button class="inline-button" data-action="relation" data-id="usage:'+esc(u.id)+'">用途与依据</button></div>').join(''):'<p>当前框架尚未标注该术语的工程位置。</p>')+'</details>'+
    '<details><summary>当前价值与局限</summary><p>'+esc(term.current_value.status)+'</p><h3>适用条件</h3><p>'+esc(term.current_value.conditions)+'</p><h3>主要局限</h3><p>'+esc(term.current_value.limitations)+'</p></details>'+
    '<details><summary>典型应用</summary><ul>'+term.applications.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul></details>'+
    '<details><summary>'+esc(historyRecord?.label||'沿革未评估')+'</summary><p>'+esc(historyRecord?.basis||'尚未核实沿革标签，不据此判断技术是否过时。')+'</p>'+sourceLinks(historyRecord?.evidence)+'</details>'+
    '<details><summary>来源与继续阅读</summary>'+sourceLinks(term.references.map(r=>({...r,locator:r.use})))+'</details>');
}
function readRelation(id) {
  const relation=graphData.links.find(l=>l.id===id||l.recordId===id);
  if(!relation)return;
  const title=id=>id.startsWith('stage:')?stageById(id.slice(6)).title:termName(id);
  openReader('<span class="eyebrow">'+({concept:'概念关系',flow:'工程输入输出',usage:'工程用途'}[relation.kind])+'</span><h2>'+esc(relation.label)+'</h2><div class="relationship-note"><p><strong>'+esc(title(relation.from))+'</strong><br>'+esc(relation.label)+'<br><strong>'+esc(title(relation.to))+'</strong></p><p>'+esc(relation.explanation||relation.label)+'</p></div><section><h3>关系依据</h3>'+sourceLinks(relation.evidence)+'</section>','关系说明');
}
function renderConcept() {
  const term=termMap.get(route.id),relations=neighborhood(route.id,annotations.relations);
  const sections=Object.entries(groups).map(([group,title],order)=>{
    const entries=relations.filter(r=>r.group===group);
    if(!entries.length)return '';
    return '<section class="relation-group group-'+group+'" aria-label="'+title+'" style="--delay:'+((order+1)*45)+'ms"><h2>'+title+'<span>'+entries.length+'</span></h2><div class="group-cards">'+entries.map((r,index)=>{
      const neighbor=termMap.get(r.neighborId);
      return '<article class="term-card glass" data-neighbor="'+esc(neighbor.id)+'" data-edge-id="'+esc(r.id)+'" '+(index>=3?'hidden data-extra="'+group+'"':'')+'><button class="card-trigger" data-action="read" data-id="'+esc(neighbor.id)+'" aria-label="阅读'+esc(neighbor.name.zh)+'"><span class="card-type">'+esc(neighbor.type)+'</span><h3>'+esc(neighbor.name.zh)+(neighbor.name.abbreviation?'<small>'+esc(neighbor.name.abbreviation)+'</small>':'')+'</h3><p>'+esc(neighbor.role)+'</p></button><button class="relation-button" data-action="relation" data-id="'+esc(r.id)+'" aria-label="查看关系：'+esc(termName(r.from)+' '+r.label+' '+termName(r.to))+'">'+esc(r.label)+'<span>↗</span></button></article>';
    }).join('')+'</div>'+(entries.length>3?'<button class="more-button" data-action="expand" data-group="'+group+'" aria-expanded="false">展开其余 '+(entries.length-3)+' 项</button>':'')+'</section>';
  }).join('');
  const general=relations.filter(r=>r.group==='related');
  $('#concept-layer').innerHTML='<div class="concept-layout"><svg id="concept-lines" aria-hidden="true"></svg><article class="center-card glass" data-center-term="'+esc(term.id)+'"><div class="center-tools"><span class="eyebrow">概念关系</span><button class="close-button" data-action="close-concept" aria-label="关闭局部关系">×</button></div>'+(term.name.abbreviation?'<span class="center-acronym">'+esc(term.name.abbreviation)+'</span>':'')+'<button class="center-reader" data-action="read" data-id="'+esc(term.id)+'" aria-label="阅读'+esc(term.name.zh)+'"><h1>'+esc(term.name.zh)+'</h1><p>'+esc(term.definition)+'</p><span class="read-more">阅读词条 <span>↗</span></span></button></article>'+sections+
    (!relations.length?'<p class="empty-relations glass">尚未收录明确的直接关系，可先阅读该词条。</p>':'')+
    (general.length?'<details class="general-relations glass"><summary>其他相关说明 · '+general.length+'</summary>'+general.map(r=>'<button class="term-chip" data-action="relation" data-id="'+esc(r.id)+'">'+esc(termName(r.neighborId))+'</button>').join('')+'</details>':'')+'</div>';
  $('#concept-layer').hidden=false;
  requestAnimationFrame(drawConceptLines);
}
function drawConceptLines() {
  const svg=$('#concept-lines'),layout=$('.concept-layout'),center=$('[data-center-term]');
  if(!svg||!center||$('#concept-layer').hidden)return;
  const origin=layout.getBoundingClientRect(),c=center.getBoundingClientRect();
  svg.setAttribute('viewBox','0 0 '+origin.width+' '+Math.max(layout.scrollHeight,origin.height));
  svg.innerHTML=[...layout.querySelectorAll('.term-card:not([hidden])')].map(card=>{
    const r=card.getBoundingClientRect();
    return '<line x1="'+(c.x+c.width/2-origin.x)+'" y1="'+(c.y+c.height/2-origin.y)+'" x2="'+(r.x+r.width/2-origin.x)+'" y2="'+(r.y+r.height/2-origin.y)+'"/>';
  }).join('');
}
function renderStage(id) {
  const stage=stageById(id);
  const usages=framework.usages.filter(u=>u.stage_id===id);
  $('#stage-panel').innerHTML='<div class="panel-header"><span class="eyebrow">工程导航</span><button class="close-button" data-action="close-stage" aria-label="关闭工程说明">×</button></div><h2>'+esc(stage.title)+'</h2><p>'+esc(stage.summary)+'</p><div class="io-grid"><div><h3>输入</h3>'+stage.inputs.map(x=>'<p>'+esc(x)+'</p>').join('')+'</div><div><h3>输出</h3>'+stage.outputs.map(x=>'<p>'+esc(x)+'</p>').join('')+'</div></div>'+(usages.length?'<h3>可用于此处的术语</h3><div class="term-chips">'+chips(usages.map(u=>u.term_id))+'</div>':'')+'<details><summary>环节与连接依据</summary>'+sourceLinks(stage.evidence)+usages.map(u=>'<button class="location-link" data-action="relation" data-id="usage:'+esc(u.id)+'">'+esc(termName(u.term_id))+' · '+esc(u.label)+'<small>用途与依据</small></button>').join('')+framework.flows.filter(f=>f.from===id||f.to===id).map(f=>'<button class="location-link" data-action="relation" data-id="flow:'+esc(f.id)+'">'+esc(f.label)+'</button>').join('')+'</details>';
  $('#stage-panel').hidden=false;
}
function renderSearch() {
  const query=$('#term-search').value.trim();
  const matches=searchTerms(glossary.terms,query);
  const stages=framework.stages.filter(s=>!query||(s.title+s.short).toLowerCase().includes(query.toLowerCase()));
  searchRows=[...stages.map(s=>({kind:'stage',id:s.id,title:s.title,subtitle:'工程环节'})),...matches.map(t=>({kind:'term',id:t.id,title:t.name.zh,subtitle:[t.name.abbreviation,t.name.en].filter(Boolean).join(' · ')}))];
  searchIndex=Math.min(searchIndex,Math.max(0,searchRows.length-1));
  $('#search-results').innerHTML=searchRows.length?searchRows.map((r,index)=>'<button id="result-'+index+'" role="option" aria-selected="'+(index===searchIndex)+'" data-action="focus" data-kind="'+r.kind+'" data-id="'+esc(r.id)+'"><strong>'+esc(r.title)+'</strong><small>'+esc(r.subtitle)+'</small></button>').join(''):'<p class="empty-search">没有找到对应术语或工程环节。</p>';
  if(searchRows.length)$('#term-search').setAttribute('aria-activedescendant','result-'+searchIndex);
  else $('#term-search').removeAttribute('aria-activedescendant');
}
function openSearch() {
  if(!ready)return;
  closeSettings();$('#search-panel').hidden=false;$('#search-button').setAttribute('aria-expanded','true');
  $('#term-search').value='';searchIndex=0;renderSearch();$('#term-search').focus();
}
$('#search-button').addEventListener('click',()=>$('#search-panel').hidden?openSearch():closeSearch());
$('#labels-button').addEventListener('click',()=>{
  showLabels=!showLabels;$('#labels-button').setAttribute('aria-pressed',String(showLabels));scene?.update({showLabels});
  announce(showLabels?'已显示全部节点名称':'仅显示聚焦、悬停及悬停邻居的节点名称');
});
$('#overview-button').addEventListener('click',()=>{if(ready){navigate({kind:'overview',id:null});scene?.overview();}});
$('#back-button').addEventListener('click',()=>{if(trail.length)history.back();});
$('#settings-button').addEventListener('click',()=>{
  const opening=$('#settings-panel').hidden;closeSearch();$('#settings-panel').hidden=!opening;$('#settings-button').setAttribute('aria-expanded',String(opening));
});
$('#glow').addEventListener('input',event=>{$('#glow-value').textContent=event.target.value;scene?.setGlow(Number(event.target.value));});
$('#term-search').addEventListener('input',()=>{searchIndex=0;renderSearch();});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||!ready)return;
  const {action,id,kind,group}=button.dataset;
  if(action==='focus')navigate({kind,id});
  if(action==='read')readTerm(id);
  if(action==='relation')readRelation(id);
  if(action==='close-reader')closeReader();
  if(action==='close-concept')closeConcept();
  if(action==='close-stage'){$('#stage-panel').hidden=true;if(!graphAvailable)$('#fallback-panel').hidden=false;}
  if(action==='close-search'){closeSearch();$('#search-button').focus();}
  if(action==='close-settings'){closeSettings();$('#settings-button').focus();}
  if(action==='expand') {
    const expanded=button.getAttribute('aria-expanded')==='true';
    document.querySelectorAll('[data-extra="'+group+'"]').forEach(card=>card.hidden=expanded);
    button.setAttribute('aria-expanded',String(!expanded));button.textContent=expanded?'展开其余项目':'收起其余项目';drawConceptLines();
  }
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape') {
    event.preventDefault();
    if(!$('#search-panel').hidden){closeSearch();$('#search-button').focus();}
    else if(!$('#settings-panel').hidden){closeSettings();$('#settings-button').focus();}
    else if(!$('#reader-panel').hidden)closeReader();
    else if(!$('#concept-layer').hidden)closeConcept();
    else if(!$('#stage-panel').hidden){$('#stage-panel').hidden=true;if(!graphAvailable)$('#fallback-panel').hidden=false;}
    return;
  }
  if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();openSearch();}
  if(event.target===$('#term-search')) {
    if(['ArrowDown','ArrowUp'].includes(event.key)) {
      event.preventDefault();searchIndex=(searchIndex+(event.key==='ArrowDown'?1:-1)+Math.max(searchRows.length,1))%Math.max(searchRows.length,1);renderSearch();
      $('#result-'+searchIndex)?.scrollIntoView({block:'nearest'});
    }
    if(event.key==='Enter'&&searchRows[searchIndex]){event.preventDefault();const result=searchRows[searchIndex];navigate({kind:result.kind,id:result.id});}
  }
});
function restoreNavigation() {
  if(!ready)return;
  trail=history.state?.dexatlas?history.state.trail||[]:[];
  navigate(parseSceneHash(location.hash,glossary.terms,framework.stages),{push:false});
}
window.addEventListener('popstate',restoreNavigation);
window.addEventListener('hashchange',()=>{if(ready&&sceneHash(parseSceneHash(location.hash,glossary.terms,framework.stages))!==sceneHash(route))restoreNavigation();});
window.addEventListener('resize',()=>requestAnimationFrame(drawConceptLines));
$('#concept-layer').addEventListener('scroll',()=>requestAnimationFrame(drawConceptLines),true);
$('.skip-link').addEventListener('click',event=>{event.preventDefault();openSearch();});
$('#retry-button').addEventListener('click',load);
async function load() {
  ready=false;$('#load-state').hidden=false;$('#retry-button').hidden=true;
  $('#load-state p').textContent='正在连接图谱';$('#load-state').classList.remove('load-error');
  try {
    [glossary,annotations,framework]=await Promise.all(['glossary.json','annotations.json','framework.json'].map(readJSON));
    termMap=new Map(glossary.terms.map(t=>[t.id,t]));sourceMap=new Map([...glossary.sources,...annotations.sources,...framework.sources].map(s=>[s.id,s]));
    graphData=buildGraph(glossary,annotations,framework);
    scene?.dispose();scene=null;graphAvailable=false;$('#graph').replaceChildren();
    if(supportsWebGL()) {
      try {
        scene=createGraphScene($('#graph'),graphData,{reducedMotion:()=>motion.matches,onDismissCards:dismissCards,onZoomExit:()=>{navigate({kind:'overview',id:null},{fly:false});announce('已退出聚焦，保留当前画面中心');},onSelect:node=>navigate({kind:node.kind,id:node.kind==='stage'?node.stageId:node.id}),onRelation:link=>readRelation(link.id),onHover:node=>{
          $('#hover-caption').hidden=!node;
          $('#hover-caption').textContent=node?node.title:'';
          if(node)$('#hover-caption').style.setProperty('--node-color',node.color);
        }});
        scene.setGlow(Number($('#glow').value));
        graphAvailable=true;
      }catch(error){console.warn('3D scene unavailable; readable fallback retained.',error);}
    }
    $('#graph').dataset.ready=String(graphAvailable);
    $('#color-legend').innerHTML='<div class="legend-row"><span style="--swatch:#E3BE7C"></span>工程环节与流程</div>'+glossary.categories.map(c=>'<div class="legend-row"><span style="--swatch:'+CATEGORY_COLORS[c.id]+'"></span>'+esc(c.name)+'</div>').join('');
    $('#about-sources').innerHTML=sourceLinks(framework.sources.map(s=>({source_id:s.id,locator:s.kind})));
    $('#fallback-panel').innerHTML='<h1>探索术语</h1><p>当前浏览器未能显示三维画布，仍可搜索、阅读和查看关系来源。</p><div class="fallback-list">'+glossary.terms.map(t=>'<button data-action="focus" data-kind="term" data-id="'+esc(t.id)+'">'+esc(t.name.zh)+'<small>'+esc(t.name.abbreviation||t.type)+'</small></button>').join('')+'</div>';
    $('#fallback-panel').hidden=graphAvailable;
    $('#load-state').hidden=true;ready=true;
    trail=history.state?.dexatlas?history.state.trail||[]:[];
    if(!history.state?.dexatlas)history.replaceState({dexatlas:true,trail:[]},'',location.href);
    navigate(parseSceneHash(location.hash,glossary.terms,framework.stages),{push:false,fly:!!location.hash});
    announce('已载入 '+glossary.terms.length+' 个术语和 '+framework.stages.length+' 个工程环节');
  }catch(error) {
    $('#load-state').classList.add('load-error');
    $('#load-state p').textContent='图谱数据暂时未能载入，请重试。';
    $('#retry-button').hidden=false;
    announce(error.message);
  }
}
load();
