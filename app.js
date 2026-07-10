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
const defaults={
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
let state=load();
let timer=null;
function clone(o){return JSON.parse(JSON.stringify(o))}
function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return clone(defaults);const x=JSON.parse(raw);if(!Array.isArray(x.tasks))return clone(defaults);if(!x.equipped)x.equipped=clone(defaults.equipped);return x}catch(e){return clone(defaults)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function $(id){return document.getElementById(id)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(timer);timer=setTimeout(()=>t.classList.add('hidden'),1300)}
function updateHud(){
  $('pointsTop').textContent=state.points;$('pointsHud').textContent=state.points;$('shopPoints').textContent=state.points;
  $('todayPoints').textContent=state.today;$('dailyGoal').textContent=state.goal;$('bellyHud').textContent=state.belly;
  $('roomHud').classList.toggle('hidden',!$('room').classList.contains('active'));
}
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');
  document.querySelectorAll('.bottomNav button').forEach(b=>b.classList.remove('on'));$('nav-'+id).classList.add('on');
  updateHud();if(id==='room')renderEquipped();if(id==='shop')renderShopOwned();
}
function renderTasks(){
  const box=$('taskList');box.innerHTML='';
  subjects.forEach(sub=>{
    const block=document.createElement('div');block.className='subjectBlock';
    const head=document.createElement('div');head.className='subjectHead';
    head.innerHTML='<span class="dot" style="background:'+colors[sub]+'"></span>'+sub;
    const add=document.createElement('button');add.className='addMini';add.textContent='＋教材';add.onclick=()=>openTaskEditor(sub);head.appendChild(add);block.appendChild(head);
    state.tasks.filter(t=>t.subject===sub).forEach(t=>block.appendChild(taskCard(t)));box.appendChild(block);
  });updateHud();
}
function taskCard(t){
  const pct=t.total?Math.min(100,Math.round(t.now/t.total*100)):0;const card=document.createElement('div');card.className='taskCard';
  const main=document.createElement('div');main.className='taskMain';main.innerHTML='<b></b><small></small><div class="progress"><span></span></div>';
  main.querySelector('b').textContent=t.name;main.querySelector('small').textContent=t.now+' / '+t.total+'ページ';
  main.querySelector('.progress span').style.width=pct+'%';main.querySelector('.progress span').style.background=colors[t.subject]||'#ef4f90';
  const edit=document.createElement('button');edit.className='editSmall';edit.textContent='編集';edit.onclick=()=>openTaskEditor(t.subject,t.id);main.appendChild(edit);
  const priWrap=document.createElement('div');const pri=document.createElement('span');pri.className=t.priority==='高'?'badge':t.priority==='中'?'badge mid':'badge low';pri.textContent=t.priority;priWrap.appendChild(pri);
  const deadline=document.createElement('div');deadline.className='deadline';deadline.textContent=formatDate(t.date);
  const pts=document.createElement('div');pts.className='pointBtns';[0,1,2,3,4,5].forEach(n=>{const b=document.createElement('button');b.textContent=n;if(t.score===n)b.classList.add('on');b.onclick=()=>setScore(t.id,n);pts.appendChild(b)});
  card.append(main,priWrap,deadline,pts);return card;
}
function formatDate(d){if(!d)return '-';const p=d.split('-');return p.length===3?Number(p[1])+'/'+Number(p[2]):d}
function setScore(id,n){const t=state.tasks.find(x=>x.id===id);if(!t)return;const old=t.score||0;state.points+=n-old;state.today+=n-old;t.score=n;save();renderTasks();toast(n+'ptにしたよ')}
function openTaskEditor(subject='こくご',id=''){const t=id?state.tasks.find(x=>x.id===id):null;$('taskEditor').classList.remove('hidden');$('editId').value=t?t.id:'';$('editorTitle').textContent=t?'教材を編集':'教材を追加';$('deleteBtn').classList.toggle('hidden',!t);$('subjectInput').value=t?t.subject:subject;$('nameInput').value=t?t.name:'';$('nowInput').value=t?t.now:0;$('totalInput').value=t?t.total:30;$('priorityInput').value=t?t.priority:'中';$('dateInput').value=t?t.date:''}
function closeTaskEditor(){$('taskEditor').classList.add('hidden')}
function saveTask(){const id=$('editId').value;const data={subject:$('subjectInput').value,name:$('nameInput').value.trim()||'新しいドリル',now:Number($('nowInput').value)||0,total:Math.max(1,Number($('totalInput').value)||1),priority:$('priorityInput').value,date:$('dateInput').value,score:0};if(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(t){data.score=t.score||0;Object.assign(t,data)}}else{data.id=Date.now();state.tasks.push(data)}save();closeTaskEditor();renderTasks();toast('保存したよ')}
function deleteTask(){const id=$('editId').value;state.tasks=state.tasks.filter(t=>String(t.id)!==String(id));save();closeTaskEditor();renderTasks();toast('削除したよ')}
function buyFood(name,cost,value){if(state.points<cost){toast('ポイントが足りないよ');return}state.points-=cost;if(!state.food[name])state.food[name]={count:0,value};state.food[name].count++;save();updateHud();toast(name+'を買ったよ')}
function buyDress(name,cost){if(state.dress.includes(name)){toast('もう持っているよ');return}if(state.points<cost){toast('ポイントが足りないよ');return}state.points-=cost;state.dress.push(name);save();updateHud();renderShopOwned();toast(name+'を買ったよ')}
function renderShopOwned(){document.querySelectorAll('[data-dress]').forEach(b=>{const owned=state.dress.includes(b.dataset.dress);b.classList.toggle('owned',owned);const strong=b.querySelector('strong');if(strong)strong.textContent=owned?'購入済み':b.dataset.cost+'pt'})}
function openInventory(type){
  const body=$('itemModalBody'),title=$('itemModalTitle');body.innerHTML='';
  if(type==='food'){
    title.textContent='ごはんをあげる';const items=Object.entries(state.food).filter(([,x])=>x.count>0);
    if(!items.length){const b=document.createElement('button');b.textContent='ショップで買う';b.onclick=()=>{closeModal();showPage('shop')};body.appendChild(b)}
    else items.forEach(([name,it])=>{const b=document.createElement('button');b.innerHTML=name+'<span>×'+it.count+' / おなか +'+it.value+'</span>';b.onclick=()=>useFood(name);body.appendChild(b)});
  }else{
    title.textContent='きせかえ';
    const owned=state.dress;
    const remove=document.createElement('button');remove.innerHTML='はずす<span>全部はずす</span>';remove.onclick=()=>{state.equipped={ribbon:null,glasses:false,hat:false};save();renderEquipped();closeModal();toast('はずしたよ')};body.appendChild(remove);
    if(!owned.length){const b=document.createElement('button');b.textContent='ショップで買う';b.onclick=()=>{closeModal();showPage('shop')};body.appendChild(b)}
    owned.forEach(name=>{const b=document.createElement('button');const active=isEquipped(name);b.innerHTML=name+'<span>'+(active?'はずす':'つける')+'</span>';b.onclick=()=>toggleEquip(name);body.appendChild(b)});
  }
  $('itemModal').classList.remove('hidden');
}
function isEquipped(name){if(ribbonMap[name])return state.equipped.ribbon===name;if(name==='まるメガネ')return !!state.equipped.glasses;if(name==='あかいぼうし')return !!state.equipped.hat;return false}
function toggleEquip(name){
  if(ribbonMap[name])state.equipped.ribbon=state.equipped.ribbon===name?null:name;
  else if(name==='まるメガネ')state.equipped.glasses=!state.equipped.glasses;
  else if(name==='あかいぼうし')state.equipped.hat=!state.equipped.hat;
  save();renderEquipped();closeModal();toast(isEquipped(name)?name+'をつけたよ':name+'をはずしたよ');
}
function renderEquipped(){
  const rib=$('wearRibbon');if(state.equipped.ribbon){rib.src=ribbonMap[state.equipped.ribbon];rib.classList.remove('hidden')}else rib.classList.add('hidden');
  $('wearGlasses').classList.toggle('hidden',!state.equipped.glasses);
  $('wearHat').classList.toggle('hidden',!state.equipped.hat);
}
function useFood(name){const it=state.food[name];if(!it||it.count<=0)return;it.count--;state.belly=Math.min(50,state.belly+it.value);save();updateHud();closeModal();toast(name+'を食べたよ')}
function closeModal(){$('itemModal').classList.add('hidden')}
function bind(){
  document.querySelectorAll('.bottomNav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $('addMainBtn').onclick=()=>openTaskEditor('こくご');$('closeTaskEditor').onclick=closeTaskEditor;$('saveTaskBtn').onclick=saveTask;$('deleteBtn').onclick=deleteTask;
  $('closeItemModal').onclick=closeModal;$('roomFoodBtn').onclick=()=>openInventory('food');$('roomDressBtn').onclick=()=>openInventory('dress');
  document.querySelectorAll('[data-food]').forEach(b=>b.onclick=()=>buyFood(b.dataset.food,Number(b.dataset.cost),Number(b.dataset.value)));
  document.querySelectorAll('[data-dress]').forEach(b=>b.onclick=()=>buyDress(b.dataset.dress,Number(b.dataset.cost)));
  document.querySelectorAll('.shopTabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.shopTabs button').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.shopPane').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(b.dataset.tab).classList.add('active')});
}
bind();renderTasks();updateHud();renderEquipped();renderShopOwned();
})();