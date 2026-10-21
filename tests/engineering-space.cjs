const assert=require('node:assert/strict');
const {mkdir,readFile}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
async function anchor(page,id){return page.locator('#engineering-labels line[data-node-id="stage:'+id+'"]').evaluate(e=>({x:Number(e.getAttribute('x1')),y:Number(e.getAttribute('y1'))}));}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
async function goldAlongSegment(page,from,to){
 return page.evaluate(({from,to})=>new Promise(resolve=>requestAnimationFrame(()=>{
  const canvas=document.querySelector('#graph canvas'),gl=canvas.getContext('webgl2'),ratio=canvas.width/canvas.clientWidth;
  const hits=[.2,.4,.6,.8].map(t=>{
   const x=Math.round((from.x+(to.x-from.x)*t)*ratio),y=Math.round(canvas.height-(from.y+(to.y-from.y)*t)*ratio),pixels=new Uint8Array(7*7*4);
   gl.readPixels(x-3,y-3,7,7,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   for(let i=0;i<pixels.length;i+=4)if(pixels[i]>28&&pixels[i]>pixels[i+1]+2&&pixels[i+1]>pixels[i+2]+3)return true;
   return false;
  });resolve(hits);
 })),{from,to});
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const errors=[],geometry=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2,reducedMotion:'no-preference'});
  geometry.on('pageerror',e=>errors.push(e.message));
  // Isolate actual engineering data for geometry pixels: unrelated nodes can
  // occlude a sampled segment in a larger graph. Full graph drag follows below.
  for(const name of ['glossary','annotations','framework'])await geometry.route('**/data/'+name+'.json',async route=>{
   const data=JSON.parse(await readFile('data/'+name+'.json','utf8'));
   if(name==='glossary')data.terms=[];if(name==='annotations')data.relations=[];if(name==='framework')data.usages=[];
   await route.fulfill({json:data});
  });
  await geometry.goto(base);await geometry.locator('#graph[data-ready="true"]').waitFor();await geometry.waitForTimeout(150);
  for(const [a,b] of [['goal','method'],['system','deployment'],['evaluation','method']]){
   const hits=await goldAlongSegment(geometry,await anchor(geometry,a),await anchor(geometry,b));
   assert.ok(hits.every(Boolean),'engineering connection '+a+' → '+b+' follows a straight segment: '+hits);
  }
  await geometry.close();
  const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'no-preference'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('#graph[data-ready="true"]').waitFor();await page.waitForTimeout(150);
  const goal=await anchor(page,'goal'),complete=await anchor(page,'complete');
  assert.ok(Math.abs(goal.y-complete.y)<1,'goal and completion align in the initial view');
  const branches=await Promise.all(['design','demonstration','interaction'].map(id=>anchor(page,id)));
  assert.ok(Math.max(...branches.map(p=>p.x))-Math.min(...branches.map(p=>p.x))<1,'method entrances remain parallel in the default view');
  const start=await anchor(page,'method');
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+110,start.y-60,{steps:10});await page.waitForTimeout(70);
  const held=await anchor(page,'method');assert.ok(distance(start,held)>45,'stage follows the pointer while held');
  await mkdir('.work/screenshots',{recursive:true});await page.screenshot({path:'.work/screenshots/spatial-drag-held.png'});
  await page.mouse.up();await page.waitForTimeout(90);
  const midway=await anchor(page,'method');assert.ok(distance(start,midway)>1&&distance(start,midway)<distance(start,held),'release animates through a return position');
  await page.waitForTimeout(750);assert.ok(distance(start,await anchor(page,'method'))<1,'stage settles exactly at its original anchor');
  // Dragging outside the canvas ends the gesture and returns to the same anchor.
  const outside=await anchor(page,'system');await page.mouse.move(outside.x,outside.y);await page.mouse.down();await page.mouse.move(-15,outside.y-40,{steps:12});await page.mouse.up();await page.waitForTimeout(800);
  assert.ok(distance(outside,await anchor(page,'system'))<1,'leaving the canvas cannot strand an engineering node');
  // A suspended tab can outlive the engine cooldown while a return is pending.
  const suspended=await anchor(page,'method');await page.mouse.move(suspended.x,suspended.y);await page.mouse.down();await page.mouse.move(suspended.x+100,suspended.y+40,{steps:6});await page.mouse.up();
  const lifecycle=await page.context().newCDPSession(page);await lifecycle.send('Page.setWebLifecycleState',{state:'frozen'});
  await new Promise(resolve=>setTimeout(resolve,8300));await lifecycle.send('Page.setWebLifecycleState',{state:'active'});await page.waitForTimeout(150);
  assert.ok(distance(suspended,await anchor(page,'method'))<1,'return completes when resuming after the engine cooldown');
  await page.mouse.move(15,150);await page.screenshot({path:'.work/screenshots/spatial-overview.png'});
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await anchor(page,'method');await page.mouse.move(reduced.x,reduced.y);await page.mouse.down();await page.mouse.move(reduced.x+90,reduced.y+40,{steps:8});await page.waitForTimeout(60);
  assert.ok(distance(reduced,await anchor(page,'method'))>30,'reduced motion still permits direct dragging');await page.mouse.up();await page.waitForTimeout(80);
  assert.ok(distance(reduced,await anchor(page,'method'))<1,'reduced motion returns without an animated spring');
  const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});touch.on('pageerror',e=>errors.push(e.message));
  await touch.goto(base);await touch.locator('#graph[data-ready="true"]').waitFor();
  const mobileGoal=await anchor(touch,'goal'),mobileComplete=await anchor(touch,'complete');assert.ok(Math.abs(mobileGoal.y-mobileComplete.y)<1,'mobile initial projection also keeps endpoints level: '+JSON.stringify({mobileGoal,mobileComplete}));
  const origin=await anchor(touch,'goal'),cdp=await touch.context().newCDPSession(touch);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:origin.x,y:origin.y,id:1}]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:origin.x+i*6,y:origin.y+i*3,id:1}]});
  await touch.waitForTimeout(60);assert.ok(distance(origin,await anchor(touch,'goal'))>20,'touch drag also moves the stage');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await touch.waitForTimeout(800);
  assert.ok(distance(origin,await anchor(touch,'goal'))<1,'cancelled touch returns the stage');
  await touch.screenshot({path:'.work/screenshots/spatial-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: straight engineering links, level endpoints, parallel branches, live drag, spring return, pointer leave, reduced motion and touch cancellation');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
