const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
async function anchor(page,id){return page.locator('#engineering-labels line[data-node-id="stage:'+id+'"]').evaluate(e=>({x:Number(e.getAttribute('x1')),y:Number(e.getAttribute('y1'))}));}
// Allow the graph's frame-based raycast to observe the pointer before a click.
async function doubleClick(page,x,y){await page.mouse.move(x,y);await page.waitForTimeout(90);await page.mouse.dblclick(x,y,{delay:70});}
async function select(page,query,kind='term'){await page.locator('#search-button').click();await page.getByRole('combobox').fill(query);await page.getByRole('combobox').press('Enter');await page.locator(kind==='term'?'#concept-layer':'#stage-panel').waitFor({state:'visible'});}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('#graph[data-ready="true"]').waitFor();
  await select(page,'BC');
  const group=page.locator('.group-contrast');
  const widths=await page.locator('.relation-group').evaluateAll(groups=>groups.map(g=>g.querySelector('.term-card:not([hidden])').getBoundingClientRect().width));
  await group.hover();await page.mouse.wheel(0,350);await page.waitForTimeout(120);
  const pin=await group.evaluate(g=>({scroll:g.scrollTop,headerTop:g.querySelector('h2').getBoundingClientRect().top,groupTop:g.getBoundingClientRect().top}));
  assert.ok(pin.scroll>30&&Math.abs(pin.headerTop-pin.groupTop)<2&&Math.max(...widths)-Math.min(...widths)<1,'scrolling headers stay at the top and all corner cards keep one width: '+JSON.stringify({pin,widths}));
  const backing=await group.locator('h2').evaluate(e=>getComputedStyle(e).backgroundColor);assert.match(backing,/0\.9|rgb\(/,'headers have a strong dark background');
  await mkdir('.work/screenshots',{recursive:true});await page.screenshot({path:'.work/screenshots/v023-pinned-title.png'});
  await page.locator('.center-reader').dblclick();assert.equal(await page.locator('#concept-layer').isVisible(),true,'double-clicking a card does not dismiss it');
  await page.locator('#reader-panel').waitFor({state:'visible'});
  await page.mouse.click(30,160);await page.waitForTimeout(80);assert.equal(await page.locator('#concept-layer').isVisible(),true,'one background click leaves cards open');
  await page.waitForTimeout(500);await doubleClick(page,30,160);await page.waitForTimeout(100);
  assert.equal(await page.locator('#reader-panel').isVisible(),false);assert.equal(await page.locator('#concept-layer').isVisible(),false);
  assert.ok(new URL(page.url()).hash.includes('behavior_cloning'),'closing cards preserves the selected term and camera context');
  await page.locator('#overview-button').click();
  const a=await anchor(page,'goal'),b=await anchor(page,'system');
  await doubleClick(page,(a.x+b.x)/2,(a.y+b.y)/2);await page.locator('#reader-panel').waitFor({state:'visible'});
  assert.equal(await page.locator('#reader-panel').isVisible(),true,'double-clicking a relation opens reading, never background dismissal');
  await doubleClick(page,30,160);await page.waitForTimeout(100);assert.equal(await page.locator('#reader-panel').isVisible(),false);
  await select(page,'系统','stage');await doubleClick(page,720,450);await page.waitForTimeout(120);
  assert.equal(await page.locator('#stage-panel').isVisible(),true,'double-clicking an engineering node keeps its card open');
  await doubleClick(page,30,160);await page.waitForTimeout(100);assert.equal(await page.locator('#stage-panel').isVisible(),false);
  let steps=0;await page.mouse.move(30,170);while(new URL(page.url()).hash&&steps++<35){await page.mouse.wheel(0,200);await page.waitForTimeout(65);}
  assert.equal(new URL(page.url()).hash,'','engineering navigation now exits on outward zoom too');
  await page.mouse.move(50,180);await page.mouse.down();await page.mouse.move(185,250,{steps:12});await page.mouse.up();await page.waitForTimeout(400);
  await page.locator('#overview-button').click();await page.waitForTimeout(100);
  const angled=[await anchor(page,'goal'),await anchor(page,'complete')];assert.ok(Math.abs(angled[0].y-angled[1].y)>8,'the first overview click preserves the current angle');
  await page.locator('#overview-button').click();await page.waitForTimeout(120);
  const front=[await anchor(page,'goal'),await anchor(page,'complete')];assert.ok(Math.abs(front[0].y-front[1].y)<1&&front[0].x<front[1].x,'a second overview click restores the front view');
  const beforeGoal=await anchor(page,'goal'),beforeComplete=await anchor(page,'complete');
  await page.mouse.move(beforeGoal.x,beforeGoal.y);await page.mouse.down({button:'middle'});await page.mouse.move(beforeGoal.x+95,beforeGoal.y+45,{steps:12});await page.mouse.up({button:'middle'});await page.waitForTimeout(850);
  const afterGoal=await anchor(page,'goal'),afterComplete=await anchor(page,'complete');
  assert.ok(distance(beforeGoal,afterGoal)>30,'middle drag over a node pans the graph rather than moving only that node');
  assert.ok(distance({x:afterGoal.x-beforeGoal.x,y:afterGoal.y-beforeGoal.y},{x:afterComplete.x-beforeComplete.x,y:afterComplete.y-beforeComplete.y})<1,'both endpoints translate equally without rotation');
  await page.mouse.move(afterGoal.x,afterGoal.y);await page.waitForTimeout(90);await page.mouse.click(afterGoal.x,afterGoal.y);await page.waitForTimeout(120);
  assert.equal(await page.locator('#stage-panel').isVisible(),true,'the first node click after middle-button pan must open its card');
  await page.locator('#overview-button').click();await page.locator('#overview-button').click();await page.mouse.move(15,120);
  await page.screenshot({path:'.work/screenshots/v023-front.png'});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.mouse.move(50,180);await page.mouse.down();await page.mouse.move(185,250,{steps:12});await page.mouse.up();
  await page.locator('#overview-button').click();await page.locator('#overview-button').click();await page.waitForTimeout(800);
  const settled=[await anchor(page,'goal'),await anchor(page,'complete')];await page.waitForTimeout(250);
  assert.ok(Math.abs(settled[0].y-settled[1].y)<1&&distance(settled[0],await anchor(page,'goal'))<1,'rapid overview presses cancel the previous flight and settle on a stable front view');
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(base+'#term=behavior_cloning');await mobile.locator('#concept-layer').waitFor({state:'visible'});
  for(const fontSize of ['16px','32px']){
   await mobile.evaluate(size=>document.documentElement.style.fontSize=size,fontSize);
   await mobile.locator('.group-contrast').evaluate(g=>{const layer=document.querySelector('#concept-layer');layer.scrollTop+=g.getBoundingClientRect().top-layer.getBoundingClientRect().top+60;});
   const layout=await mobile.locator('.group-contrast').evaluate(g=>({top:g.querySelector('h2').getBoundingClientRect().top,group:g.getBoundingClientRect().top,panel:document.querySelector('#concept-layer').getBoundingClientRect().top,width:g.getBoundingClientRect().width,heading:g.querySelector('h2').getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.ok(Math.abs(layout.top-Math.max(layout.panel,layout.group))<2&&layout.heading<=layout.width&&!layout.overflow,'mobile group headers stay readable at '+fontSize+': '+JSON.stringify(layout));
   if(fontSize==='32px')assert.ok(layout.group<layout.panel,'the larger mobile group actually scrolls under its pinned header');
  }
  await mobile.screenshot({path:'.work/screenshots/v023-mobile-text200.png'});
  assert.deepEqual(errors,[]);console.log('PASS: sticky dark headers, uniform cards, background-only double-click dismissal, stage zoom exit, two-step overview, rapid camera reset, middle-button pan over nodes and mobile headers at 200% text');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
