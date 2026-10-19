import ForceGraph3D from '3d-force-graph';
import {Color,Vector3,Group} from 'three';
import {deriveHighlights} from './atlas-model.mjs';
import {createRenderPipeline} from './render-pipeline.mjs';
import {createTermLabels} from './term-labels.mjs';
import {createFrameScheduler} from './frame-scheduler.mjs';
import {overviewFrame,shouldExitFocus,configureOrbitNavigation,clearOrbitInertia} from './graph-view.mjs';
import {createBackgroundGesture} from './background-gesture.mjs';
import {applyEngineeringLayout,createEngineeringMotion} from './layout.mjs';
import {createEngineeringLabels} from './stage-labels.mjs';

export function supportsWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

export function createGraphScene(container,data,{onSelect,onRelation,onHover,onZoomExit,onDismissCards,reducedMotion}) {
  let state={focused:null,hovered:null,hoveredLink:null,showLabels:false};
  let flightFrame,navigationFrame,hoverFrame,flightStep,scheduler,labelsDirty=true,engineRunning=true,pointerHeld=false,lastCameraChange=0,disposed=false;
  let manual=false,flight=false,previousDistance=0;
  let overviewReady=false;
  const backgroundGesture=createBackgroundGesture();
  let pointerInside=false,pendingHoverExit=false,forwardingPointer=false,lastPointer;
  const labelGroups=new Map(),nodes=new Map(data.nodes.map(n=>[n.id,n]));
  let highlightedNodes=new Set(),highlightedLinks=new Set();
  applyEngineeringLayout(data);
  const engineeringMotion=createEngineeringMotion();
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
      const group=new Group();labelGroups.set(node.id,group);return group;
    })
    .linkColor(link=>highlightedLinks.has(link.id)?(link.kind==='flow'?'#ffe0a0':'#a2e1ed'):link.kind==='flow'?'rgba(227,190,124,.78)':link.kind==='usage'?'rgba(147,151,199,.2)':'rgba(118,132,180,.19)')
    .linkOpacity(.8)
    .linkWidth(link=>highlightedLinks.has(link.id)?1.1:link.kind==='flow'?.7:.12)
    .linkCurvature(0)
    .linkDirectionalArrowLength(0)
    .linkDirectionalParticles(link=>highlightedLinks.has(link.id)?3:0)
    .linkDirectionalParticleWidth(1.4).linkDirectionalParticleSpeed(.004)
    .linkDirectionalParticleColor(link=>link.kind==='flow'?'#ffe1a2':'#8bf1ee')
    .onNodeClick(node=>{backgroundGesture.reset();onSelect(node);})
    .onNodeDrag(node=>{overviewReady=false;backgroundGesture.reset();engineeringMotion.drag(node);})
    .onNodeDragEnd(node=>{
      engineeringMotion.release(node,performance.now(),reducedMotion());
      // 3d-force-graph 1.80 emits a synthetic touch release without a pointer ID.
      // Let Orbit process the real release before navigation is enabled again.
      graph.enableNavigationControls(false);
      cancelAnimationFrame(navigationFrame);
      navigationFrame=requestAnimationFrame(()=>graph.enableNavigationControls(true));
    })
    .onLinkClick(link=>{backgroundGesture.reset();onRelation(link);})
    .onBackgroundClick(event=>{if(backgroundGesture.click(event))onDismissCards();})
    .onNodeHover(node=>{
      state.hovered=node?.id||null;
      onHover(node);
      refresh();
      if(!node)finishHoverExit();
    })
    .onLinkHover(link=>{state.hoveredLink=link?.id||null;refresh();if(!link)finishHoverExit();})
    .onEngineTick(()=>{engineRunning=true;engineeringMotion.tick(performance.now(),reducedMotion());wake();})
    .onEngineStop(()=>{engineRunning=false;engineeringMotion.tick(performance.now(),true);wake();})
    .cooldownTime(8000).d3VelocityDecay(.36)
    .graphData(data);
  graph.d3Force('center',null);
  graph.d3Force('charge').strength(node=>node.kind==='stage'?-25:-75);
  graph.d3Force('link').distance(link=>link.kind==='usage'?90:68).strength(link=>link.kind==='usage'?.12:.06);
  graph.d3Force('engineering-context',alpha=>{
    for(const node of data.nodes)if(node.kind==='term')for(const axis of ['x','y','z'])node['v'+axis]+=(node.layoutTarget[axis]-node[axis])*.035*alpha;
  });
  // A scene background forces a clear in the render target's color space.
  // Renderer-only clearColor is otherwise reused from the previous screen pass.
  graph.scene().background=new Color('#0A0B19');
  const controls=graph.controls();
  const canvas=graph.renderer().domElement;
  // Orbit is connected first. Consume its middle press before the graph's
  // later node-drag listeners, so a pan can also start directly over a node.
  function middlePan(event){
    if(event.button!==1)return;
    event.preventDefault();event.stopImmediatePropagation();
    // Keep the render wrapper's down/move/up tracker consistent while skipping
    // canvas-only node dragging. Otherwise its stale drag flag eats the next click.
    canvas.parentElement.dispatchEvent(new PointerEvent('pointerdown',event));
  }
  function preventMiddleAux(event){if(event.button===1)event.preventDefault();}
  // The graph also emits this incomplete release after an unmoved node click.
  // Orbit must receive the actual pointer release instead of a touch with no ID.
  function ignoreIncompleteRelease(event){if(!event.isTrusted&&event.pointerType==='touch'&&event.pointerId===0)event.stopImmediatePropagation();}
  canvas.addEventListener('pointerdown',middlePan);
  canvas.addEventListener('auxclick',preventMiddleAux);
  canvas.ownerDocument.addEventListener('pointerup',ignoreIncompleteRelease,true);
  controls.enableDamping=true; controls.dampingFactor=.1;
  configureOrbitNavigation(controls,state.focused);
  const initial=framing();
  graph.cameraPosition(initial.position,initial.center,0);
  previousDistance=graph.camera().position.distanceTo(controls.target);
  const pipeline=createRenderPipeline(graph,container);
  const stageLabels=createEngineeringLabels(container,data.nodes,node=>graph.graph2ScreenCoords(node.x,node.y,node.z),()=>graph.camera(),()=>wake());
  const termLabels=createTermLabels(container,data,labelGroups,node=>graph.graph2ScreenCoords(node.x,node.y,node.z),()=>graph.camera());
  function wake(dirty=true){if(disposed)return;if(dirty)labelsDirty=true;scheduler?.invalidate();}

  function refresh() {
    configureOrbitNavigation(controls,state.focused);
    const highlights=deriveHighlights(data.links,state);
    highlightedNodes=highlights.nodes;highlightedLinks=highlights.links;
    graph.nodeColor(graph.nodeColor()).linkColor(graph.linkColor()).linkWidth(graph.linkWidth()).linkDirectionalParticles(graph.linkDirectionalParticles());
    wake();
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
    if(pointerInside&&lastPointer)hoverFrame=requestAnimationFrame(()=>{if(!disposed&&pointerInside)forwardPointer(lastPointer.x,lastPointer.y);});
  }
  function movePointer(event) {
    if(forwardingPointer)return;
    wake(false);
    if(event.buttons)backgroundGesture.reset();
    lastPointer={x:event.clientX,y:event.clientY};
    if(pendingHoverExit)forwardPointer(-10000,-10000);
  }
  function leaveCanvas() {
    backgroundGesture.reset();
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
  function updateLabels(){if(!labelsDirty)return;labelsDirty=false;termLabels.update(state,stageLabels.update(state));}
  function framing(frontView=false) {
    const camera=graph.camera();
    return overviewFrame(data.nodes,{position:camera.position,target:controls.target,up:camera.up,fov:camera.fov,aspect:camera.aspect,frontView});
  }
  function stopFlight() {cancelAnimationFrame(flightFrame);flight=false;flightStep=null;}
  function focus(id) {
    stopFlight();manual=false;overviewReady=false;clearOrbitInertia(controls);
    const node=nodes.get(id);
    if(!node)return;
    const camera=graph.camera(),target=controls.target.clone(),start=camera.position.clone();
    const endTarget=new Vector3(node.x||0,node.y||0,node.z||0);
    const direction=start.clone().sub(endTarget).normalize();
    if(!direction.length())direction.set(0,0,1);
    const started=performance.now(),duration=reducedMotion()?0:600;
    flight=true;wake();
    function step(now) {
      const t=duration?Math.min(1,(now-started)/duration):1;
      const ease=1-Math.pow(1-t,3);
      endTarget.set(node.x||0,node.y||0,node.z||0);
      const end=endTarget.clone().addScaledVector(direction,innerWidth<700?210:150);
      graph.cameraPosition(start.clone().lerp(end,ease),target.clone().lerp(endTarget,ease),0);wake();
      if(t<1)flightFrame=requestAnimationFrame(step);else{flight=false;flightStep=null;}
    }
    flightStep=step;step(started);
  }
  function startNavigation(){stopFlight();manual=true;previousDistance=graph.camera().position.distanceTo(controls.target);}
  function endNavigation(){manual=false;}
  function cameraChanged(){
    lastCameraChange=performance.now();wake();
    if(manual&&!flight)overviewReady=false;
    const current=graph.camera().position.distanceTo(controls.target);
    const exit=shouldExitFocus({manual,flight,focusedKind:nodes.get(state.focused)?.kind,previous:previousDistance,current,overviewDistance:framing().distance});
    previousDistance=current;
    if(exit){manual=false;onZoomExit();}
  }
  function overview(){
    stopFlight();manual=false;clearOrbitInertia(controls);
    const frame=framing(overviewReady),target=controls.target.clone(),start=graph.camera().position.clone();overviewReady=true;
    const endTarget=new Vector3(frame.center.x,frame.center.y,frame.center.z),end=new Vector3(frame.position.x,frame.position.y,frame.position.z);
    const started=performance.now(),duration=reducedMotion()?0:600;flight=true;wake();
    function step(now){
      const t=duration?Math.min(1,(now-started)/duration):1,ease=1-Math.pow(1-t,3);
      graph.cameraPosition(start.clone().lerp(end,ease),target.clone().lerp(endTarget,ease),0);wake();
      if(t<1)flightFrame=requestAnimationFrame(step);else{flight=false;flightStep=null;}
    }
    flightStep=step;step(started);
  }
  controls.addEventListener('start',startNavigation);
  controls.addEventListener('end',endNavigation);
  controls.addEventListener('change',cameraChanged);
  function resizeScene(){overviewReady=false;graph.width(container.clientWidth).height(container.clientHeight);pipeline.resize();wake();}
  const resize=new ResizeObserver(resizeScene);resize.observe(container);
  let dprQuery;
  function watchDpr(){dprQuery?.removeEventListener('change',dprChanged);dprQuery=matchMedia('(resolution: '+devicePixelRatio+'dppx)');dprQuery.addEventListener('change',dprChanged);}
  function dprChanged(){resizeScene();watchDpr();}watchDpr();
  function input(event){if(event.type==='pointerdown')pointerHeld=true;wake(false);}
  function releasePointer(){pointerHeld=false;wake(false);}
  function visibilityChanged(){
    if(document.hidden){pointerHeld=false;cancelAnimationFrame(flightFrame);}
    scheduler.visibilityChanged();
    if(!document.hidden&&flight&&flightStep)flightFrame=requestAnimationFrame(flightStep);
  }
  function fontsChanged(){termLabels.invalidateFonts();wake();}
  const fontObserver=new MutationObserver(()=>wake());fontObserver.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']});
  document.fonts?.addEventListener('loadingdone',fontsChanged);
  const inputs=['pointerdown','pointermove','pointerenter','wheel','keydown'];
  for(const type of inputs)container.addEventListener(type,input,{capture:true,passive:true});
  for(const type of ['pointerup','pointercancel'])document.addEventListener(type,releasePointer,true);
  window.addEventListener('blur',releasePointer);document.addEventListener('visibilitychange',visibilityChanged);
  scheduler=createFrameScheduler({isHidden:()=>document.hidden,isBusy:()=>engineRunning||flight||pointerHeld||highlightedLinks.size>0||performance.now()-lastCameraChange<100,onFrame:updateLabels,pause(){graph.pauseAnimation();container.dataset.renderState=document.hidden?'hidden':'idle';},resume(){container.dataset.renderState='active';graph.resumeAnimation();}});
  scheduler.invalidate();

  return {
    update(next){if('focused' in next&&next.focused!==state.focused)overviewReady=false;state={...state,...next};refresh();},
    focus,
    overview,setGlow(value){pipeline.setGlow(value);wake(false);},setQuality(value){pipeline.setQuality(value);wake();},
    dispose(){
      if(disposed)return;disposed=true;
      stopFlight();scheduler.dispose();cancelAnimationFrame(navigationFrame);cancelAnimationFrame(hoverFrame);resize.disconnect();fontObserver.disconnect();
      dprQuery.removeEventListener('change',dprChanged);document.fonts?.removeEventListener('loadingdone',fontsChanged);
      for(const type of inputs)container.removeEventListener(type,input,true);
      for(const type of ['pointerup','pointercancel'])document.removeEventListener(type,releasePointer,true);
      window.removeEventListener('blur',releasePointer);document.removeEventListener('visibilitychange',visibilityChanged);
      stageLabels.dispose();termLabels.dispose();pipeline.dispose();
      controls.removeEventListener('start',startNavigation);controls.removeEventListener('end',endNavigation);controls.removeEventListener('change',cameraChanged);
      container.removeEventListener('pointerleave',leaveCanvas);container.removeEventListener('pointerenter',enterCanvas);container.removeEventListener('pointermove',movePointer);
      canvas.removeEventListener('pointerdown',middlePan);canvas.removeEventListener('auxclick',preventMiddleAux);canvas.ownerDocument.removeEventListener('pointerup',ignoreIncompleteRelease,true);
      labelGroups.clear();graph._destructor();
    }
  };
}
