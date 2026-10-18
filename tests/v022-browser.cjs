const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
async function anchor(page,id){return page.locator('#engineering-labels line[data-node-id="stage:'+id+'"]').evaluate(e=>({x:Number(e.getAttribute('x1')),y:Number(e.getAttribute('y1'))}));}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('#graph[data-ready="true"]').waitFor();
  assert.equal(await page.locator('.brand-caption,#scene-caption').count(),0,'homepage captions are removed');
  await page.locator('#settings-button').click();assert.equal(await page.locator('#glow').inputValue(),'50');assert.equal(await page.locator('#glow-value').innerText(),'50');
  assert.equal(await page.locator('#exit-scale').count(),0);assert.equal(await page.getByText('0 为关闭，只在需要时点亮图谱。',{exact:true}).count(),0);
  assert.match(await page.locator('#settings-panel').innerText(),/点击节点阅读/);
  const label=page.locator('.engineering-label strong').first();assert.equal(await label.evaluate(e=>getComputedStyle(e).color),'rgb(227, 190, 124)');
  await page.keyboard.press('Escape');
  const before=await anchor(page,'goal'),complete=await anchor(page,'complete');
  await page.mouse.move(before.x,before.y);await page.locator('#hover-caption').waitFor({state:'visible'});
  assert.equal(await page.locator('#hover-caption').evaluate(e=>getComputedStyle(e).color),'rgb(227, 190, 124)','the hover name also uses its node color');
  await page.mouse.wheel(0,-320);await page.waitForTimeout(200);
  const after=await anchor(page,'goal');assert.ok(distance(before,after)<3,'off-center canvas wheel zoom keeps the node under the cursor: '+JSON.stringify({before,after}));
  assert.ok(distance(complete,await anchor(page,'complete'))>40,'the graph actually zooms around that cursor position');
  await page.locator('#overview-button').click();await page.locator('#labels-button').click();await page.mouse.move(10,130);await page.waitForTimeout(100);
  await mkdir('.work/screenshots',{recursive:true});await page.screenshot({path:'.work/screenshots/v022-colored-names.png'});
  await page.locator('#settings-button').click();await page.screenshot({path:'.work/screenshots/v022-settings.png'});
  await page.reload();await page.locator('#graph[data-ready="true"]').waitFor();await page.locator('#settings-button').click();assert.equal(await page.locator('#glow').inputValue(),'50');
  assert.deepEqual(errors,[]);console.log('PASS: 0.2.2 clean homepage, simple settings, default glow 50, colored labels and real cursor-centered wheel zoom');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
