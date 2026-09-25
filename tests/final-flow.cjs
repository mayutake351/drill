const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
module.exports=async function({context,url,key}){
  let page=await context.newPage();const errors=[],missing=[];
  const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)missing.push(r.url())})};watch(page);
  await page.goto(url);await page.evaluate(()=>localStorage.clear());await page.reload();await page.setViewportSize({width:390,height:844});
  const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  assert.equal((await saved()).pet.xp,0);await page.locator('#nav-room').click();assert.equal(await page.locator('#roomScene').getAttribute('data-stage'),'egg');
  await page.locator('#nav-todo').click();await page.locator('#addMainBtn').click();
  // Reduced visible height exercises the same layout as the area above a phone keyboard.
  await page.setViewportSize({width:390,height:360});await page.locator('#nameInput').fill('まいにちの音読');
  assert.equal(await page.locator('#taskEditor .panel').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),true);
  await page.locator('#saveTaskBtn').click();assert.equal(await page.locator('#taskEditor').isVisible(),false);await page.setViewportSize({width:390,height:844});
  assert.equal((await saved()).tasks.at(-1).name,'まいにちの音読');
  const rate=async index=>{await page.locator('#nav-todo').click();await page.locator('.taskCard').nth(index).click();await page.locator('#scoreOptions [data-score="5"]').click();await page.locator('#confirmScoreBtn').click()};
  await rate(6);assert.equal((await saved()).points,30);assert.equal((await saved()).pet.xp,5);await rate(0);assert.equal((await saved()).pet.xp,10);
  await page.locator('#nav-room').click();assert.equal(await page.locator('#roomScene').getAttribute('data-stage'),'baby');
  await page.locator('#nav-shop').click();await page.locator('[data-food="りんご"]').click();await page.locator('[data-food="りんご"]').click();assert.equal((await saved()).food['りんご'].count,2);assert.equal((await saved()).pet.xp,10,'purchase does not feed');
  await page.locator('#nav-room').click();await page.locator('#roomFoodBtn').click();await page.locator('#itemModalBody button').filter({hasText:'りんご'}).click();assert.equal((await saved()).pet.xp,12);assert.equal((await saved()).food['りんご'].count,1);
  await page.locator('#nav-shop').click();await page.locator('#dressTab').click();await page.locator('[data-dress="ピンクリボン"]').click();await page.locator('#nav-room').click();await page.locator('#roomDressBtn').click();await page.locator('#itemModalBody button').filter({hasText:'ピンクリボン'}).click();assert.equal((await saved()).equipped.ribbon,'ピンクリボン');
  await page.locator('#nav-book').click();assert.equal(await page.locator('#discoveredCount').innerText(),'1 / 6');
  for(let i=1;i<=5;i++)await rate(i);assert.equal((await saved()).pet.xp,37);await page.locator('#nav-room').click();assert.equal(await page.locator('#roomScene').getAttribute('data-stage'),'kitten');
  const tomorrow=new Date(Date.now()+86400000);await page.clock.install({time:tomorrow});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  for(const i of [6,0,1,2,3])await rate(i);assert.equal((await saved()).pet.xp,62);
  await page.locator('#nav-room').click();assert.equal(await page.locator('#roomScene').getAttribute('data-stage'),'adult');await page.locator('#nav-book').click();assert.match(await page.locator('[data-cat="foodie"]').innerText(),/コンプリート/);
  const beforeClose=await saved();await page.close();page=await context.newPage();watch(page);await page.clock.install({time:tomorrow});await page.setViewportSize({width:390,height:844});await page.goto(url);
  const reopened=await saved();for(const field of ['tasks','points','pet','food','dress','equipped','collection'])assert.deepEqual(reopened[field],beforeClose[field],'close/reopen retains '+field);
  const dir=path.resolve(__dirname,'../screenshots/final');fs.mkdirSync(dir,{recursive:true});
  for(const name of ['todo','room','shop','book']){
    await page.locator('#nav-'+name).click();await page.waitForTimeout(350);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.locator('.page.active img[src]').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),true,'loaded images '+name);
    await page.screenshot({path:path.join(dir,name+'.png')});
  }
  // Fetch image references including hidden stages and CSS scenery.
  const resources=await page.evaluate(()=>[...new Set([...document.querySelectorAll('img[src],svg image')].map(el=>el.getAttribute('src')||el.getAttribute('href')).filter(Boolean))]);
  for(const resource of resources){const r=await context.request.get(new URL(resource,url).href);assert.equal(r.ok(),true,resource)}
  for(const width of [320,390,430]){
    await page.setViewportSize({width,height:844});
    for(const name of ['todo','room','shop','book']){await page.locator('#nav-'+name).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name+' fits '+width);await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));assert.equal(await page.locator('.page.active').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.bottomNav').getBoundingClientRect().top),true,'nav clears '+name)}
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#nav-todo').click();await page.locator('#addMainBtn').click();await page.locator('#nameInput').fill('保存失敗の確認');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked')}});await page.locator('#saveTaskBtn').click();assert.equal(await page.locator('#taskEditor').isVisible(),true);assert.equal((await saved()).tasks.length,7);await page.locator('#closeTaskEditor').click();assert.equal(await page.locator('.taskCard').count(),7);
  await page.locator('#nav-room').click();await page.locator('#roomDressBtn').click();await page.locator('#itemModalBody button').filter({hasText:'全部はずす'}).click();assert.equal(await page.locator('#itemModal').isVisible(),true);assert.equal((await saved()).equipped.ribbon,'ピンクリボン');assert.equal(await page.locator('#wearRibbon').isVisible(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await page.close();
  console.log('PASS final: fresh egg → register → scores/points/XP → baby/kitten/adult → food/inventory/feed → purchase/equip → collection complete; close/reopen all data, keyboard-sized viewport, image requests, all screens/nav at 320/390/430px, failed edit/equip saves. Errors: 0.');
};
