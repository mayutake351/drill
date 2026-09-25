const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
module.exports=async function({page,saved,key,openRating,chooseRating}){
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));delete s.collection;delete s.pet.speciesId;delete s.pet.rearingId;s.pet.xp=10;s.pet.learningCredits={};s.tasks.forEach(t=>t.score=0);s.today=0;localStorage.setItem(key,JSON.stringify(s))},key);
  const before=await saved();await page.reload();let s=await saved();
  for(const field of ['points','food','dress','equipped','tasks','belly'])assert.deepEqual(s[field],before[field],'migration preserves '+field);
  assert.equal(s.pet.speciesId,'foodie');assert.equal(s.collection.species.foodie.raisedPetIds.length,1);
  assert.deepEqual(s.collection.species.foodie.seenStages,['egg','baby']);assert.equal(Object.keys(s.collection.species).length,1,'images do not unlock cats');
  await page.setViewportSize({width:390,height:1040});await page.locator('#nav-book').click();
  assert.equal(await page.locator('.catCard').count(),6);assert.equal(await page.locator('.catCard .undiscovered').count(),5);assert.equal(await page.locator('.catCard .undiscovered image').count(),0,'hidden cats have no color art');
  assert.match(await page.locator('[data-cat="foodie"]').innerText(),/あかちゃん/);
  await page.locator('[data-cat="wizard"]').click();assert.equal(await page.locator('#catModal').isVisible(),true);assert.match(await page.locator('#catModalBody').innerText(),/育てると出会えるよ/);assert.equal(await page.locator('#catModal image').count(),0);assert.doesNotMatch(await page.locator('#catModal').innerText(),/まほうつかい/);await page.keyboard.press('Escape');
  await page.locator('[data-cat="foodie"]').click();assert.equal(await page.locator('.catSeenStages .seen').count(),2);assert.equal(await page.locator('.catSeenStages li').count(),4);await page.locator('#closeCatModal').click();
  const dir=path.resolve(__dirname,'../screenshots/collection');fs.mkdirSync(dir,{recursive:true});await page.screenshot({path:path.join(dir,'discovered.png')});
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.pet.xp=59;localStorage.setItem(key,JSON.stringify(s))},key);await page.reload();await openRating();await chooseRating(1);assert.equal((await saved()).pet.xp,60);
  await page.locator('#nav-book').click();assert.match(await page.locator('[data-cat="foodie"]').innerText(),/コンプリート/);assert.equal(await page.locator('#completedCount').innerText(),'1');
  assert.equal((await saved()).collection.species.foodie.completedPetIds.length,1);await page.waitForTimeout(2500);await page.screenshot({path:path.join(dir,'complete.png')});
  await page.locator('[data-cat="foodie"]').click();assert.equal(await page.locator('.catSeenStages .seen').count(),4);assert.match(await page.locator('.catRaisedCount').innerText(),/1回/);await page.screenshot({path:path.join(dir,'detail.png')});await page.keyboard.press('Escape');
  await page.reload();await page.locator('#nav-book').click();assert.match(await page.locator('[data-cat="foodie"]').innerText(),/コンプリート/);assert.equal((await saved()).collection.species.foodie.raisedPetIds.length,1,'reload not new raising');
  for(const width of [320,390,520,844]){await page.setViewportSize({width,height:width===844?390:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('[data-cat="foodie"]').click();assert.equal(await page.locator('#catModal .panel').evaluate(el=>el.scrollWidth<=el.clientWidth),true);await page.keyboard.press('Escape')}
  // A failed growth save must not permanently unlock a stage.
  await page.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));s.pet.xp=59;s.pet.learningCredits={};s.tasks.forEach(t=>t.score=0);s.collection.species.foodie.seenStages=['egg','baby','kitten'];s.collection.species.foodie.completedPetIds=[];localStorage.setItem(key,JSON.stringify(s))},key);await page.reload();
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked')}});await openRating();await chooseRating(1);await page.locator('#closeScoreModal').click();await page.locator('#nav-book').click();assert.doesNotMatch(await page.locator('[data-cat="foodie"]').innerText(),/コンプリート/);assert.equal((await saved()).collection.species.foodie.completedPetIds.length,0);
  console.log('PASS stage4: legacy discovery, five silhouettes, protected hidden detail, observed stages, actual learning to adult completion, persistence, unique raising count, modal/mobile and failed-save rollback.');
};
