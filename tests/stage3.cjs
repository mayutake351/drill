const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
module.exports=async function({page,saved,key}){
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.points=100;s.belly=20;s.food={};s.dress=[];s.equipped={ribbon:null,glasses:false,hat:false};s.pet.xp=30;localStorage.setItem(key,JSON.stringify(s))},key);
  await page.reload();await page.setViewportSize({width:390,height:844});await page.locator('#nav-shop').click();
  const before=await saved();
  await page.locator('[data-food="りんご"]').click();
  let s=await saved();assert.equal(s.points,95);assert.equal(s.food['りんご'].count,1);assert.equal(s.belly,20);assert.deepEqual(s.pet,before.pet,'buying never feeds or grants XP');
  assert.equal(await page.locator('#shopPoints').innerText(),'95');assert.equal(await page.locator('#purchaseSuccess').isVisible(),true);
  await page.locator('#nav-room').click();await page.locator('#roomFoodBtn').click();await page.locator('#itemModalBody button').filter({hasText:'りんご'}).click();
  s=await saved();assert.equal(s.food['りんご'].count,0);assert.equal(s.belly,30);assert.equal(s.pet.xp,32);
  await page.locator('#nav-shop').click();await page.locator('#dressTab').click();
  await page.locator('[data-dress="ピンクリボン"]').click();
  assert.equal((await saved()).points,80);assert.equal(await page.locator('[data-dress="ピンクリボン"]').isDisabled(),true);
  await page.locator('[data-dress="ピンクリボン"]').dispatchEvent('click');assert.equal((await saved()).points,80);assert.deepEqual((await saved()).dress,['ピンクリボン']);
  await page.locator('#nav-room').click();await page.locator('#roomDressBtn').click();await page.locator('#itemModalBody button').filter({hasText:'ピンクリボン'}).click();
  assert.equal((await saved()).equipped.ribbon,'ピンクリボン');assert.equal(await page.locator('#wearRibbon').isVisible(),true);
  await page.reload();assert.equal((await saved()).equipped.ribbon,'ピンクリボン');
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.points=25;localStorage.setItem(key,JSON.stringify(s))},key);await page.reload();await page.locator('#nav-shop').click();
  assert.equal(await page.locator('[data-food="パンケーキ"]').isDisabled(),true);assert.match(await page.locator('[data-food="パンケーキ"]').innerText(),/あと15pt/);
  const noFunds=await saved();await page.locator('[data-food="パンケーキ"]').dispatchEvent('click');assert.deepEqual(await saved(),noFunds);
  const dir=path.resolve(__dirname,'../screenshots/shop');fs.mkdirSync(dir,{recursive:true});
  await page.setViewportSize({width:390,height:1040});await page.waitForTimeout(3300);
  await page.screenshot({path:path.join(dir,'food.png')});
  await page.locator('#dressTab').click();assert.equal(await page.locator('#dressTab').getAttribute('aria-selected'),'true');
  await page.waitForTimeout(350); // Let tab colors settle before capture.
  await page.screenshot({path:path.join(dir,'dress.png')});
  assert.equal(await page.locator('[data-dress="ピンクリボン"]').innerText(),'✓ もってる');
  assert.match(await page.locator('[data-dress="あかいぼうし"]').innerText(),/あと35pt/);
  for(const width of [320,390,520,844]){
    await page.setViewportSize({width,height:width===844?390:844});
    for(const tab of ['foodTab','dressTab']){
      await page.locator('#'+tab).click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'shop fits '+width);
      assert.equal(await page.locator('.shopPane.active .productBuy').evaluateAll(buttons=>buttons.every(b=>b.getBoundingClientRect().height>=48)),true,'large tap targets');
      const last=page.locator('.shopPane.active .productBuy').last();await last.scrollIntoViewIfNeeded();await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
      assert.equal(await last.evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.bottomNav').getBoundingClientRect().top),true,'bottom item clears nav');
    }
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#foodTab').click();await page.locator('#foodTab').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#dressTab').getAttribute('aria-selected'),'true');await page.keyboard.press('Home');assert.equal(await page.locator('#foodTab').getAttribute('aria-selected'),'true');
  const beforeFailure=await saved();await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError')}});
  await page.locator('[data-food="りんご"]').click();assert.deepEqual(await saved(),beforeFailure);assert.equal(await page.locator('#shopPoints').innerText(),'25');assert.equal(await page.locator('#purchaseSuccess').isVisible(),false);assert.match(await page.locator('#toast').innerText(),/保存できません/);
  await page.reload();await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.points=5;localStorage.setItem(key,JSON.stringify(s))},key);await page.reload();await page.locator('#nav-shop').click();await page.locator('[data-food="りんご"]').click();assert.equal((await saved()).points,0);assert.equal(await page.locator('[data-food="りんご"]').isDisabled(),true);
  console.log('PASS stage3: food purchase/inventory/feed, purchase/equip/reload, insufficient funds, duplicate guard, exact balance, save failure rollback, mobile layout, tab keyboard navigation.');
};
