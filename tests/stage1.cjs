// Run with Node and Playwright installed, or set PLAYWRIGHT_MODULE to its module path.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const key = 'makopet_impl_v10';
const legacy = {
  points: 100, today: 3, goal: 25, belly: 32,
  food: { 'りんご': { count: 2, value: 10 } }, dress: ['ピンクリボン'],
  equipped: { ribbon: 'ピンクリボン', glasses: false, hat: false },
  tasks: [{ id: 1, subject: 'こくご', name: '引き継ぎドリル', now: 3, total: 20, priority: '中', date: '', score: 3 },
    { id: 2, subject: 'さんすう', name: 'つぎのドリル', now: 0, total: 30, priority: '高', date: '', score: 0 }]
};
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1, hasTouch: true });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if(message.type()==='error')errors.push(message.text()); });
    const url = 'http://127.0.0.1:' + server.address().port;
    await page.goto(url);
    await page.evaluate(({ key, legacy }) => localStorage.setItem(key, JSON.stringify(legacy)), { key, legacy });
    await page.reload();
    const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    const openRating = async (index=0) => page.locator('.taskCard').nth(index).click();
    const chooseRating = async n => { await page.locator('#scoreOptions [data-score="'+n+'"]').click(); await page.locator('#confirmScoreBtn').click(); };
    const editTask = async (index=0) => { await openRating(index);await page.locator('#editScoreTaskBtn').click(); };
    let state = await saved();
    assert.equal(state.pet.xp,10,'legacy cat starts as baby without changing existing fields');
    for (const field of Object.keys(legacy)) assert.deepEqual(state[field], legacy[field], 'legacy ' + field);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key+'_before_makopet2')), key), legacy, 'pre-upgrade backup');
    assert.equal(await page.locator('.modal:visible').count(), 0);
    assert.equal(await page.locator('#roomHud').isVisible(), false);
    assert.equal(await page.locator('#heroYoungRibbon').isVisible(), true);
    assert.equal(await page.locator('#heroHat').isVisible(), false);
    await page.screenshot({ path: path.join(os.tmpdir(), 'makopet2-home.png'), fullPage: true });
    assert.equal(await page.locator('#todo [data-score]').count(),0,'ratings absent from normal cards');
    await openRating();
    await page.locator('#scoreOptions [data-score="4"]').click();
    assert.equal((await saved()).points,100,'selecting does not award points');
    await page.locator('#closeScoreModal').click();
    assert.equal((await saved()).tasks[0].score,3,'cancel preserves rating');
    await openRating();await chooseRating(5);
    assert.equal(await page.locator('#scoreModal').isVisible(),false);
    assert.equal(await page.locator('#successPoints').innerText(),'＋2pt');
    assert.equal(await page.locator('#todayPoints').innerText(),'5');
    assert.equal(await page.locator('#pointsTop').innerText(),'102');
    assert.equal((await saved()).points, 102);
    assert.equal((await saved()).pet.xp,12,'migration credits existing score only once');
    await openRating();await chooseRating(5);
    assert.equal((await saved()).points, 102, 'same score is idempotent');
    await editTask();
    assert.equal(await page.locator('#taskEditor').isVisible(), true);
    assert.equal(await page.locator('#todo').evaluate(el => el.inert), true);
    await page.locator('#nowInput').fill('21');
    await page.locator('#saveTaskBtn').click();
    assert.equal(await page.locator('#taskEditor').isVisible(), true, 'invalid progress stays open');
    await page.locator('#nowInput').fill('4');
    await page.locator('#saveTaskBtn').click();
    assert.equal((await saved()).tasks[0].now, 4);
    assert.equal(await page.locator('#taskEditor').isVisible(), false);
    await page.locator('#addMainBtn').click();
    await page.locator('#nameInput').fill('追加のドリル');
    await page.locator('#saveTaskBtn').click();
    assert.equal((await saved()).tasks.length, 3);
    await editTask(2);
    await page.locator('#deleteBtn').click();
    assert.equal((await saved()).tasks.length, 3, 'deletion needs second tap');
    await page.locator('#deleteBtn').click();
    assert.equal((await saved()).tasks.length, 2);
    await page.locator('#nav-shop').click();
    await page.locator('[data-food="りんご"]').click();
    assert.equal((await saved()).food['りんご'].count, 3);
    await page.locator('[data-tab="dressShop"]').click();
    await page.locator('[data-dress="まるメガネ"]').click();
    assert.equal((await saved()).points, 77);
    assert.equal(await page.locator('[data-dress="まるメガネ"]').isDisabled(),true);
    await page.locator('[data-dress="まるメガネ"]').dispatchEvent('click');
    assert.equal((await saved()).points, 77, 'owned item cannot be bought twice');
    await page.locator('#nav-room').click();
    await page.locator('#roomFoodBtn').click();
    await page.locator('#itemModalBody button').filter({ hasText: 'りんご' }).click();
    assert.equal((await saved()).belly, 40); // Learning used 2 fullness; food restored 10.
    await page.locator('#roomDressBtn').click();
    await page.locator('#itemModalBody button').filter({ hasText: 'まるメガネ' }).click();
    assert.equal(await page.locator('#wearGlasses').isVisible(), true);
    await page.reload();
    assert.equal(await page.locator('#heroYoungGlasses').isVisible(), true);
    await page.locator('#nav-book').click();
    assert.equal(await page.locator('#catGrid .catCard').count(),6);
    await page.locator('#nav-todo').click();
    for (const width of [320, 390, 520, 844]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow at ' + width);
      await page.locator('#addMainBtn').click();
      await page.locator('#saveTaskBtn').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#saveTaskBtn').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#taskEditor').isVisible(), false);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const boxes = await page.evaluate(() => ({ last: document.querySelector('.taskCard:last-child').getBoundingClientRect().bottom, nav: document.querySelector('.bottomNav').getBoundingClientRect().top }));
      assert.ok(boxes.last <= boxes.nav, 'last card clears nav at ' + width);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(key => { const s=JSON.parse(localStorage.getItem(key));s.scoreDate='2020-01-01';localStorage.setItem(key,JSON.stringify(s)); }, key);
    await page.reload(); state = await saved();
    assert.equal(state.today, 0); assert.ok(state.tasks.every(t => t.score === 0));
    assert.equal(state.points, 77); assert.equal(state.dailyHistory['2020-01-01'].today, 5);
    await page.evaluate(key => { const s=JSON.parse(localStorage.getItem(key));s.points=0;s.tasks[0].score=5;s.today=5;localStorage.setItem(key,JSON.stringify(s)); }, key);
    await page.reload();
    await openRating();await chooseRating(0);
    assert.equal((await saved()).points, 0);assert.equal((await saved()).tasks[0].score, 5);
    // Fresh install also renders and its hidden dialogs never intercept taps.
    await page.evaluate(() => localStorage.clear());await page.reload();
    assert.equal(await page.locator('.taskCard').count(), 6);
    await page.screenshot({ path: path.join(os.tmpdir(), 'makopet2-fresh.png'), fullPage: true });
    await page.screenshot({path:path.join(os.tmpdir(),'makopet2-compact-mobile.png')});
    const firstAction = await page.locator('.doneAction').first().boundingBox();
    const navigation = await page.locator('.bottomNav').boundingBox();
    assert.ok(firstAction.y+firstAction.height <= navigation.y,'first action visible on initial 390x844 screen');
    await openRating();
    assert.equal(await page.locator('#confirmScoreBtn').isDisabled(),true);
    assert.deepEqual(await page.locator('#scoreOptions button').allTextContents(),['0ptおやすみ','1ptちょっとできた','2ptこつこつできた','3pt目標までできた','4ptもっとできた','5ptとってもがんばった']);
    await page.screenshot({ path: path.join(os.tmpdir(), 'makopet2-rating.png') });
    await chooseRating(3);
    await page.waitForTimeout(350); // Capture the success animation after its entrance.
    await page.screenshot({path:path.join(os.tmpdir(),'makopet2-success.png')});
    await openRating();await chooseRating(1);
    assert.equal((await saved()).points,26,'downgrade applies negative delta');
    assert.equal(await page.locator('#successPoints').innerText(),'-2pt');
    await openRating();await chooseRating(0);
    assert.match(await page.locator('.taskCard').first().innerText(),/おやすみ/);
    for(const width of [320,390,520,844]){
      await page.setViewportSize({width,height:width===844?390:844});
      await openRating();
      assert.equal(await page.locator('#scoreModal .panel').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'rating panel fits '+width);
      await page.locator('#confirmScoreBtn').scrollIntoViewIfNeeded();
      await page.locator('#closeScoreModal').click();
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#addMainBtn').click();
    await page.screenshot({ path: path.join(os.tmpdir(), 'makopet2-modal.png') });
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#saveTaskBtn').evaluate(el=>el===document.activeElement),true,'dialog traps focus');
    await page.locator('#closeTaskEditor').click();
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); }; });
    await openRating();await chooseRating(1);
    assert.equal(await page.locator('#scoreModal').isVisible(),true,'save failure stays in rating panel');
    assert.equal(await page.locator('#scoreSuccess').isVisible(),false,'save failure has no success effect');
    assert.equal((await saved()).points,25,'failed save preserves persistent data');
    assert.match(await page.locator('#toast').innerText(), /保存できません/);
    await page.reload(); // Restore native Storage after failure injection.
    await require('./stage2.cjs')({page,saved,openRating,chooseRating,key});
    await page.reload();
    await require('./growth-flow.cjs')({page,saved,openRating,chooseRating,key,url});
    await page.reload();
    await require('./stage3.cjs')({page,saved,key});
    await page.reload();
    await require('./stage4.cjs')({page,saved,key,openRating,chooseRating});
    await require('./final-flow.cjs')({context,url,key});
    assert.deepEqual(errors, [], 'no uncaught JavaScript errors');
    console.log('PASS: legacy migration, score deltas, CRUD, modal validation, shop, food, outfits, reload, daily rollover, negative balance guard, 4 viewport sizes. JavaScript errors: 0.');
    console.log('Screenshots:', path.join(os.tmpdir(), 'makopet2-fresh.png'));
  } finally { if(browser)await browser.close();server.close(); }
})().catch(error => { console.error(error);process.exitCode=1; });
