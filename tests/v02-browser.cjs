const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
async function anchor(page,id){return page.locator('#engineering-labels line[data-node-id="stage:'+id+'"]').evaluate(e=>({x:Number(e.getAttribute('x1')),y:Number(e.getAttribute('y1'))}));}
async function checkLabels(page){
  await page.locator('#engineering-labels line').nth(8).waitFor({state:'attached'});
  const boxes=await page.locator('.engineering-label:visible').evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.nodeId,x:r.x,y:r.y,w:r.width,h:r.height};}));
  assert.equal(boxes.length,9,'all engineering labels are visible in the default view');
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];
    assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'engineering labels do not overlap: '+a.id+' / '+b.id);
  }
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
  const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.stack||e.message));
  page.on('request',r=>{if(!r.url().startsWith(new URL(base).origin)&&!r.url().startsWith('data:'))external.push(r.url());});
  await page.goto(base);await page.locator('#graph[data-ready="true"]').waitFor();
  assert.equal(await page.locator('.engineering-label').count(),9,'engineering stages use C3 HTML labels');
  await checkLabels(page);
  const order=['goal','system','method','deployment','evaluation','complete'];
  const points=[];for(const id of order)points.push(await anchor(page,id));
  for(let i=1;i<points.length;i++)assert.ok(points[i].x>points[i-1].x,'default view reads left to right');
  const method=await anchor(page,'method');
  await page.waitForTimeout(500);
  assert.deepEqual(await anchor(page,'method'),method,'force simulation leaves the engineering anchor fixed');
  await page.mouse.move(method.x,method.y);await page.mouse.down();await page.mouse.move(method.x+95,method.y-65,{steps:10});await page.mouse.up();
  await page.waitForTimeout(150);
  const dragged=await anchor(page,'method');
  assert.ok(Math.hypot(dragged.x-method.x,dragged.y-method.y)<1,'dragging an engineering node cannot rearrange it');
  await page.mouse.move(method.x,method.y);await page.locator('#hover-caption').waitFor({state:'visible'});
  await page.waitForTimeout(500);
  await mkdir('.work/screenshots',{recursive:true});
  await page.screenshot({path:'.work/screenshots/v02-hover.png'});
  await page.getByRole('button',{name:'显示节点名称',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'显示节点名称',exact:true}).getAttribute('aria-pressed'),'true');
  await page.mouse.move(20,180);await page.screenshot({path:'.work/screenshots/v02-names.png'});
  await page.getByRole('button',{name:'显示节点名称',exact:true}).click();
  await page.mouse.move(20,180);await page.waitForTimeout(8000);
  await page.screenshot({path:'.work/screenshots/v02-overview.png'});
  const before=await anchor(page,'method');
  await page.mouse.move(50,200);await page.mouse.down();await page.mouse.move(160,260,{steps:12});await page.mouse.up();
  await page.waitForTimeout(200);
  const rotated=await anchor(page,'method');
  assert.ok(Math.hypot(rotated.x-before.x,rotated.y-before.y)>3,'the graph still allows Orbit rotation');
  await page.reload();await page.locator('#graph[data-ready="true"]').waitFor();
  await page.evaluate(()=>document.documentElement.style.fontSize='32px');
  await page.waitForTimeout(150);await checkLabels(page);
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});await page.reload();await page.locator('#graph[data-ready="true"]').waitFor();
    await checkLabels(page);
    await page.screenshot({path:'.work/screenshots/v02-mobile-'+width+'.png'});
    await page.getByRole('button',{name:'显示节点名称',exact:true}).click();
    await page.mouse.move(20,180);await page.waitForTimeout(200);
    await page.screenshot({path:'.work/screenshots/v02-mobile-names-'+width+'.png'});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS: 0.2 fixed engineering order, locked stage drag, Orbit rotation, C3 label spacing, name toggle, 200% text and mobile; no external assets');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
