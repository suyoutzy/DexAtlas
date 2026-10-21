const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173/';
async function search(page,query){
  await page.getByRole('button',{name:'搜索术语与工程环节',exact:true}).click();
  await page.getByRole('combobox').fill(query);
  await page.getByRole('combobox').press('Enter');
}
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await page.route('**/data/framework.json',route=>route.abort());
    await page.goto(base);
    await page.getByRole('button',{name:'重新加载',exact:true}).waitFor();
    await page.unroute('**/data/framework.json');
    await page.getByRole('button',{name:'重新加载',exact:true}).click();
    await page.locator('#graph[data-ready="true"]').waitFor();
    console.log('PASS: failed data request can retry into a real 3D scene');
    await search(page,'PPO');await page.locator('[data-center-term="proximal_policy_optimization"]').waitFor();
    await search(page,'SAC');await page.locator('[data-center-term="soft_actor_critic"]').waitFor();
    await page.reload();await page.locator('[data-center-term="soft_actor_critic"]').waitFor();
    await page.getByRole('button',{name:'返回上一位置',exact:true}).click();
    await page.locator('[data-center-term="proximal_policy_optimization"]').waitFor();
    assert.equal(await page.locator('.center-card').evaluate(e=>getComputedStyle(e).animationName),'none');
    console.log('PASS: refresh retains navigation history; reduced-motion cards do not animate');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await search(page,'PPO');await page.waitForTimeout(350);
    assert.equal(await page.locator('#concept-layer').isVisible(),false,'local cards wait until the camera flight finishes');
    await search(page,'PPO');await search(page,'SAC');await search(page,'IL');
    await page.locator('[data-center-term="imitation_learning"]').waitFor();
    await page.waitForTimeout(700);
    assert.equal(await page.locator('[data-center-term]').count(),1);
    assert.equal(await page.locator('[data-center-term]').getAttribute('data-center-term'),'imitation_learning');
    console.log('PASS: rapid refocusing shows only the last selected term');
    await page.emulateMedia({reducedMotion:'reduce'});
    const terms=JSON.parse(await readFile('data/glossary.json','utf8')).terms;
    for(const viewport of [{width:1440,height:900},{width:1024,height:768},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      for(const term of terms){
        await search(page,term.name.zh);
        await page.locator('[data-center-term="'+term.id+'"]').waitFor();
        const card=await page.locator('[data-center-term]').boundingBox();
        assert.ok(card.x>=0&&card.y>=0&&card.x+card.width<=viewport.width+1&&card.y+card.height<=viewport.height+1,term.id+' center card fits viewport');
      }
    }
    await page.setViewportSize({width:1440,height:900});
    await page.evaluate(()=>document.documentElement.style.fontSize='32px');
    await search(page,'PPO');
    await page.getByRole('button',{name:'阅读近端策略优化',exact:true}).click();
    assert.ok(await page.locator('#reader-content').evaluate(e=>e.clientHeight>100&&e.scrollHeight>e.clientHeight),'200% text retains a scrollable reading area');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.evaluate(()=>document.documentElement.style.fontSize='');
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    await search(page,'PPO');await page.locator('[data-center-term]').waitFor();
    await page.keyboard.press('Escape');
    await page.mouse.move(720,450);
    await page.locator('#hover-caption').waitFor({state:'visible'});
    await page.getByRole('button',{name:'图谱设置',exact:true}).hover();
    assert.equal(await page.locator('#hover-caption').isVisible(),false,'leaving graph for a control must clear hover feedback');
    await page.mouse.move(720,450);
    await page.locator('#hover-caption').waitFor({state:'visible'});
    await page.mouse.click(720,450);
    await page.locator('[data-center-term="proximal_policy_optimization"]').waitFor();
    await page.mouse.move(60,250);
    const before=await page.locator('#graph canvas').screenshot();
    await page.mouse.down();await page.mouse.move(160,310,{steps:12});await page.mouse.up();
    const after=await page.locator('#graph canvas').screenshot();
    assert.equal(before.equals(after),false,'canvas outside the cards still rotates');
    assert.equal(await page.locator('[data-center-term="proximal_policy_optimization"]').count(),1,'rotation retains local context');
    await search(page,'模仿学习');
    await page.locator('[data-center-term="imitation_learning"]').waitFor();
    const more=page.locator('.more-button').first();
    await more.click();
    assert.equal(await more.getAttribute('aria-expanded'),'true');
    assert.ok(await page.locator('[data-extra]:visible').count()>0,'additional recorded relationships can be expanded');
    const lines=await page.locator('#concept-lines').innerHTML();
    await page.locator('.relation-group').filter({has:more}).evaluate(e=>{e.scrollTop=e.scrollHeight;});
    await page.waitForFunction(previous=>document.querySelector('#concept-lines').innerHTML!==previous,lines,{timeout:2000});
    await more.click();
    assert.equal(await page.locator('[data-extra]:visible').count(),0);
    console.log('PASS: all terms at desktop/tablet/mobile sizes, 200% text, real canvas hover and hover exit');
    await page.close();

    const fallback=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    await fallback.addInitScript(()=>{
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};
    });
    await fallback.goto(base);
    await fallback.locator('#fallback-panel').waitFor({state:'visible'});
    await search(fallback,'VLA');
    await fallback.locator('[data-center-term="vision_language_action_model"]').waitFor();
    await fallback.getByRole('button',{name:'阅读视觉-语言-动作模型',exact:true}).click();
    await fallback.locator('#reader-panel').waitFor({state:'visible'});
    await fallback.getByText('工程中的位置',{exact:true}).click();
    await fallback.locator('#reader-content [data-action="relation"][data-id^="usage:"]').first().click({timeout:2000});
    assert.match(await fallback.locator('#reader-content').innerText(),/工程用途/);
    assert.ok(await fallback.locator('#reader-content a[href^="https://"]').count(),'engineering usage evidence is available without WebGL');
    await fallback.keyboard.press('Escape');await fallback.keyboard.press('Escape');
    assert.equal(await fallback.locator('#fallback-panel').isVisible(),true);
    console.log('PASS: WebGL-unavailable fallback still supports search, concept relations and reading');
    await fallback.close();
    const sparse=await browser.newPage({reducedMotion:'reduce'});
    const annotations=JSON.parse(await readFile('data/annotations.json','utf8'));
    const framework=JSON.parse(await readFile('data/framework.json','utf8'));
    annotations.relations=annotations.relations.filter(r=>r.from!=='force_closure'&&r.to!=='force_closure');
    delete annotations.history.force_closure;
    framework.usages=framework.usages.filter(u=>u.term_id!=='force_closure');
    await sparse.route('**/data/annotations.json',r=>r.fulfill({json:annotations}));
    await sparse.route('**/data/framework.json',r=>r.fulfill({json:framework}));
    await sparse.goto(base+'#term=force_closure');
    await sparse.getByText('尚未收录明确的直接关系，可先阅读该词条。',{exact:true}).waitFor();
    await sparse.getByRole('button',{name:'阅读力闭合',exact:true}).click();
    await sparse.getByText('工程中的位置',{exact:true}).click();
    await sparse.getByText('当前框架尚未标注该术语的工程位置。',{exact:true}).waitFor();
    await sparse.getByText('沿革未评估',{exact:true}).click();
    await sparse.getByText('尚未核实沿革标签，不据此判断技术是否过时。',{exact:true}).waitFor();
    console.log('PASS: explicit empty relationship, unmapped engineering position and unassessed history states');
    await sparse.close();
    if(process.env.PREVIEW_SUBPATH_URL){
      const sub=await browser.newPage({reducedMotion:'reduce'});
      const failed=[];
      sub.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
      await sub.goto(process.env.PREVIEW_SUBPATH_URL+'#term=proximal_policy_optimization&view=engineering');
      await sub.locator('#graph[data-ready="true"]').waitFor();
      await sub.locator('[data-center-term="proximal_policy_optimization"]').waitFor();
      assert.deepEqual(failed,[]);
      console.log('PASS: GitHub Pages-style subpath and legacy direct link load all local assets');
      await sub.close();
    }
  } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
