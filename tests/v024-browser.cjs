const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {startDiagnosticServer}=require('./diagnostic-server.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function stats(page){return page.evaluate(()=>{const g=window.__dexGraph,c=g.postProcessingComposer(),b=c.passes.filter(p=>p.renderTargetBright);let labels=0,hidden=0,hiddenBytes=0;g.scene().traverse(o=>{if(o.isSprite){labels++;if(!o.visible){hidden++;hiddenBytes+=o.material.map.image.width*o.material.map.image.height*4;}}});return {canvas:[g.renderer().domElement.width,g.renderer().domElement.height],composer:[c.renderTarget1.width,c.renderTarget1.height],samples:c.renderTarget1.samples,bloom:b.length,bloomSize:b[0]?[b[0].renderTargetBright.width,b[0].renderTargetBright.height]:null,textures:g.renderer().info.memory.textures,geometries:g.renderer().info.memory.geometries,frame:g.renderer().info.render.frame,labels,hidden,hiddenBytes};});}
(async()=>{
 const server=await startDiagnosticServer(),browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(server.url);await page.locator('#graph[data-ready=true]').waitFor();
  assert.equal(await page.locator('#quality').count(),1,'settings expose balanced/high quality');
  await page.mouse.move(5,5);let s=await stats(page);
  assert.deepEqual(s.canvas,[1920,1080]);assert.deepEqual(s.composer,s.canvas);assert.equal(s.samples,0);assert.equal(s.labels,0,'initial hidden names allocate no sprites');assert.equal(s.bloom,1);assert.deepEqual(s.bloomSize,[480,270]);
  await page.locator('#settings-button').click();assert.equal(await page.locator('#quality').inputValue(),'balanced');
  for(let i=0;i<20;i++){
   await page.locator('#glow').fill('0');await page.locator('#glow').dispatchEvent('input');await sleep(35);assert.equal((await stats(page)).bloom,0);
   await page.locator('#quality').selectOption(i%2?'balanced':'high');assert.equal((await stats(page)).bloom,0,'quality changes while off do not allocate Bloom');
   await page.locator('#glow').fill('50');await page.locator('#glow').dispatchEvent('input');await sleep(35);assert.equal((await stats(page)).bloom,1);
  }
  await page.locator('#quality').selectOption('balanced');await page.keyboard.press('Escape');await page.mouse.move(5,5);await page.waitForTimeout(8500);
  const before=await stats(page);await page.waitForTimeout(350);const after=await stats(page);assert.equal(after.frame,before.frame,'global idle stops drawing');
  assert.equal(after.labels,0);assert.ok(after.textures<=13);assert.ok(after.geometries<=before.geometries+1);
  await page.mouse.move(5,150);await page.waitForTimeout(250);const zoomBefore=await page.evaluate(()=>window.__dexGraph.cameraPosition());
  await page.mouse.wheel(0,-80);await page.waitForTimeout(150);assert.notDeepEqual(await page.evaluate(()=>window.__dexGraph.cameraPosition()),zoomBefore,'first wheel after idle zooms');
  await page.locator('#graph[data-render-state=idle]').waitFor();
  const panBefore=await page.evaluate(()=>window.__dexGraph.cameraPosition());await page.mouse.move(5,150);await page.mouse.down({button:'middle'});await page.mouse.move(65,185,{steps:5});await page.mouse.up({button:'middle'});
  await page.waitForTimeout(250);assert.notDeepEqual(await page.evaluate(()=>window.__dexGraph.cameraPosition()),panBefore,'first middle drag after idle pans');await page.locator('#graph[data-render-state=idle]').waitFor();
  const goal=await page.locator('line[data-node-id="stage:goal"]').evaluate(e=>({x:+e.getAttribute('x1'),y:+e.getAttribute('y1')}));
  await page.mouse.click(goal.x,goal.y);await page.waitForTimeout(200);assert.equal(await page.locator('#stage-panel').isVisible(),true,'first click after idle selects a node');
  let frame=(await stats(page)).frame;await page.waitForTimeout(150);assert.ok((await stats(page)).frame>frame,'focused particles continue');
  const camera=await page.evaluate(()=>window.__dexGraph.cameraPosition());
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  frame=(await stats(page)).frame;await page.waitForTimeout(150);assert.equal((await stats(page)).frame,frame,'background state pauses drawing');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(120);
  assert.ok((await stats(page)).frame>frame);assert.deepEqual(await page.evaluate(()=>window.__dexGraph.cameraPosition()),camera,'restoring visibility preserves the camera');
  const hash=new URL(page.url()).hash;
  await page.locator('#settings-button').click();await page.locator('#quality').selectOption('high');await page.waitForTimeout(100);s=await stats(page);
  assert.ok(s.canvas[0]*s.canvas[1]<=3686400&&s.canvas[0]>1920);assert.equal(new URL(page.url()).hash,hash);assert.equal(await page.locator('#stage-panel').isVisible(),true);
  await page.keyboard.press('Escape');await page.locator('#labels-button').click();await page.waitForTimeout(150);assert.ok((await stats(page)).labels>0);
  await page.locator('#overview-button').click();await page.locator('#labels-button').click();
  await page.setViewportSize({width:3840,height:2160});await page.waitForTimeout(120);await page.locator('#settings-button').click();await page.locator('#quality').selectOption('balanced');await page.waitForTimeout(120);s=await stats(page);assert.ok(s.canvas[0]*s.canvas[1]<=2073600);assert.deepEqual(s.canvas,s.composer);
  await page.reload();await page.locator('#graph[data-ready=true]').waitFor();await page.locator('#settings-button').click();assert.equal(await page.locator('#quality').inputValue(),'balanced');assert.equal(await page.locator('#glow').inputValue(),'50');
  await page.keyboard.press('Escape');await page.setViewportSize({width:1440,height:900});await page.locator('#search-button').click();await page.getByRole('combobox').fill('PPO');await page.getByRole('combobox').press('Enter');await page.locator('#concept-layer').waitFor();
  await page.evaluate(()=>{window.__dexScene.dispose();});await page.evaluate(()=>window.__dexReload());await page.locator('#graph[data-ready=true]').waitFor();await page.waitForTimeout(150);assert.equal(await page.locator('#graph canvas').count(),1,'recreating a scene leaves one canvas');
  await mkdir('.work/screenshots',{recursive:true});await page.screenshot({path:'.work/screenshots/v024-balanced.png'});
  assert.deepEqual(errors,[]);console.log('PASS: budgets, lazy names, Bloom release/recreate, 20 switches, idle first click, particles, camera context, large viewport, defaults and scene recreation');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
