import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {resolveRenderPolicy} from './render-policy.mjs';

export function createRenderPipeline(graph,container) {
 const renderer=graph.renderer(),composer=graph.postProcessingComposer(),output=new OutputPass();
 let bloom=null,quality='balanced',glow=0,policy,disposed=false;
 for(const target of [composer.renderTarget1,composer.renderTarget2])target.samples=0;
 composer.addPass(output);
 function resize(){
  if(disposed)return;
  policy=resolveRenderPolicy({quality,width:container.clientWidth,height:container.clientHeight,dpr:devicePixelRatio});
  renderer.setPixelRatio(policy.pixelRatio);renderer.setSize(container.clientWidth,container.clientHeight);
  composer.setPixelRatio(policy.pixelRatio);composer.setSize(container.clientWidth,container.clientHeight);
 }
 function setGlow(value){
  if(disposed)return;glow=Math.max(0,Math.min(100,value));
  if(!glow){
   if(bloom){
    composer.removePass(bloom);
    // Three.js 0.186.1 leaves this material out of UnrealBloomPass.dispose().
    bloom.materialHighPassFilter.dispose();bloom.dispose();bloom=null;
   }
   return;
  }
  if(!bloom){
   bloom=new UnrealBloomPass();bloom.radius=.18;bloom.threshold=.18;
   const pass=bloom,original=pass.setSize.bind(pass);
   pass.setSize=(width,height)=>original(Math.max(1,Math.round(width*policy.bloomScale)),Math.max(1,Math.round(height*policy.bloomScale)));
   composer.insertPass(pass,composer.passes.indexOf(output));
  }
  bloom.strength=1.2*Math.pow(glow/100,1.8);
 }
 resize();setGlow(50);
 return {resize,setGlow,setQuality(value){quality=value==='high'?'high':'balanced';resize();},dispose(){if(disposed)return;setGlow(0);composer.removePass(output);output.dispose();disposed=true;}};
}
