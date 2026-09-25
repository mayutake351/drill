// Stage 2 scenarios use the isolated server/browser harness in stage1.cjs.
const assert=require('node:assert/strict');
const path=require('node:path');
const os=require('node:os');
module.exports=async function({page,saved,openRating,chooseRating,key}){
  await page.evaluate(()=>localStorage.clear());await page.reload();
  assert.equal((await saved()).pet.xp,0);
  await page.locator('#nav-room').click();
  assert.equal(await page.locator('#roomEgg').isVisible(),true);
  assert.equal(await page.locator('#roomCat').isVisible(),false);
  await page.screenshot({path:path.join(os.tmpdir(),'makopet2-room-egg.png'),fullPage:true});
  await page.locator('#roomFoodBtn').click();
  assert.equal(await page.locator('#itemModal').isVisible(),false,'egg cannot consume food');
  await page.locator('#roomStudyBtn').click();
  await openRating();await chooseRating(0);assert.equal((await saved()).pet.xp,0);
  await openRating();await chooseRating(1);assert.equal((await saved()).pet.xp,1);
  await openRating();await chooseRating(1);assert.equal((await saved()).pet.xp,1,'repeat earns no XP');
  await openRating();await page.locator('#scoreOptions [data-score="5"]').click();await page.locator('#closeScoreModal').click();
  assert.equal((await saved()).pet.xp,1,'cancel earns no XP');
  await openRating();await chooseRating(3);assert.equal((await saved()).pet.xp,3,'only new high score adds XP');
  await openRating();await chooseRating(1);assert.equal((await saved()).pet.xp,3,'no regression');
  await openRating();await chooseRating(3);assert.equal((await saved()).pet.xp,3,'cycling scores cannot farm XP');
  await page.reload();await openRating();await chooseRating(5);assert.equal((await saved()).pet.xp,5);
  await openRating(1);await chooseRating(5);assert.equal((await saved()).pet.xp,10);
  assert.match(await page.locator('#successGrowth').innerText(),/おめでとう！ あかちゃん/);
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(os.tmpdir(),'makopet2-hatching.png')});
  await page.locator('#nav-room').click();
  assert.equal(await page.locator('#petStage').innerText(),'あかちゃん');
  assert.equal(await page.locator('#roomCat').isVisible(),true);
  assert.equal(await page.locator('#growthRemaining').innerText(),'次の成長（こねこ）まで あと20 EXP');
  assert.equal(await page.locator('#growthGauge').getAttribute('max'),'20');
  await page.locator('#nav-shop').click();await page.locator('[data-food="りんご"]').click();
  await page.locator('#nav-room').click();await page.locator('#roomFoodBtn').click();
  await page.locator('#itemModalBody button').filter({hasText:'りんご'}).click();
  assert.equal((await saved()).pet.xp,12);assert.equal((await saved()).belly,42);
  assert.equal(await page.locator('#bellyGauge').getAttribute('value'),'42');
  assert.equal(await page.locator('#growthGauge').getAttribute('value'),'2');
  await page.reload();assert.equal((await saved()).pet.xp,12);
  assert.equal(await page.locator('#scoreSuccess').isVisible(),false,'reload does not replay growth');
  // Exercise all existing accessories together on the resized cat.
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.points=200;localStorage.setItem(key,JSON.stringify(s));},key);
  await page.reload();await page.locator('#nav-shop').click();await page.locator('[data-tab="dressShop"]').click();
  for(const name of ['ピンクリボン','まるメガネ','あかいぼうし'])await page.locator('[data-dress="'+name+'"]').click();
  await page.locator('#nav-room').click();
  for(const name of ['ピンクリボン','まるメガネ','あかいぼうし']){await page.locator('#roomDressBtn').click();await page.locator('#itemModalBody button').filter({hasText:name}).click();}
  for(const id of ['wearRibbon','wearGlasses','wearHat'])assert.equal(await page.locator('#'+id).isVisible(),true);
  await page.reload();await page.locator('#nav-room').click();
  await page.screenshot({path:path.join(os.tmpdir(),'makopet2-room-dressed.png'),fullPage:true});
  // Threshold transitions, including the adult gauge and continued XP.
  for(const [xp,index,label] of [[29,2,'こねこ'],[59,3,'おとな']]){
    await page.evaluate(({key,xp})=>{const s=JSON.parse(localStorage.getItem(key));s.pet.xp=xp;localStorage.setItem(key,JSON.stringify(s));},{key,xp});
    await page.reload();await openRating(index);await chooseRating(1);
    assert.equal((await saved()).pet.xp,xp+1);
    assert.match(await page.locator('#successGrowth').innerText(),new RegExp('おめでとう！ '+label));
    await page.locator('#nav-room').click();assert.equal(await page.locator('#petStage').innerText(),label);
  }
  assert.equal(await page.locator('#growthGauge').getAttribute('value'),'1');
  assert.equal(await page.locator('#growthGauge').getAttribute('max'),'1');
  // No consumption or XP at full stomach.
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.belly=50;s.food['りんご'].count=1;localStorage.setItem(key,JSON.stringify(s));},key);
  await page.reload();await page.locator('#nav-room').click();await page.locator('#roomFoodBtn').click();
  await page.locator('#itemModalBody button').filter({hasText:'りんご'}).click();
  assert.equal((await saved()).food['りんご'].count,1);assert.equal((await saved()).pet.xp,60);
  await page.locator('#closeItemModal').click();
  for(const width of [320,390,520,844]){
    await page.setViewportSize({width,height:width===844?390:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'room no overflow '+width);
    await page.locator('#roomStudyBtn').scrollIntoViewIfNeeded();
    const boxes=await page.evaluate(()=>({button:document.querySelector('#roomStudyBtn').getBoundingClientRect().bottom,nav:document.querySelector('.bottomNav').getBoundingClientRect().top}));
    assert.ok(boxes.button<=boxes.nav,'study action clears nav '+width);
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('#toast').waitFor({state:'hidden'});
  await page.screenshot({path:path.join(os.tmpdir(),'makopet2-room-adult.png'),fullPage:true});
  await page.screenshot({path:path.join(os.tmpdir(),'makopet2-room-mobile.png')});
  await page.locator('.growthCard').screenshot({path:path.join(os.tmpdir(),'makopet2-growth-gauge.png')});
  // A genuine next local day permits earning again without losing growth.
  const tomorrow=await page.evaluate(()=>Date.now()+86400000);
  await page.clock.install();await page.clock.setFixedTime(new Date(tomorrow));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  assert.equal((await saved()).pet.xp,60);assert.equal((await saved()).today,0);
  await page.locator('#nav-todo').click();await openRating();await chooseRating(1);
  assert.equal((await saved()).pet.xp,61);
  // Failed persistence rolls back XP, fullness, credit ledger and points together.
  const before=await saved();
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('full','QuotaExceededError')}});
  await openRating();await chooseRating(5);
  assert.deepEqual(await saved(),before);
  assert.equal(await page.locator('#scoreSuccess').isVisible(),false);
  await page.locator('#closeScoreModal').click();await page.locator('#nav-room').click();
  assert.equal(await page.locator('#growthTotal').innerText(),'61 EXP');
  console.log('PASS stage 2: egg → baby → kitten → adult, XP high-water tracking, food/fullness, migration, accessories, new day, failed save, room mobile layout.');
};
