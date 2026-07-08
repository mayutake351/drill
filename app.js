const KEY='makopet_use_v2';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{points:25,belly:32,food:{},dress:[],memo:''};
let toastTimer;
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');updateHud()}
function updateHud(){document.getElementById('points').textContent=state.points;document.getElementById('belly').textContent=state.belly;document.getElementById('bellyBox').style.display=document.getElementById('room').classList.contains('active')?'inline-block':'none'}
function toast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add('hidden'),1300)}
function score(n){state.points+=n;save();updateHud();toast(n+'pt もらったよ')}
function buyFood(name,cost,value){if(state.points<cost){toast('ポイントが足りないよ');return}state.points-=cost;state.food[name]=state.food[name]||{count:0,value:value};state.food[name].count+=1;save();updateHud();toast(name+'を買ったよ')}
function buyDress(name,cost){if(state.dress.includes(name)){toast('もう持っているよ');return}if(state.points<cost){toast('ポイントが足りないよ');return}state.points-=cost;state.dress.push(name);save();updateHud();toast(name+'を買ったよ')}
function petTap(){toast('にこっ♪')}
function openInventory(type){const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');body.innerHTML='';if(type==='food'){title.textContent='ごはんをあげる';const items=Object.entries(state.food).filter(([n,o])=>o.count>0);if(items.length===0){body.innerHTML='<button onclick="closeModal();showPage(\\'shop\\')">ショップで買う</button>'}else{items.forEach(([name,obj])=>{const b=document.createElement('button');b.innerHTML=name+'<span>×'+obj.count+' / おなか +'+obj.value+'</span>';b.onclick=()=>useFood(name);body.appendChild(b)})}}else{title.textContent='きせかえ';if(state.dress.length===0){body.innerHTML='<button onclick="closeModal();showPage(\\'shop\\')">ショップで買う</button>'}else{state.dress.forEach(name=>{const b=document.createElement('button');b.innerHTML=name+'<span>つける</span>';b.onclick=()=>{closeModal();toast(name+'をつけたよ')};body.appendChild(b)})}}modal.classList.remove('hidden')}
function useFood(name){const item=state.food[name];if(!item||item.count<=0)return;item.count-=1;state.belly=Math.min(50,state.belly+item.value);save();updateHud();closeModal();toast(name+'を食べたよ')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function openEdit(){document.getElementById('editModal').classList.remove('hidden')}
function closeEdit(){document.getElementById('editModal').classList.add('hidden')}
function saveEdit(){state.memo=document.getElementById('subjectInput').value+' / '+document.getElementById('drillInput').value;save();closeEdit();toast('保存したよ')}
updateHud();