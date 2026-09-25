(() => {
'use strict';
const KEY='makopet_impl_v10';
const subjects=['こくご','さんすう','かんじ','けいさん','えいご','そのた'];
const colors={'こくご':'#ef4f90','さんすう':'#3a86e8','かんじ':'#58ad5a','けいさん':'#8751c7','えいご':'#12a9b8','そのた':'#777'};
const ribbonMap={
  'ピンクリボン':'./accessories/ribbon_pink.png',
  '水色リボン':'./accessories/ribbon_blue.png',
  '黄色リボン':'./accessories/ribbon_yellow.png',
  '紫リボン':'./accessories/ribbon_purple.png',
  '緑リボン':'./accessories/ribbon_green.png'
};
const growthStages=[{id:'egg',name:'たまご',xp:0},{id:'baby',name:'あかちゃん',xp:10},{id:'kitten',name:'こねこ',xp:30},{id:'adult',name:'おとな',xp:60}];
// Dedicated drawings and stage-specific face anchors; adult keeps the original art.
const catSprites={
  baby:{src:'./assets/pets/baby.png',width:1182,height:1330,viewBox:'115 120 955 1145',
    clip:'M177 482 Q135 365 147 220 Q148 125 213 137 Q304 157 440 242 Q602 198 742 248 Q896 133 969 142 Q1030 135 1030 239 Q1034 369 1003 477 Q1051 613 1008 714 Q982 791 889 840 L912 880 Q893 812 945 795 Q1011 781 1039 848 Q1078 962 1031 1063 Q1001 1134 927 1167 Q906 1199 861 1208 Q835 1237 777 1231 Q734 1261 672 1244 Q636 1260 580 1243 Q530 1266 462 1245 Q414 1256 380 1228 Q321 1221 304 1191 Q240 1151 248 1093 Q234 1001 287 923 L333 856 Q236 822 194 762 Q151 702 165 586 Z'},
  kitten:{src:'./assets/pets/kitten.png',width:1024,height:1536,viewBox:'100 145 875 1240',
    clip:'M182 449 Q153 358 166 243 Q174 151 225 158 Q293 164 406 284 Q512 257 621 290 Q743 171 805 170 Q857 161 856 251 Q855 369 819 451 Q858 534 835 647 Q817 748 714 785 L748 855 Q785 915 787 978 Q802 912 787 854 Q777 790 828 772 Q889 751 929 804 Q970 873 960 971 Q959 1124 881 1199 L801 1240 Q784 1305 727 1325 Q702 1348 653 1340 Q620 1377 564 1371 L514 1363 Q463 1382 417 1366 Q380 1375 350 1349 Q285 1353 264 1322 Q189 1283 196 1201 Q192 1115 254 1039 L277 905 Q269 828 301 783 Q219 754 185 691 Q157 630 170 547 L157 577 Z'}
};
const defaults={
  pet:{name:'こむぎ',xp:0,learningCredits:{}},
  points:25,today:0,goal:25,belly:32,food:{},dress:[],equipped:{ribbon:null,glasses:false,hat:false},
  tasks:[
    {id:1,subject:'こくご',name:'Z会 エブリスタディ',now:18,total:30,priority:'高',date:'2026-07-31',score:0},
    {id:2,subject:'こくご',name:'読解ドリル',now:5,total:20,priority:'中',date:'2026-07-20',score:0},
    {id:3,subject:'さんすう',name:'算数ラボ',now:12,total:40,priority:'高',date:'2026-07-31',score:0},
    {id:4,subject:'かんじ',name:'漢字ドリル',now:8,total:80,priority:'中',date:'2026-07-31',score:0},
    {id:5,subject:'けいさん',name:'計算ドリル',now:25,total:100,priority:'中',date:'2026-08-10',score:0},
    {id:6,subject:'えいご',name:'キクタンKids',now:5,total:50,priority:'低',date:'2026-08-20',score:0}
  ]
};
let petMigrationPending=false;
let collectionMigrationPending=false;
let state=prepareCollection(load());
let timer=null;
let scoreTaskId=null;
let pendingScore=null;
let scoreOpenedDate=null;
let successTimer=null;
let modalTrigger=null;
let lockedScroll=0;
let storageWarning=false;
const scoreLabels=['おやすみ','ちょっとできた','こつこつできた','目標までできた','もっとできた','とってもがんばった'];
function clone(o){return JSON.parse(JSON.stringify(o))}
function load(){
  try{
    const raw=localStorage.getItem(KEY);if(!raw)return clone(defaults);
    // Keep the pre-upgrade JSON before adding date metadata or normalizing fields.
    try{if(!localStorage.getItem(KEY+'_before_makopet2'))localStorage.setItem(KEY+'_before_makopet2',raw)}catch(e){/* Loading existing data still works when storage is full. */}
    const x=JSON.parse(raw);if(!x||typeof x!=='object'||!Array.isArray(x.tasks))return clone(defaults);
    const merged={...clone(defaults),...x,equipped:{...defaults.equipped,...x.equipped}};
    ['points','today','goal','belly'].forEach(k=>{if(!Number.isFinite(merged[k]))merged[k]=defaults[k]});
    if(merged.goal<=0)merged.goal=defaults.goal;
    if(!Array.isArray(merged.dress))merged.dress=[];
    if(!merged.food||typeof merged.food!=='object'||Array.isArray(merged.food))merged.food={};
    merged.tasks=merged.tasks.filter(t=>t&&typeof t==='object').map((t,i)=>({
      ...t,id:t.id??('legacy-'+i),subject:subjects.includes(t.subject)?t.subject:'そのた',
      name:String(t.name||'新しいドリル'),now:Math.max(0,Number(t.now)||0),total:Math.max(1,Number(t.total)||1),
      score:Math.max(0,Math.min(5,Math.round(Number(t.score)||0)))
    }));
    if(!x.pet){
      merged.pet={name:'こむぎ',xp:10,learningCredits:{}};
      // Existing cats stay hatched; past scores are not awarded twice on migration.
      merged.tasks.forEach(t=>merged.pet.learningCredits[(merged.scoreDate||localDate())+':'+t.id]=t.score);
      petMigrationPending=true;
    }else{
      merged.pet={...x.pet,name:typeof x.pet.name==='string'&&x.pet.name.trim()?x.pet.name.slice(0,20):'こむぎ',xp:Number.isFinite(x.pet.xp)?Math.max(0,Math.floor(x.pet.xp)):0,
        learningCredits:x.pet.learningCredits&&typeof x.pet.learningCredits==='object'&&!Array.isArray(x.pet.learningCredits)?x.pet.learningCredits:{}};
    }
    return merged;
  }catch(e){return clone(defaults)}
}
function prepareCollection(data){
  const before=JSON.stringify(data);
  // All pre-collection saves had one cream cat. Preserve unknown future species IDs.
  data.pet.speciesId??='foodie';data.pet.rearingId??='first-pet';
  const existing=data.collection&&typeof data.collection==='object'&&!Array.isArray(data.collection)?data.collection:{};
  data.collection={...existing,version:1};
  ['species','rareColors','specialOutfits'].forEach(key=>{if(!data.collection[key]||typeof data.collection[key]!=='object'||Array.isArray(data.collection[key]))data.collection[key]={}});
  recordCurrentCat(data);
  collectionMigrationPending=before!==JSON.stringify(data);return data;
}
function recordCurrentCat(data){
  if(!window.MAKOPET_CATS.some(cat=>cat.id===data.pet.speciesId))return;
  const id=data.pet.speciesId,previous=data.collection.species[id]||{};
  const record={...previous};
  ['seenStages','raisedPetIds','completedPetIds'].forEach(key=>record[key]=Array.isArray(previous[key])?[...previous[key]]:[]);
  const petId=data.pet.rearingId;
  if(!record.raisedPetIds.includes(petId))record.raisedPetIds.push(petId);
  growthStages.filter(stage=>data.pet.xp>=stage.xp).forEach(stage=>{if(!record.seenStages.includes(stage.id))record.seenStages.push(stage.id)});
  if(data.pet.xp>=60&&!record.completedPetIds.includes(petId))record.completedPetIds.push(petId);
  record.lastPetName=data.pet.name;data.collection.species[id]=record;
}
function save(){
  const previous=clone(state.collection);recordCurrentCat(state);
  try{localStorage.setItem(KEY,JSON.stringify(state));storageWarning=false;return true}
  catch(e){state.collection=previous;storageWarning=true;toast('保存できませんでした。ブラウザーの保存設定を確認してね');return false}
}
function catPicture(cat,discovered){
  const box=document.createElement('div');box.className='catPicture'+(discovered?'':' undiscovered');
  // SVG viewBox displays only the existing illustration, without editing the source PNG.
  box.innerHTML=discovered?'<svg viewBox="'+cat.viewBox+'" aria-hidden="true"><image href="./book.png" width="1402" height="1122"/></svg>':'<svg viewBox="0 0 160 130" aria-hidden="true"><path d="M40 66 L33 22 Q34 15 55 35 Q78 26 99 35 Q121 15 122 25 L117 67 Q129 91 116 106 Q143 106 135 77 Q135 65 145 70 Q162 116 116 121 L47 121 Q21 118 33 93Z"/><text x="78" y="85" text-anchor="middle">?</text></svg>';
  return box;
}
function renderCollection(){
  const grid=$('catGrid');grid.replaceChildren();let found=0,complete=0;
  window.MAKOPET_CATS.forEach((cat,index)=>{
    const record=state.collection.species[cat.id],discovered=!!record?.raisedPetIds?.length,completed=discovered&&record.seenStages.includes('adult');
    if(discovered)found++;if(completed)complete++;
    const button=document.createElement('button');button.className='catCard'+(completed?' complete':'');button.dataset.cat=cat.id;
    const number=document.createElement('span');number.className='catNumber';number.textContent='No. '+String(index+1).padStart(2,'0');
    const name=document.createElement('strong');name.textContent=discovered?cat.name:'？？？';
    const status=document.createElement('span');status.className='catStatus';
    const highest=discovered?[...growthStages].reverse().find(stage=>record.seenStages.includes(stage.id)):null;
    status.textContent=completed?'✦ コンプリート':highest?highest.name+'まで育ったよ':'まだ出会っていないよ';
    button.append(number,catPicture(cat,discovered),name,status);button.onclick=()=>openCatDetails(cat.id);grid.append(button);
  });
  $('discoveredCount').textContent=found+' / '+window.MAKOPET_CATS.length;$('completedCount').textContent=complete;
}
function openCatDetails(id){
  const cat=window.MAKOPET_CATS.find(cat=>cat.id===id);if(!cat)return;
  const record=state.collection.species[id],discovered=!!record?.raisedPetIds?.length;
  $('catModalTitle').textContent=discovered?cat.name:'まだ見ぬねこ';
  const body=$('catModalBody');body.replaceChildren(catPicture(cat,discovered));
  const intro=document.createElement('p');intro.className='catDetailIntro';intro.textContent=discovered?'いっしょに育った「'+record.lastPetName+'」':'育てると出会えるよ';body.append(intro);
  if(discovered){
    const count=document.createElement('p');count.className='catRaisedCount';count.textContent='育成した回数：'+record.raisedPetIds.length+'回';body.append(count);
    const title=document.createElement('h3');title.textContent='これまでに見た成長';body.append(title);
    const steps=document.createElement('ol');steps.className='catSeenStages';
    growthStages.forEach(stage=>{const seen=record.seenStages.includes(stage.id);const li=document.createElement('li');li.className=seen?'seen':'';li.textContent=(seen?'✓ ':'？ ')+stage.name;const label=document.createElement('small');label.textContent=seen?'出会ったよ':'これから';li.append(label);steps.append(li)});body.append(steps);
    if(record.seenStages.includes('adult')){const badge=document.createElement('p');badge.className='catComplete';badge.textContent='✦ コンプリート！おとなまで育ったね';body.append(badge)}
  }
  openDialog('catModal');
}
function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function checkDay(){
  const today=localDate();
  // Old saves have no date: keep their scores and points on the first migration day.
  if(!state.scoreDate){state.scoreDate=today;save();return false}
  if(state.scoreDate===today)return false;
  if(!state.dailyHistory||typeof state.dailyHistory!=='object')state.dailyHistory={};
  state.dailyHistory[state.scoreDate]={today:state.today,tasks:clone(state.tasks)};
  state.today=0;state.tasks.forEach(t=>t.score=0);state.scoreDate=today;save();return true;
}
function $(id){return document.getElementById(id)}
function toast(msg){const t=$('toast');t.textContent=storageWarning?'保存できませんでした。この画面を閉じずに保存設定を確認してね':msg;t.classList.remove('hidden');clearTimeout(timer);timer=setTimeout(()=>t.classList.add('hidden'),storageWarning?8000:3200)}
function updateHud(){
  renderShopOwned();
  $('pointsTop').textContent=state.points;$('pointsHud').textContent=state.points;$('shopPoints').textContent=state.points;
  $('todayPoints').textContent=state.today;$('dailyGoal').textContent=state.goal;$('bellyHud').textContent=state.belly;
  renderGrowth();
  $('dailyProgress').max=state.goal;$('dailyProgress').value=Math.max(0,state.today);
  const done=state.tasks.filter(t=>t.score>0).length;
  $('petSpeech').textContent=state.today>=state.goal?'今日の目標、できたね！ありがとう♡':done?'がんばったね！会えてうれしいな。':'今日もいっしょに、がんばろう！';
}
function stageIndex(){let i=0;growthStages.forEach((stage,index)=>{if(state.pet.xp>=stage.xp)i=index});return i}
function renderGrowth(){
  const index=stageIndex(),stage=growthStages[index],next=growthStages[index+1];
  $('petName').textContent=state.pet.name;$('petStage').textContent=stage.name;
  $('roomScene').dataset.stage=stage.id;
  renderCatArtwork(stage.id);
  $('heroEggScene').classList.toggle('hidden',index!==0);document.querySelector('.heroScene').classList.toggle('hidden',index!==3);$('heroYoungScene').classList.toggle('hidden',index===0||index===3);
  $('heroPortrait').setAttribute('aria-label',state.pet.name+'、'+stage.name);
  $('roomScene').setAttribute('aria-label',state.pet.name+'、'+stage.name+'のおへや');
  $('roomCat').classList.toggle('hidden',index===0);$('roomEgg').classList.toggle('hidden',index!==0);
  $('bellyGauge').value=Math.max(0,Math.min(50,state.belly));
  $('bellyMood').textContent=state.belly>=40?'♥ おなかいっぱい':state.belly>=20?'♡ ごきげん':'🍚 おなかすいたね';
  $('bellyMessage').textContent=index===0?'たまごは、お勉強のがんばりで育つよ。':state.belly>=50?'まんぷく！またお勉強して遊ぼう。':'ごはんを食べると、成長経験値も＋2。';
  $('roomSpeech').textContent=index===0?'きみのがんばりで、もうすぐ会えるね。':state.belly>=40?'おなかいっぱい。ありがとう♡':state.belly<20?'いっしょに、ごはんにしよう♪':'会いにきてくれて、うれしいな。';
  $('growthTotal').textContent=state.pet.xp+' EXP';
  $('growthRemaining').textContent=next?'次の成長（'+next.name+'）まで あと'+(next.xp-state.pet.xp)+' EXP':'おとなになったよ！これからもいっしょ。';
  $('growthGauge').max=next?next.xp-stage.xp:1;$('growthGauge').value=next?state.pet.xp-stage.xp:1;
  $('growthGauge').setAttribute('aria-valuetext',next?next.name+'まであと'+(next.xp-state.pet.xp)+'経験値':'おとなに成長しました');
  document.querySelectorAll('#growthSteps li').forEach((el,i)=>{el.classList.toggle('reached',i<=index);if(i===index)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});
}
function renderCatArtwork(stage){
  $('roomCat').dataset.stage=stage;
  const sprite=catSprites[stage];
  $('adultArtwork').classList.toggle('hidden',!!sprite);
  $('youngArtwork').classList.toggle('hidden',!sprite);
  if(!sprite)return;
  ['room','hero'].forEach(prefix=>{
    const svg=$(prefix==='room'?'youngArtwork':'heroYoungArtwork');
    if(svg.dataset.sprite===stage)return;
    svg.dataset.sprite=stage;svg.setAttribute('viewBox',sprite.viewBox);
    $(prefix+'YoungClip').setAttribute('d',sprite.clip);
    $(prefix+'YoungCut').setAttribute('d',stage==='baby'?'M815 867 Q858 935 871 997 L916 996 Q895 879 930 810 L880 835 Z':'M694 788 Q709 858 735 971 L753 1045 L798 955 Q785 855 820 780 Z');
    const img=$(prefix+'YoungImage');img.setAttribute('href',sprite.src);img.setAttribute('width',sprite.width);img.setAttribute('height',sprite.height);
  });
  $('heroYoungCat').dataset.stage=stage;
}
function earnedLearningXp(id,n){const value=state.pet.learningCredits[state.scoreDate+':'+id];const credited=Number.isFinite(value)?value:0;return Math.max(0,n-credited)}
function showPage(id){
  if(checkDay())renderTasks();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');
  document.querySelectorAll('.bottomNav button').forEach(b=>b.classList.remove('on'));$('nav-'+id).classList.add('on');
  document.querySelectorAll('.bottomNav button').forEach(b=>{if(b.dataset.page===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  window.scrollTo(0,0);
  updateHud();if(id==='room')renderEquipped();if(id==='shop')renderShopOwned();if(id==='book')renderCollection();
}
function renderTasks(){
  const box=$('taskList');box.innerHTML='';
  $('taskGuide').textContent=!state.tasks.length?'最初の教材を追加して、はじめよう。':'できたら「できた！」で、猫におしえてね。';
  state.tasks.forEach(t=>box.appendChild(taskCard(t)));
  if(!state.tasks.length){const empty=document.createElement('div');empty.className='emptyTasks';empty.textContent='📚 いっしょに、なにをやってみる？';box.appendChild(empty)}
  updateHud();
}
function taskCard(t){
  const pct=Math.max(0,Math.min(100,Math.round(t.now/t.total*100)));
  const recorded=t.score>0||t.ratedDate===state.scoreDate;
  const card=document.createElement('button');card.type='button';card.className='taskCard'+(t.score>0?' completed':'');
  card.dataset.taskId=String(t.id);card.setAttribute('aria-haspopup','dialog');
  card.setAttribute('aria-label',t.subject+'、'+t.name+'、'+t.now+'/'+t.total+'ページ。今日：'+(recorded?scoreLabels[t.score]+'、'+t.score+'pt':'これから')+'。評価を選ぶ');
  card.innerHTML='<span class="compactMain"><span class="subjectChip"></span><strong class="taskName"></strong><span class="progress" aria-hidden="true"><span></span></span><span class="taskStatus"></span></span><span class="doneAction" aria-hidden="true"></span>';
  card.querySelector('.subjectChip').textContent=t.subject;
  card.querySelector('.subjectChip').style.color=colors[t.subject];
  card.querySelector('.taskName').textContent=t.name;
  card.querySelector('.progress span').style.width=pct+'%';
  card.querySelector('.taskStatus').textContent=recorded?(t.score>0?'✓ ':'☾ ')+scoreLabels[t.score]+' · '+t.score+'pt':'今日：これから';
  card.querySelector('.doneAction').textContent=recorded?'えらび直す':'できた！';
  card.onclick=()=>openScorePanel(t.id);return card;
}
function openScorePanel(id){
  if(checkDay())renderTasks();
  const t=state.tasks.find(x=>x.id===id);if(!t)return;
  scoreTaskId=id;scoreOpenedDate=state.scoreDate;
  pendingScore=t.score>0||t.ratedDate===state.scoreDate?t.score:null;
  $('scoreTaskName').textContent=t.subject+' · '+t.name;
  const options=$('scoreOptions');options.innerHTML='';
  scoreLabels.forEach((label,n)=>{
    const b=document.createElement('button');b.type='button';b.dataset.score=n;
    b.innerHTML='<b>'+n+'pt</b><span></span>';b.querySelector('span').textContent=label;
    b.onclick=()=>{pendingScore=n;renderScoreSelection()};options.appendChild(b);
  });
  renderScoreSelection();clearTimeout(successTimer);$('scoreSuccess').classList.add('hidden');openDialog('scoreModal');
}
function renderScoreSelection(){
  const t=state.tasks.find(x=>x.id===scoreTaskId);if(!t)return;
  document.querySelectorAll('#scoreOptions button').forEach(b=>{const selected=Number(b.dataset.score)===pendingScore;b.classList.toggle('on',selected);b.setAttribute('aria-pressed',String(selected))});
  $('confirmScoreBtn').disabled=pendingScore===null;
  const delta=pendingScore===null?0:pendingScore-(t.score||0);
  $('scorePreview').textContent=pendingScore===null?'ぴったりのがんばりを、えらんでね。':delta>0?'⭐ '+delta+'pt もらえるよ！':delta<0?'えらび直すと '+Math.abs(delta)+'pt 減るよ。':pendingScore===0?'おやすみも、だいじ。今日は0pt。':'今日は '+pendingScore+'pt。追加のポイントはないよ。';
}
function celebrate(delta,n,xp=0,previousStage=stageIndex()){
  clearTimeout(successTimer);
  $('successPoints').textContent=delta>0?'＋'+delta+'pt':delta<0?delta+'pt':'今日は '+n+'pt';
  $('successMessage').textContent=delta>0?'がんばったね！ありがとう♡':n===0?'おやすみも、だいじだよ。':'今日のがんばりを記録したよ';
  const grown=stageIndex()>previousStage;
  $('successGrowth').classList.toggle('hidden',!xp);
  $('successGrowth').textContent=grown?'おめでとう！ '+growthStages[stageIndex()].name+'に成長したよ ✨':'🌱 成長経験値 ＋'+xp+' EXP';
  const el=$('scoreSuccess');el.classList.add('hidden');void el.offsetWidth;el.classList.remove('hidden');
  successTimer=setTimeout(()=>el.classList.add('hidden'),2200);
}
function setScore(id,n){
  if(checkDay()||scoreOpenedDate!==state.scoreDate){renderTasks();closeDialog('scoreModal');toast('新しい日になったよ。今日のがんばりを選んでね');return}
  const t=state.tasks.find(x=>x.id===id);if(!t||!Number.isInteger(n)||n<0||n>5)return;
  const old=t.score||0;
  if(n<old&&state.points+n-old<0){toast('使ったポイントがあるので、ここまでは減らせないよ');return}
  const oldRatedDate=t.ratedDate,oldPet=clone(state.pet),oldBelly=state.belly,previousStage=stageIndex();
  const xp=earnedLearningXp(id,n);
  state.pet.xp+=xp;
  state.pet.learningCredits[state.scoreDate+':'+id]=Math.max(n,Number(state.pet.learningCredits[state.scoreDate+':'+id])||0);
  if(previousStage>0)state.belly=Math.max(0,state.belly-xp);
  state.points+=n-old;state.today+=n-old;t.score=n;t.ratedDate=state.scoreDate;
  if(!save()){
    state.points-=n-old;state.today-=n-old;t.score=old;state.pet=oldPet;state.belly=oldBelly;
    if(oldRatedDate===undefined)delete t.ratedDate;else t.ratedDate=oldRatedDate;
    return;
  }
  renderTasks();closeDialog('scoreModal');
  const current=Array.from(document.querySelectorAll('.taskCard')).find(el=>el.dataset.taskId===String(id));
  current?.focus({preventScroll:true});celebrate(n-old,n,xp,previousStage);
}
function openTaskEditor(subject='こくご',id=''){const t=id!==''?state.tasks.find(x=>x.id===id):null;$('editId').value=t?t.id:'';$('editorTitle').textContent=t?'教材を編集':'教材を追加';$('deleteBtn').classList.toggle('hidden',!t);$('deleteBtn').textContent='削除';$('deleteBtn').dataset.confirm='';$('subjectInput').value=t?t.subject:subject;$('nameInput').value=t?t.name:'';$('nowInput').value=t?t.now:0;$('totalInput').value=t?t.total:30;$('priorityInput').value=t?t.priority:'中';$('dateInput').value=t?t.date:'';openDialog('taskEditor')}
function closeTaskEditor(){closeDialog('taskEditor')}
function saveTask(){
  checkDay();
  const now=Number($('nowInput').value),total=Number($('totalInput').value);
  if(!Number.isInteger(now)||!Number.isInteger(total)||now<0||total<1||now>total){toast('ページは0以上の整数で、ぜんぶのページ以下にしてね');$('nowInput').focus();return}
  const previousTasks=clone(state.tasks);
  const id=$('editId').value;const data={subject:$('subjectInput').value,name:$('nameInput').value.trim()||'新しいドリル',now,total,priority:$('priorityInput').value,date:$('dateInput').value,score:0};
  if(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(t){data.score=t.score||0;Object.assign(t,data)}}
  else{data.id=Date.now();state.tasks.push(data)}
  if(!save()){state.tasks=previousTasks;return}
  renderTasks();closeTaskEditor();toast('保存したよ');
}
function deleteTask(){
  if($('deleteBtn').dataset.confirm!=='yes'){$('deleteBtn').dataset.confirm='yes';$('deleteBtn').textContent='もう一度押すと削除します';return}
  const id=$('editId').value,previousTasks=clone(state.tasks);state.tasks=state.tasks.filter(t=>String(t.id)!==String(id));if(!save()){state.tasks=previousTasks;return}renderTasks();closeTaskEditor();toast('教材を削除したよ。獲得したポイントは残るよ');
}
// Rendering and purchasing share one catalog, so displayed and charged prices agree.
let purchaseTimer=null;
function renderShop(){
  window.MAKOPET_CATALOG.forEach(product=>{
    const card=document.createElement('article');card.className='shopCard';card.dataset.product=product.id;
    const artwork=document.createElement('div');artwork.className='productArt';
    const img=document.createElement('img');img.src=product.image;img.alt='';artwork.append(img);
    const title=document.createElement('h2');title.textContent=product.name;
    const detail=document.createElement('p');detail.className='productDetail';detail.textContent=product.kind==='consumable'?'おなか +'+product.belly:'ずっと使えるおしゃれ';
    const price=document.createElement('p');price.className='productPrice';price.textContent='★ '+product.price+'pt';
    const status=document.createElement('p');status.className='productStatus';
    const buy=document.createElement('button');buy.className='productBuy';buy.dataset[product.category==='food'?'food':'dress']=product.storageKey;buy.onclick=()=>buyProduct(product.id);
    card.append(artwork,title,detail,price,status,buy);$(product.category==='food'?'foodProducts':'dressProducts').append(card);
  });
}
function ownsProduct(product){return product.inventory==='dress'?state.dress.includes(product.storageKey):!!state.items?.[product.id]}
function renderShopOwned(){
  window.MAKOPET_CATALOG.forEach(product=>{
    const card=document.querySelector('[data-product="'+product.id+'"]');if(!card)return;
    const owned=product.unique&&ownsProduct(product),missing=Math.max(0,product.price-state.points);
    const button=card.querySelector('button');button.disabled=owned||missing>0;
    button.textContent=owned?'✓ もってる':missing?'あと'+missing+'pt':'買う';
    button.setAttribute('aria-label',product.name+'、'+(owned?'もってる':missing?'あと'+missing+'pt':product.price+'ptで買う'));
    card.classList.toggle('owned',owned);card.classList.toggle('unaffordable',!owned&&missing>0);
    card.querySelector('.productStatus').textContent=owned?'おへやで着せてね':product.inventory==='food'?'もちもの：'+(state.food[product.storageKey]?.count||0)+'こ':missing?'ためるのが楽しみ♪':'ねこにプレゼント♡';
  });
}
function buyProduct(id){
  const product=window.MAKOPET_CATALOG.find(item=>item.id===id);if(!product)return;
  if(product.unique&&ownsProduct(product)){toast('もう持っているよ');return}
  if(state.points<product.price){toast('あと'+(product.price-state.points)+'ptためよう♪');return}
  const previous=clone(state);
  state.points-=product.price;
  if(product.inventory==='food'){
    if(!state.food[product.storageKey])state.food[product.storageKey]={count:0,value:product.belly};
    state.food[product.storageKey].count++;
  }else if(product.inventory==='dress')state.dress.push(product.storageKey);
  else{state.items??={};state.items[product.id]=(state.items[product.id]||0)+1}
  if(!save()){state=previous;updateHud();return}
  updateHud();
  clearTimeout(purchaseTimer);$('purchaseTitle').textContent=product.name+'を買ったよ！';
  $('purchaseMessage').textContent='−'+product.price+'pt · もちものに入ったよ♡';
  $('purchaseSuccess').classList.remove('hidden');
  purchaseTimer=setTimeout(()=>$('purchaseSuccess').classList.add('hidden'),2200);
}
function selectShopTab(id){
  document.querySelectorAll('.shopTabs button').forEach(button=>{
    const selected=button.dataset.tab===id;button.classList.toggle('active',selected);
    button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
  });
  document.querySelectorAll('.shopPane').forEach(pane=>pane.classList.toggle('active',pane.id===id));
}
function openInventory(type){
  if(stageIndex()===0){toast(type==='food'?'たまごはお勉強で育つよ。ごはんは生まれてから♪':'生まれたら、お気に入りを着せてあげよう！');return}
  const body=$('itemModalBody'),title=$('itemModalTitle');body.innerHTML='';
  if(type==='food'){
    title.textContent='ごはんをあげる';const items=Object.entries(state.food).filter(([,x])=>x.count>0);
    if(!items.length){const b=document.createElement('button');b.textContent='ショップで買う';b.onclick=()=>{closeModal();selectShopTab(type==='food'?'foodShop':'dressShop');showPage('shop')};body.appendChild(b)}
    else items.forEach(([name,it])=>{const b=document.createElement('button');b.innerHTML=name+'<span>×'+it.count+' / おなか +'+it.value+' / 成長 +2 EXP</span>';b.onclick=()=>useFood(name);body.appendChild(b)});
  }else{
    title.textContent='きせかえ';
    const owned=state.dress;
    const remove=document.createElement('button');remove.innerHTML='はずす<span>全部はずす</span>';remove.onclick=()=>{const previous=clone(state.equipped);state.equipped={ribbon:null,glasses:false,hat:false};if(!save()){state.equipped=previous;return}renderEquipped();closeModal();toast('はずしたよ')};body.appendChild(remove);
    if(!owned.length){const b=document.createElement('button');b.textContent='ショップで買う';b.onclick=()=>{closeModal();selectShopTab(type==='food'?'foodShop':'dressShop');showPage('shop')};body.appendChild(b)}
    owned.forEach(name=>{const b=document.createElement('button');const active=isEquipped(name);b.innerHTML=name+'<span>'+(active?'はずす':'つける')+'</span>';b.onclick=()=>toggleEquip(name);body.appendChild(b)});
  }
  openDialog('itemModal');
}
function isEquipped(name){if(ribbonMap[name])return state.equipped.ribbon===name;if(name==='まるメガネ')return !!state.equipped.glasses;if(name==='あかいぼうし')return !!state.equipped.hat;return false}
function toggleEquip(name){
  const previous=clone(state.equipped);
  if(ribbonMap[name])state.equipped.ribbon=state.equipped.ribbon===name?null:name;
  else if(name==='まるメガネ')state.equipped.glasses=!state.equipped.glasses;
  else if(name==='あかいぼうし')state.equipped.hat=!state.equipped.hat;
  if(!save()){state.equipped=previous;return}
  renderEquipped();closeModal();toast(isEquipped(name)?name+'をつけたよ':name+'をはずしたよ');
}
function renderEquipped(){
  const rib=$('wearRibbon');if(state.equipped.ribbon){rib.src=ribbonMap[state.equipped.ribbon];rib.classList.remove('hidden')}else rib.classList.add('hidden');
  $('wearGlasses').classList.toggle('hidden',!state.equipped.glasses);
  $('wearHat').classList.toggle('hidden',!state.equipped.hat);
  ['Ribbon','Glasses','Hat'].forEach(part=>{const source=$('wear'+part);[$('hero'+part),$('heroYoung'+part)].forEach(target=>{if(source.getAttribute('src'))target.src=source.src;target.classList.toggle('hidden',source.classList.contains('hidden'))})});
}
function useFood(name){
  const it=state.food[name];if(!it||it.count<=0||stageIndex()===0)return;
  if(state.belly>=50){toast('いまはおなかいっぱい。ごはんはとっておこうね');return}
  const oldBelly=state.belly,oldXp=state.pet.xp,previousStage=stageIndex();
  it.count--;state.belly=Math.min(50,state.belly+it.value);state.pet.xp+=2;
  if(!save()){it.count++;state.belly=oldBelly;state.pet.xp=oldXp;return}
  updateHud();closeModal();celebrate(0,0,2,previousStage);
  $('successPoints').textContent='おいしいね！';$('successMessage').textContent=name+'で、おなかもにっこり♡';
}
function closeModal(){closeDialog('itemModal')}
function openDialog(id){
  modalTrigger=document.activeElement;lockedScroll=window.scrollY;
  document.body.style.top=-lockedScroll+'px';document.body.classList.add('modalOpen');
  document.querySelectorAll('.page,.bottomNav').forEach(el=>el.inert=true);
  $(id).classList.remove('hidden');$(id).querySelector('.panel').scrollTop=0;
  $(id).querySelector('.close').focus({preventScroll:true});
}
function closeDialog(id){
  $(id).classList.add('hidden');document.body.classList.remove('modalOpen');document.body.style.top='';
  document.querySelectorAll('.page,.bottomNav').forEach(el=>el.inert=false);
  window.scrollTo(0,lockedScroll);
  if(modalTrigger?.isConnected)modalTrigger.focus({preventScroll:true});else $('addMainBtn').focus({preventScroll:true});
}
function syncVisibleViewport(){
  const viewport=window.visualViewport;
  document.documentElement.style.setProperty('--visual-height',(viewport?.height||innerHeight)+'px');
  document.documentElement.style.setProperty('--visual-top',(viewport?.offsetTop||0)+'px');
  const focused=document.activeElement;
  if(focused?.matches('input,select')&&focused.closest('.modal:not(.hidden)'))requestAnimationFrame(()=>focused.scrollIntoView({block:'nearest'}));
}
function bind(){
  syncVisibleViewport();window.visualViewport?.addEventListener('resize',syncVisibleViewport);
  window.visualViewport?.addEventListener('scroll',syncVisibleViewport);window.addEventListener('resize',syncVisibleViewport);
  document.addEventListener('focusin',event=>{if(event.target.matches('input,select'))syncVisibleViewport()});
  $('closeCatModal').onclick=()=>closeDialog('catModal');
  $('roomStudyBtn').onclick=()=>showPage('todo');
  $('closeScoreModal').onclick=()=>closeDialog('scoreModal');
  $('confirmScoreBtn').onclick=()=>setScore(scoreTaskId,pendingScore);
  $('editScoreTaskBtn').onclick=()=>{
    const t=state.tasks.find(x=>x.id===scoreTaskId);if(!t)return;
    closeDialog('scoreModal');openTaskEditor(t.subject,t.id);
  };
  document.querySelectorAll('.modal').forEach(modal=>{
    modal.addEventListener('click',e=>{if(e.target===modal)closeDialog(modal.id)});
    modal.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();closeDialog(modal.id)}
      if(e.key==='Tab'){
        const els=Array.from(modal.querySelectorAll('button,input,select,[tabindex="0"]')).filter(el=>!el.disabled&&el.getClientRects().length);
        const first=els[0],last=els[els.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    });
  });
  window.addEventListener('focus',()=>{if(checkDay())renderTasks()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&checkDay())renderTasks()});
  setInterval(()=>{if(!document.hidden&&checkDay())renderTasks()},60000);
  document.querySelectorAll('.bottomNav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $('addMainBtn').onclick=()=>openTaskEditor('こくご');$('closeTaskEditor').onclick=closeTaskEditor;$('saveTaskBtn').onclick=saveTask;$('deleteBtn').onclick=deleteTask;
  $('closeItemModal').onclick=closeModal;$('roomFoodBtn').onclick=()=>openInventory('food');$('roomDressBtn').onclick=()=>openInventory('dress');
  document.querySelectorAll('.shopTabs button').forEach(button=>{
    button.onclick=()=>selectShopTab(button.dataset.tab);
    button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...document.querySelectorAll('.shopTabs button')];const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs[1]:tabs.find(tab=>tab!==button);selectShopTab(next.dataset.tab);next.focus()};
  });

}
// Deliberately absent from normal URLs. No visible reset control or automatic reset.
if(new URLSearchParams(location.search).get('dev')==='growth'){
  const backupKey=KEY+'_growth_reset_backup';
  function refreshDevGrowth(){
    clearTimeout(successTimer);$('scoreSuccess').classList.add('hidden');
    document.querySelectorAll('.modal:not(.hidden)').forEach(el=>closeDialog(el.id));
    renderTasks();renderEquipped();showPage('room');
  }
  window.makopetDev=Object.freeze({
    resetGrowth(confirmation){
      if(confirmation!=='RESET_GROWTH')throw new Error('確認文字列 RESET_GROWTH が必要です。教材・ポイント・所持品は残ります。');
      const original=clone(state.pet);
      try{
        // Keep the first pre-reset snapshot so repeated resets cannot destroy it.
        if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,JSON.stringify({version:1,savedAt:new Date().toISOString(),pet:original}));
      }catch(e){throw new Error('バックアップを保存できないためリセットしませんでした。')}
      state.pet={...state.pet,xp:0,learningCredits:{}};
      if(!save()){state.pet=original;throw new Error('保存できないためリセットしませんでした。')}
      refreshDevGrowth();return {stage:'egg',xp:0,backupKey};
    },
    restoreGrowth(confirmation){
      if(confirmation!=='RESTORE_GROWTH')throw new Error('確認文字列 RESTORE_GROWTH が必要です。');
      const backup=JSON.parse(localStorage.getItem(backupKey)||'null');
      if(!backup?.pet||!Number.isFinite(backup.pet.xp)||backup.pet.xp<0)throw new Error('有効な成長バックアップがありません。');
      const original=clone(state.pet);state.pet=clone(backup.pet);
      if(!save()){state.pet=original;throw new Error('保存できないため復元しませんでした。')}
      refreshDevGrowth();return {stage:growthStages[stageIndex()].id,xp:state.pet.xp};
    }
  });
}
renderShop();bind();checkDay();if(petMigrationPending||collectionMigrationPending)save();renderTasks();updateHud();renderEquipped();renderShopOwned();
})();
