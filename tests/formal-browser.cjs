const assert=require('node:assert/strict');
const {readFile,mkdir}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
  await page.goto(base);await page.locator('#graph[data-ready=true]').waitFor();
  const glossary=JSON.parse(await readFile('data/glossary.json','utf8'));
  await page.locator('#settings-button').click();await page.locator('#settings-panel summary').filter({hasText:'关于与来源'}).click();
  assert.equal(await page.locator('#content-summary').count(),1,'loaded content summary is data driven');
  assert.match(await page.locator('#content-summary').textContent(),new RegExp(glossary.terms.length+' 个'));
  assert.equal(await page.locator('#about-sources > a').count(),glossary.metadata.primary_source_ids.length,'all selected background sources have readable links');
  const href=await page.getByRole('link',{name:'来源与权威性评估',exact:true}).getAttribute('href');const doc=await page.request.get(new URL(href,base).href);assert.equal(doc.status(),200);assert.match(await doc.text(),/元数据|发表/);
  await page.keyboard.press('Escape');
  for(const q of ['POMDP','摩擦锥','ACT']){await page.locator('#search-button').click();await page.getByRole('combobox').fill(q);await page.getByRole('combobox').press('Enter');await page.locator('#concept-layer').waitFor();}
  await page.getByRole('button',{name:'阅读基于 Transformer 的动作分块方法',exact:true}).click();await page.locator('#reader-panel').waitFor();
  assert.ok(await page.locator('#reader-content').getByText('定义依据',{exact:true}).count());
  await page.keyboard.press('Escape');
  await page.locator('[data-action="relation"][data-id="act-transformer"]').click();await page.locator('#reader-panel').waitFor();assert.match(await page.locator('#reader-content').textContent(),/原始 ACT 架构/);
  await page.setViewportSize({width:390,height:844});const box=await page.locator('#reader-panel').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=391);
  await mkdir('.work/screenshots',{recursive:true});await page.screenshot({path:'.work/screenshots/glossary-v1-mobile.png'});assert.deepEqual(errors,[]);
  console.log('PASS: formal counts, source document, new/legacy search, claim evidence, scoped relation and mobile reading');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
