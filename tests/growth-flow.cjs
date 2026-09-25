// Real learning operations from 0 to 60 EXP. No direct XP injection.
const assert=require('node:assert/strict');
const path=require('node:path');
const os=require('node:os');
module.exports=async({page,saved,openRating,chooseRating,key,url})=>{
  await page.evaluate(()=>localStorage.clear());await page.goto(url);
  assert.equal(await page.evaluate(()=>typeof window.makopetDev),'undefined');
  assert.equal((await saved()).pet.xp,0);
  async function inspectStage(stage){
    await page.locator('#nav-room').click();
    assert.equal(await page.locator('#roomScene').getAttribute('data-stage'),stage);
    if(stage==='egg'){
      assert.equal(await page.locator('#roomEgg').isVisible(),true);
      assert.equal(await page.locator('#roomCat').isVisible(),false);
    }else{
      assert.equal(await page.locator('#roomEgg').isVisible(),false);
      assert.equal(await page.locator('#adultArtwork').isVisible(),stage==='adult');
      assert.equal(await page.locator('#youngArtwork').isVisible(),stage!=='adult');
      if(stage!=='adult'){
        assert.equal(await page.locator('#roomYoungImage').getAttribute('href'),'./assets/pets/'+stage+'.png');
        assert.equal(await page.locator('#heroYoungImage').getAttribute('href'),'./assets/pets/'+stage+'.png');
        assert.equal(await page.evaluate(async stage=>{const img=new Image();img.src='./assets/pets/'+stage+'.png';await img.decode();return img.naturalWidth>0;},stage),true);
      }
    }
    await page.locator('#scoreSuccess').waitFor({state:'hidden'});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.locator('#roomScene').screenshot({path:path.join(os.tmpdir(),'makopet-growth-'+stage+'.png')});
    const output=path.resolve(__dirname,'../screenshots/growth');require('node:fs').mkdirSync(output,{recursive:true});
    await page.setViewportSize({width:390,height:1040});
    await page.screenshot({path:path.join(output,stage+'.png')});
    await page.setViewportSize({width:390,height:844});
  }
  await page.goto(url+'/?dev=growth');
  await page.evaluate(()=>window.makopetDev.resetGrowth('RESET_GROWTH'));
  await page.goto(url);
  await inspectStage('egg');
  const observed=['egg'];
  for(let day=0;day<2;day++){
    if(day){
      const tomorrow=await page.evaluate(()=>Date.now()+86400000);
      await page.clock.setFixedTime(new Date(tomorrow));
      await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    }
    for(let task=0;task<6;task++){
      await page.locator('#nav-todo').click();await openRating(task);await chooseRating(5);
      const xp=(day*6+task+1)*5;
      assert.equal((await saved()).pet.xp,xp,'learning accumulated '+xp+' EXP');
      const stage=xp<10?'egg':xp<30?'baby':xp<60?'kitten':'adult';
      await page.locator('#nav-room').click();
      assert.equal(await page.locator('#roomScene').getAttribute('data-stage'),stage);
      const lower=xp<10?0:xp<30?10:30,upper=xp<10?10:xp<30?30:60;
      if(stage!=='adult'){
        assert.equal(Number(await page.locator('#growthGauge').getAttribute('value')),xp-lower);
        assert.equal(Number(await page.locator('#growthGauge').getAttribute('max')),upper-lower);
        assert.match(await page.locator('#growthRemaining').innerText(),new RegExp('あと'+(upper-xp)+' EXP'));
      }
      if(observed.at(-1)!==stage){observed.push(stage);await inspectStage(stage)}
    }
  }
  assert.deepEqual(observed,['egg','baby','kitten','adult']);
  await page.reload();assert.equal((await saved()).pet.xp,60,'adult persists');
  // Opt-in console reset: no automatic reset, no change to the other saved fields.
  await page.evaluate(key=>localStorage.removeItem(key+'_growth_reset_backup'),key); // Begin an independent backup/restore scenario.
  const before=await saved();await page.goto(url+'/?dev=growth');
  assert.equal((await saved()).pet.xp,60,'developer URL does not auto-reset');
  assert.equal(await page.evaluate(()=>{try{window.makopetDev.resetGrowth();return false}catch{return true}}),true);
  assert.equal((await saved()).pet.xp,60,'confirmation required');
  await page.evaluate(()=>window.makopetDev.resetGrowth('RESET_GROWTH'));
  let after=await saved();assert.equal(after.pet.xp,0);
  for(const field of ['tasks','points','today','belly','food','dress','equipped','dailyHistory'])assert.deepEqual(after[field],before[field],field+' retained on reset');
  assert.equal(after.pet.name,before.pet.name);
  const backup=await page.evaluate(key=>localStorage.getItem(key+'_growth_reset_backup'),key);
  await page.evaluate(()=>window.makopetDev.resetGrowth('RESET_GROWTH'));
  assert.equal(await page.evaluate(key=>localStorage.getItem(key+'_growth_reset_backup'),key),backup,'repeat reset retains original backup');
  await page.goto(url);assert.equal((await saved()).pet.xp,0,'reset persisted');
  assert.equal(await page.evaluate(()=>typeof window.makopetDev),'undefined','tools absent outside opt-in URL');
  await page.locator('#nav-room').click();assert.equal(await page.locator('#roomEgg').isVisible(),true);
  await page.goto(url+'/?dev=growth');await page.evaluate(()=>window.makopetDev.restoreGrowth('RESTORE_GROWTH'));
  assert.deepEqual((await saved()).pet,before.pet,'growth backup restored');
  // Backup persistence failure must not reset anything.
  await page.evaluate(key=>{localStorage.removeItem(key+'_growth_reset_backup');Storage.prototype.setItem=()=>{throw new Error('blocked')}},key);
  assert.equal(await page.evaluate(()=>{try{window.makopetDev.resetGrowth('RESET_GROWTH');return false}catch{return true}}),true);
  assert.deepEqual(await saved(),before,'failed backup leaves data unchanged');
  console.log('PASS: real learning 0→10→30→60 EXP, distinct stage artwork, gauges, reload, developer reset/restore and backup failure.');
};
