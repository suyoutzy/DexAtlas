import ForceGraph3D from '3d-force-graph';
import SpriteText from 'three-spritetext';
import {Color,Vector3,Group,Line,BufferGeometry,Float32BufferAttribute,LineBasicMaterial} from 'three';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {nodeTextVisible,deriveHighlights} from './atlas-model.mjs';
import {overviewFrame,shouldExitFocus,configureOrbitNavigation} from './graph-view.mjs';
import {applyEngineeringLayout,createEngineeringMotion} from './layout.mjs';
import {createEngineeringLabels} from './stage-labels.mjs';
import {placeScreenLabel} from './label-layout.mjs';

export function supportsWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export function createGraphScene(container,data,{onSelect,onRelation,onHover,onZoomExit,reducedMotion}) {
  let state={focused:null,hovered:null,hoveredLink:null,showLabels:false};
  let animationFrame,flightFrame,navigationFrame;
  let manual=false,flight=false,previousDistance=0;
  let pointerInside=false,pendingHoverExit=false,forwardingPointer=false,lastPointer;
  const nodeLabels=new Map(),nodes=new Map(data.nodes.map(n=>[n.id,n]));
  let highlightedNodes=new Set(),highlightedLinks=new Set();
  applyEngineeringLayout(data);
  const engineeringMotion=createEngineeringMotion();
  const makeText=(text,color)=>{
    const sprite=new SpriteText(text,1,color);
    sprite.fontFace=getComputedStyle(container).getPropertyValue('--graph-font').trim();
    sprite.fontWeight='500';
    sprite.fontSize=128;sprite.strokeWidth=.35;sprite.strokeColor='#0A0B19';
    sprite.material.depthWrite=false;sprite.material.depthTest=false;sprite.material.toneMapped=false;sprite.renderOrder=5;
    return {sprite,base:sprite.scale.clone()};
  };
  const graph=new ForceGraph3D(container,{controlType:'orbit'})
    .width(container.clientWidth).height(container.clientHeight)
    .backgroundColor('#0A0B19').showNavInfo(false)
    .nodeRelSize(3.3).nodeVal(n=>n.kind==='stage'?3.2:1)
    .nodeLabel(()=>null).linkLabel(()=>null)
    .nodeColor(n=>highlightedNodes.has(n.id)?'#'+new Color(n.color).offsetHSL(0,0,.16).getHexString():n.color)
    .nodeOpacity(.93).nodeResolution(16)
    .nodeThreeObjectExtend(true)
    .nodeThreeObject(node=>{
      if(node.kind==='stage')return null;
      const text=makeText(node.label,node.color);
      const leader=new Line(new BufferGeometry().setAttribute('position',new Float32BufferAttribute([0,0,0,0,0,0],3)),new LineBasicMaterial({color:'#889abc',transparent:true,opacity:.45,depthTest:false,depthWrite:false}));
      leader.visible=false;leader.frustumCulled=false;leader.renderOrder=4;leader.raycast=()=>{};
      nodeLabels.set(node.id,{...text,node,leader});
      text.sprite.visible=nodeTextVisible(node,state,data.links);
      return new Group().add(leader,text.sprite);
    })
    .linkColor(link=>highlightedLinks.has(link.id)?(link.kind==='flow'?'#ffe0a0':'#a2e1ed'):link.kind==='flow'?'rgba(227,190,124,.78)':link.kind==='usage'?'rgba(147,151,199,.2)':'rgba(118,132,180,.19)')
    .linkOpacity(.8)
    .linkWidth(link=>highlightedLinks.has(link.id)?1.1:link.kind==='flow'?.7:.12)
    .linkCurvature(0)
    .linkDirectionalArrowLength(0)
    .linkDirectionalParticles(link=>highlightedLinks.has(link.id)?3:0)
    .linkDirectionalParticleWidth(1.4).linkDirectionalParticleSpeed(.004)
    .linkDirectionalParticleColor(link=>link.kind==='flow'?'#ffe1a2':'#8bf1ee')
    .onNodeClick(node=>onSelect(node))
    .onNodeDrag(node=>engineeringMotion.drag(node))
    .onNodeDragEnd(node=>{
      engineeringMotion.release(node,performance.now(),reducedMotion());
      // 3d-force-graph 1.80 emits a synthetic touch release without a pointer ID.
      // Let Orbit process the real release before navigation is enabled again.
      graph.enableNavigationControls(false);
      cancelAnimationFrame(navigationFrame);
      navigationFrame=requestAnimationFrame(()=>graph.enableNavigationControls(true));
    })
    .onLinkClick(link=>onRelation(link))
    .onNodeHover(node=>{
      state.hovered=node?.id||null;
      onHover(node);
      refresh();
      if(!node)finishHoverExit();
    })
    .onLinkHover(link=>{state.hoveredLink=link?.id||null;refresh();if(!link)finishHoverExit();})
    .onEngineTick(()=>engineeringMotion.tick(performance.now(),reducedMotion()))
    .onEngineStop(()=>engineeringMotion.tick(performance.now(),true))
    .cooldownTime(8000).d3VelocityDecay(.36)
    .graphData(data);
  graph.d3Force('center',null);
  graph.d3Force('charge').strength(node=>node.kind==='stage'?-25:-75);
  graph.d3Force('link').distance(link=>link.kind==='usage'?90:68).strength(link=>link.kind==='usage'?.12:.06);
  graph.d3Force('engineering-context',alpha=>{
    for(const node of data.nodes)if(node.kind==='term')for(const axis of ['x','y','z'])node['v'+axis]+=(node.layoutTarget[axis]-node[axis])*.035*alpha;
  });
  graph.renderer().setPixelRatio(Math.min(devicePixelRatio,2));
  // A scene background forces a clear in the render target's color space.
  // Renderer-only clearColor is otherwise reused from the previous screen pass.
  graph.scene().background=new Color('#0A0B19');
  const controls=graph.controls();
  controls.enableDamping=true; controls.dampingFactor=.1;
  configureOrbitNavigation(controls,state.focused);
  const initial=framing();
  graph.cameraPosition(initial.position,initial.center,0);
  previousDistance=graph.camera().position.distanceTo(controls.target);
  const bloom=new UnrealBloomPass();
  bloom.enabled=false; bloom.strength=0; bloom.radius=.18; bloom.threshold=.18;
  // Convert linear output exactly once whether Bloom is enabled or disabled.
  const output=new OutputPass();
  const composer=graph.postProcessingComposer();
  for(const target of [composer.renderTarget1,composer.renderTarget2])target.samples=Math.min(4,graph.renderer().capabilities.maxSamples);
  composer.addPass(bloom);
  composer.addPass(output);
  setGlow(50);
  const stageLabels=createEngineeringLabels(container,data.nodes,node=>graph.graph2ScreenCoords(node.x,node.y,node.z),()=>graph.camera());

  function refresh() {
    configureOrbitNavigation(controls,state.focused);
    const highlights=deriveHighlights(data.links,state);
    highlightedNodes=highlights.nodes;highlightedLinks=highlights.links;
    graph.nodeColor(graph.nodeColor()).linkColor(graph.linkColor()).linkWidth(graph.linkWidth()).linkDirectionalParticles(graph.linkDirectionalParticles());
    for(const {sprite,node} of nodeLabels.values()) sprite.visible=nodeTextVisible(node,state,data.links);
    container.dataset.focused=state.focused||'';
  }
  // Let the library observe an empty intersection so both of its hover caches
  // reset, including when the pointer immediately returns to the same node.
  function forwardPointer(x,y) {
    forwardingPointer=true;
    graph.renderer().domElement.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x,clientY:y}));
    forwardingPointer=false;
  }
  function finishHoverExit() {
    if(!pendingHoverExit)return;
    pendingHoverExit=false;
    if(pointerInside&&lastPointer)requestAnimationFrame(()=>{if(pointerInside)forwardPointer(lastPointer.x,lastPointer.y);});
  }
  function movePointer(event) {
    if(forwardingPointer)return;
    lastPointer={x:event.clientX,y:event.clientY};
    if(pendingHoverExit)forwardPointer(-10000,-10000);
  }
  function leaveCanvas() {
    pointerInside=false;
    pendingHoverExit=!!(state.hovered||state.hoveredLink);
    state.hovered=null;state.hoveredLink=null;
    onHover(null);refresh();
    forwardPointer(-10000,-10000);
  }
  function enterCanvas() {pointerInside=true;}
  container.addEventListener('pointerleave',leaveCanvas);
  container.addEventListener('pointerenter',enterCanvas);
  container.addEventListener('pointermove',movePointer);
  // C2 text stays readable in screen pixels as the Orbit camera moves.
  function scaleText() {
    const camera=graph.camera(),height=Math.max(container.clientHeight,1),width=container.clientWidth;
    const factor=2*Math.tan(camera.fov*Math.PI/360)/height;
    const textPixels=18*parseFloat(getComputedStyle(container).fontSize)/16;
    const occupied=stageLabels.update(state);
    const priority=node=>node.id===state.hovered?0:node.id===state.focused?1:2;
    for(const {sprite,base,node,leader} of [...nodeLabels.values()].sort((a,b)=>priority(a.node)-priority(b.node))) {
      const position=new Vector3(node.x||0,node.y||0,node.z||0),projected=position.clone().project(camera);
      const point=graph.graph2ScreenCoords(position.x,position.y,position.z);
      sprite.visible=nodeTextVisible(node,state,data.links)&&projected.z>=-1&&projected.z<=1&&point.x>=0&&point.x<=width&&point.y>=0&&point.y<=height;
      leader.visible=false;if(!sprite.visible)continue;
      const depth=-position.clone().applyMatrix4(camera.matrixWorldInverse).z;
      const size=depth*factor*textPixels;
      sprite.scale.copy(base).multiplyScalar(size);
      const box=placeScreenLabel(point,base.x*textPixels,base.y*textPixels,occupied,{width,height});
      if(!box){sprite.visible=false;continue;}occupied.push(box);
      const centerX=box.left+box.width/2,centerY=box.top+box.height/2;
      sprite.position.copy(new Vector3(centerX/width*2-1,1-centerY/height*2,projected.z).unproject(camera).sub(position));
      const endX=Math.max(box.left,Math.min(point.x,box.left+box.width)),endY=point.y<box.top?box.top:box.top+box.height;
      const endpoint=new Vector3(endX/width*2-1,1-endY/height*2,projected.z).unproject(camera).sub(position);
      leader.geometry.attributes.position.setXYZ(1,endpoint.x,endpoint.y,endpoint.z);leader.geometry.attributes.position.needsUpdate=true;
      leader.visible=Math.abs(centerX-point.x)>8||Math.abs(box.top-(point.y-box.height-17))>8;
    }
    animationFrame=requestAnimationFrame(scaleText);
  }
  animationFrame=requestAnimationFrame(scaleText);
  function framing() {
    const camera=graph.camera();
    return overviewFrame(data.nodes,{position:camera.position,target:controls.target,up:camera.up,fov:camera.fov,aspect:camera.aspect});
  }
  function stopFlight() {cancelAnimationFrame(flightFrame);flight=false;}
  function focus(id) {
    stopFlight();
    const node=nodes.get(id);
    if(!node)return;
    const camera=graph.camera(),target=controls.target.clone(),start=camera.position.clone();
    const endTarget=new Vector3(node.x||0,node.y||0,node.z||0);
    const direction=start.clone().sub(endTarget).normalize();
    if(!direction.length())direction.set(0,0,1);
    const started=performance.now(),duration=reducedMotion()?0:600;
    flight=true;
    function step(now) {
      const t=duration?Math.min(1,(now-started)/duration):1;
      const ease=1-Math.pow(1-t,3);
      endTarget.set(node.x||0,node.y||0,node.z||0);
      const end=endTarget.clone().addScaledVector(direction,innerWidth<700?210:150);
      graph.cameraPosition(start.clone().lerp(end,ease),target.clone().lerp(endTarget,ease),0);
      if(t<1)flightFrame=requestAnimationFrame(step);else flight=false;
    }
    step(started);
  }
  function startNavigation(){stopFlight();manual=true;previousDistance=graph.camera().position.distanceTo(controls.target);}
  function endNavigation(){manual=false;}
  function cameraChanged(){
    const current=graph.camera().position.distanceTo(controls.target);
    const exit=shouldExitFocus({manual,flight,focusedKind:nodes.get(state.focused)?.kind,previous:previousDistance,current,overviewDistance:framing().distance});
    previousDistance=current;
    if(exit){manual=false;onZoomExit();}
  }
  function overview(){
    stopFlight();
    const frame=framing(),target=controls.target.clone(),start=graph.camera().position.clone();
    const endTarget=new Vector3(frame.center.x,frame.center.y,frame.center.z),end=new Vector3(frame.position.x,frame.position.y,frame.position.z);
    const started=performance.now(),duration=reducedMotion()?0:600;flight=true;
    function step(now){
      const t=duration?Math.min(1,(now-started)/duration):1,ease=1-Math.pow(1-t,3);
      graph.cameraPosition(start.clone().lerp(end,ease),target.clone().lerp(endTarget,ease),0);
      if(t<1)flightFrame=requestAnimationFrame(step);else flight=false;
    }
    step(started);
  }
  controls.addEventListener('start',startNavigation);
  controls.addEventListener('end',endNavigation);
  controls.addEventListener('change',cameraChanged);
  const resize=new ResizeObserver(()=>graph.width(container.clientWidth).height(container.clientHeight));
  resize.observe(container);
  function setGlow(value){bloom.strength=1.2*Math.pow(value/100,1.8);bloom.enabled=value>0;}
  return {
    update(next){state={...state,...next};refresh();},
    focus,
    overview,setGlow,
    dispose(){stopFlight();cancelAnimationFrame(animationFrame);cancelAnimationFrame(navigationFrame);resize.disconnect();stageLabels.dispose();controls.removeEventListener('start',startNavigation);controls.removeEventListener('end',endNavigation);controls.removeEventListener('change',cameraChanged);container.removeEventListener('pointerleave',leaveCanvas);container.removeEventListener('pointerenter',enterCanvas);container.removeEventListener('pointermove',movePointer);bloom.dispose();output.dispose();graph._destructor();}
  };
}
