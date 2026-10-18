const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
async function select(page,query){await page.locator('#search-button').click();await page.getByRole('combobox').fill(query);await page.getByRole('combobox').press('Enter');await page.locator('#concept-layer').waitFor({state:'visible'});}
async function background(page){return page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{const canvas=document.querySelector('#graph canvas'),gl=canvas.getContext('webgl2'),pixel=new Uint8Array(4);gl.readPixels(5,Math.floor(canvas.height*.65),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);resolve([...pixel]);})));}
async function halo(page){return page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{const canvas=document.querySelector('#graph canvas'),gl=canvas.getContext('webgl2'),anchor=document.querySelector('#engineering-labels line[data-node-id="stage:goal"]'),pixel=new Uint8Array(4),scale=canvas.width/canvas.clientWidth;gl.readPixels(Math.round((Number(anchor.getAttribute('x1'))-12)*scale),Math.round(canvas.height-(Number(anchor.getAttribute('y1'))-12)*scale),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);resolve([...pixel]);})));}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('#graph[data-ready="true"]').waitFor();
  const dark=await background(page);
  const unlitHalo=await halo(page);
  assert.ok(dark[0]>=8&&dark[0]<=12&&dark[2]>=23&&dark[2]<=27,'sample a rendered dark background, not an empty buffer: '+dark);
  await page.locator('#settings-button').click();
  for(const value of [1,25,100,0]){
   await page.locator('#glow').fill(String(value));await page.locator('#glow').dispatchEvent('input');await page.waitForTimeout(100);
   const pixel=await background(page);
   assert.ok(pixel.every((n,i)=>Math.abs(n-dark[i])<=2),'Bloom '+value+' must preserve the dark background: '+pixel+' vs '+dark);
   if(value===100){const lit=await halo(page);assert.ok(lit[0]+lit[1]+lit[2]>unlitHalo[0]+unlitHalo[1]+unlitHalo[2]+10,'the slider must still create a visible local halo');}
  }
  const exit=page.getByRole('slider',{name:'缩小退出阈值',exact:true});assert.equal(await exit.inputValue(),'80');
  await exit.fill('100');await exit.dispatchEvent('input');assert.equal(await page.locator('#exit-scale-value').innerText(),'100%');
  await page.keyboard.press('Escape');
  await select(page,'PPO');
  await page.mouse.move(50,200);await page.mouse.wheel(0,-100);await page.waitForTimeout(200);
  assert.ok(new URL(page.url()).hash.includes('term='),'zooming in retains focus');
  await page.mouse.down();await page.mouse.move(95,230,{steps:5});await page.mouse.up();await page.waitForTimeout(250);
  assert.ok(new URL(page.url()).hash.includes('term='),'rotation alone retains focus');
  await page.locator('#concept-layer [data-action="read"]').first().click();
  await page.locator('#reader-panel').waitFor({state:'visible'});
  await page.mouse.move(40,200);
  let steps=0;while(new URL(page.url()).hash&&steps++<28){await page.mouse.wheel(0,160);await page.waitForTimeout(90);}
  assert.equal(new URL(page.url()).hash,'','manual outward zoom returns to overview');
  assert.equal(await page.locator('#graph').getAttribute('data-focused'),'');
  assert.equal(await page.locator('#reader-panel').isVisible(),false);assert.equal(await page.locator('#concept-layer').isVisible(),false);
  // A hidden local layer must not prevent the same manual exit behavior.
  await select(page,'PPO');await page.keyboard.press('Escape');
  await page.mouse.move(40,200);steps=0;while(new URL(page.url()).hash&&steps++<28){await page.mouse.wheel(0,180);await page.waitForTimeout(80);}
  assert.equal(new URL(page.url()).hash,'');
  await page.locator('#overview-button').click();await page.waitForTimeout(200);
  const points=await page.locator('#engineering-labels line').evaluateAll(lines=>lines.map(e=>({x:Number(e.getAttribute('x1')),y:Number(e.getAttribute('y1'))})));
  assert.equal(points.length,9);assert.ok(points.every(p=>p.x>25&&p.x<1340&&p.y>45&&p.y<900),'overview frames the entire engineering route');
  await mkdir('.work/screenshots',{recursive:true});await page.screenshot({path:'.work/screenshots/refined-overview.png'});
  await page.locator('#settings-button').click();await page.locator('#glow').fill('65');await page.locator('#glow').dispatchEvent('input');await page.keyboard.press('Escape');await page.screenshot({path:'.work/screenshots/refined-glow.png'});
  await page.reload();await page.locator('#graph[data-ready="true"]').waitFor();await page.locator('#settings-button').click();
  assert.equal(await exit.inputValue(),'80');assert.equal(await page.locator('#glow').inputValue(),'0');
  await page.keyboard.press('Escape');await select(page,'手内操作');
  for(const id of ['u2','u28']){
   await page.getByRole('button',{name:'阅读手内操作',exact:true}).click();await page.getByText('工程中的位置',{exact:true}).click();
   await page.locator('#reader-content [data-action="relation"][data-id="usage:'+id+'"]').click();
   assert.match(await page.locator('#reader-content').innerText(),id==='u2'?/定义手内操作任务/:/评估手内操作表现/);
   assert.equal(await page.locator('#reader-content a[href*="0278364919887447"]').count(),1,'each usage exposes the journal source');
   assert.match(await page.locator('#reader-content').innerText(),id==='u2'?/Section 2:/:/Section 6.2:/);await page.keyboard.press('Escape');
  }
  await page.locator('#settings-button').click();
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='32px');
   await exit.scrollIntoViewIfNeeded();await exit.focus();await exit.press('ArrowRight');assert.equal(await page.locator('#exit-scale-value').innerText(),width===1440?'85%':'90%');
   const box=await exit.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<=844,'new settings remain accessible at 200% text');
  }
  const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  touch.on('pageerror',e=>errors.push(e.message));await touch.goto(base+'#term=proximal_policy_optimization');await touch.locator('#concept-layer').waitFor({state:'visible'});
  const cdp=await touch.context().newCDPSession(touch);
  for(let gesture=0;gesture<3&&new URL(touch.url()).hash;gesture++){
   const points=gap=>[{x:160-gap/2,y:165,id:1},{x:160+gap/2,y:165,id:2}];
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points(180)});
   for(let i=1;i<=18;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points(180-i*9)});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(150);
  }
  assert.equal(new URL(touch.url()).hash,'','two-finger outward camera zoom also exits focus');
  assert.equal(await touch.locator('#concept-layer').isVisible(),false);assert.equal(await touch.locator('#graph').getAttribute('data-focused'),'');
  assert.deepEqual(errors,[]);console.log('PASS: Bloom background/halo pixels, adjustable mouse/touch zoom exit, card closure, rotation/zoom-in retention, overview framing, usage evidence and 200% settings');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
