const SUBJECT_KEY="makopet_subjects_v5";
const DAILY_KEY="makopet_daily_v5";
const PET_KEY="makopet_pet_v5";

const cats=[
  {id:"white",name:"しろねこ",emoji:"🐱",className:""},
  {id:"mike",name:"みけねこ",emoji:"🐈",className:"mike"},
  {id:"black",name:"くろねこ",emoji:"🐈‍⬛",className:"black"},
  {id:"orange",name:"ちゃとら",emoji:"😺",className:"orange"},
  {id:"pink",name:"さくらねこ",emoji:"🌸",className:"pink"},
  {id:"star",name:"ほしねこ",emoji:"⭐",className:"star"},
  {id:"dino",name:"きょうりゅうねこ",emoji:"🦖",className:"dino"}
];

const shopItems=[
  {id:"bed",emoji:"🛏",name:"ふかふかベッド",price:30,cls:"item-bed"},
  {id:"ball",emoji:"🧶",name:"毛糸ボール",price:20,cls:"item-ball"},
  {id:"tower",emoji:"🏰",name:"キャットタワー",price:80,cls:"item-tower"},
  {id:"plant",emoji:"🪴",name:"観葉植物",price:40,cls:"item-plant"},
  {id:"sofa",emoji:"🛋",name:"ソファ",price:70,cls:"item-sofa"},
  {id:"toy",emoji:"🧸",name:"ぬいぐるみ",price:50,cls:"item-toy"}
];

const dressItems=[
  {id:"ribbon",emoji:"🎀",name:"ピンクリボン",price:40},
  {id:"hat",emoji:"👒",name:"おでかけ帽子",price:60},
  {id:"crown",emoji:"👑",name:"王冠",price:120},
  {id:"wing",emoji:"🪽",name:"天使の羽",price:150}
];

let pendingCat=null;
let birthStep=0;

function load(k,d){return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function today(){return new Date().toISOString().slice(0,10)}
function getSubjects(){return load(SUBJECT_KEY,[])}
function setSubjects(v){save(SUBJECT_KEY,v)}
function getDaily(){let d=load(DAILY_KEY,{}); if(!d[today()])d[today()]={}; return d}
function setDaily(v){save(DAILY_KEY,v)}
function getPet(){
  let p=load(PET_KEY,{exp:0,totalPoints:0,coins:0,hatched:false,cat:null,catName:"",book:[],items:[],happy:100,hunger:100,last:today()});
  if(p.last!==today()){
    p.happy=Math.max(0,p.happy-15);
    p.hunger=Math.max(0,p.hunger-20);
    p.last=today();
    save(PET_KEY,p);
  }
  return p;
}
function setPet(v){save(PET_KEY,v)}

function showTab(id,btn){
  ["home","manage","shop","dress","book","note"].forEach(x=>document.getElementById(x).classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  render();
}

function addDefaultSubjects(){
  const s=getSubjects();
  [
    {id:Date.now()+1,name:"Z会 国語",goal:"2ページ"},
    {id:Date.now()+2,name:"算数ラボ",goal:"1ページ"},
    {id:Date.now()+3,name:"漢字ドリル",goal:"1ページ"}
  ].forEach(d=>{if(!s.find(x=>x.name===d.name))s.push(d)});
  setSubjects(s); render();
}

function addSubject(){
  const name=document.getElementById("subjectName").value.trim();
  const goal=document.getElementById("subjectGoal").value.trim();
  if(!name){alert("科目・教材名を入れてね");return}
  const s=getSubjects();
  s.push({id:Date.now(),name,goal:goal||"今日の目標"});
  setSubjects(s);
  document.getElementById("subjectName").value="";
  document.getElementById("subjectGoal").value="";
  render();
}

function removeSubject(id){
  if(confirm("この科目を削除する？")){
    setSubjects(getSubjects().filter(s=>s.id!==id));
    render();
  }
}

function setPoint(id,point){
  const d=getDaily();
  const old=d[today()][id]||0;
  d[today()][id]=point;
  setDaily(d);
  const diff=point-old;
  if(diff>0)gain(diff);
  render();
}

function gain(point){
  const p=getPet();
  p.totalPoints+=point;
  p.exp+=point*10;
  p.happy=Math.min(100,p.happy+point*3);

  while(p.exp>=100){
    p.exp-=100;
    if(!p.hatched){
      const cat=cats[Math.floor(Math.random()*cats.length)];
      p.hatched=true; p.cat=cat; p.catName="";
      if(!p.book.find(x=>x.id===cat.id))p.book.push(cat);
      pendingCat=cat;
      startBirth(cat);
    }else{
      p.coins+=5;
    }
  }
  setPet(p);
}

function startBirth(cat){
  birthStep=0;
  document.getElementById("birthModal").classList.remove("hidden");
  document.getElementById("birthEgg").classList.remove("hidden","cracking");
  document.getElementById("bornCat").className="catArt bornArt hidden "+cat.className;
  document.getElementById("catNameInput").classList.add("hidden");
  document.getElementById("catNameInput").value="";
  document.getElementById("birthTitle").textContent="ピシッ…！";
  document.getElementById("bornText").textContent="たまごが動いているよ…";
  document.getElementById("birthButton").textContent="つづける";
}

function nextBirthStep(){
  const egg=document.getElementById("birthEgg");
  const born=document.getElementById("bornCat");
  const input=document.getElementById("catNameInput");

  if(birthStep===0){
    egg.classList.add("cracking");
    document.getElementById("birthTitle").textContent="ピシピシ…！";
    document.getElementById("bornText").textContent="もうすぐ生まれそう！";
    birthStep++;
    return;
  }
  if(birthStep===1){
    egg.classList.add("hidden");
    born.classList.remove("hidden");
    document.getElementById("birthTitle").textContent="おめでとう！";
    document.getElementById("bornText").textContent=pendingCat.name+"がうまれたよ！";
    input.classList.remove("hidden");
    document.getElementById("birthButton").textContent="名前を決める";
    birthStep++;
    return;
  }
  const name=input.value.trim();
  if(name){
    const p=getPet();
    p.catName=name;
    setPet(p);
  }
  closeBirthModal();
}

function closeBirthModal(){
  document.getElementById("birthModal").classList.add("hidden");
  pendingCat=null;
  render();
}

function useFood(){
  const p=getPet();
  if(p.totalPoints<10){speech("あと少しでごはんをあげられるよ♪");return}
  p.totalPoints-=10; p.coins+=3; p.exp+=15; p.hunger=Math.min(100,p.hunger+35);
  setPet(p);
  speech(p.hatched?"もぐもぐ。おいしいにゃ！":"たまごがぽかぽかしてきたよ！");
  render();
}

function play(){
  const p=getPet();
  p.happy=Math.min(100,p.happy+15);
  p.hunger=Math.max(0,p.hunger-5);
  setPet(p);
  speech(p.hatched?"いっぱい遊んだにゃ！":"たまごがうれしそうに揺れた！");
  render();
}

function speech(t){document.getElementById("speech").textContent=t}

function tapPet(){
  const stage=document.querySelector(".petStage");
  stage.classList.remove("bump");
  void stage.offsetWidth;
  stage.classList.add("bump");
  const p=getPet();
  const displayName=p.catName||p.cat?.name||"";
  const phrases=p.hatched
    ? ["なでなでうれしいにゃ","おかえり！",displayName+"に会いにきてくれてうれしいにゃ","遊ぼうにゃ♪"]
    : ["ぽかぽか…♪","なにが生まれるかな？","もう少しでヒビが入りそう！"];
  speech(phrases[Math.floor(Math.random()*phrases.length)]);
}

function buyItem(id,type){
  const list=type==="dress"?dressItems:shopItems;
  const item=list.find(x=>x.id===id);
  const p=getPet();
  if(p.items.includes(id))return;
  if(p.coins<item.price){alert("コインが足りないよ");return}
  p.coins-=item.price; p.items.push(id); setPet(p); render();
}

function resetToday(){
  if(confirm("今日のポイントをリセットする？")){
    const d=getDaily(); d[today()]={}; setDaily(d); render();
  }
}

function makeEgg(exp){
  const div=document.createElement("div");
  div.className="eggArt"+(exp>=70?" glow":"");
  const span=document.createElement("span");
  span.textContent=exp>=70?"⚡":(exp>=40?"⌁":"");
  div.appendChild(span);
  return div;
}

function makeCat(cat){
  const div=document.createElement("div");
  div.className="catArt "+(cat?.className||"");
  div.innerHTML='<div class="face"><i></i><b></b></div>';
  return div;
}

function renderPet(){
  const p=getPet();
  document.getElementById("totalPoints").textContent=p.totalPoints;
  document.getElementById("coins").textContent=p.coins;
  document.getElementById("expFill").style.width=p.exp+"%";
  document.getElementById("expText").textContent=p.exp+"/100";
  document.getElementById("happy").textContent=p.happy;
  document.getElementById("hunger").textContent=p.hunger;

  const art=document.getElementById("petArt");
  art.innerHTML="";
  const stage=document.querySelector(".petStage");
  stage.classList.remove("walk");

  if(p.hatched&&p.cat){
    art.appendChild(makeCat(p.cat));
    stage.classList.add("walk");
    document.getElementById("crack").textContent="";
    const displayName=p.catName||p.cat.name;
    document.getElementById("mainMsg").innerHTML=displayName+"のおへや";
    speech(p.happy<40?"さみしかったにゃ…":p.hunger<40?"おなかすいたにゃ…":displayName+"だよ。今日もよろしくにゃ♪");
  }else{
    art.appendChild(makeEgg(p.exp));
    document.getElementById("crack").textContent=p.exp>=70?"⚡ ⚡":(p.exp>=40?"⚡":"");
    document.getElementById("mainMsg").innerHTML="ふしぎなたまごから<br>かわいい子がうまれるよ";
  }
  renderDressLayers(p);
}

function renderDressLayers(p){
  document.getElementById("hatLayer").textContent="";
  document.getElementById("ribbonLayer").textContent="";
  if(!p.hatched)return;
  if(p.items.includes("hat"))document.getElementById("hatLayer").textContent="👒";
  if(p.items.includes("crown"))document.getElementById("hatLayer").textContent="👑";
  if(p.items.includes("ribbon"))document.getElementById("ribbonLayer").textContent="🎀";
  if(p.items.includes("wing"))document.getElementById("ribbonLayer").textContent="🪽";
}

function renderRoom(){
  const p=getPet();
  const box=document.getElementById("roomItems");
  box.innerHTML="";
  shopItems.forEach(i=>{
    if(p.items.includes(i.id)){
      const d=document.createElement("div");
      d.className="floorItem "+i.cls;
      d.textContent=i.emoji;
      box.appendChild(d);
    }
  });
}

function renderSubjects(){
  const subjects=getSubjects();
  const daily=getDaily()[today()]||{};
  const box=document.getElementById("subjects");
  box.innerHTML=subjects.length?"":'<div class="empty">まだ科目がありません。「おすすめ科目を追加」から始めてね。</div>';

  subjects.forEach(s=>{
    const val=daily[s.id]||0;
    const div=document.createElement("div");
    div.className="subject";
    div.innerHTML=`
      <div class="subjectTop">
        <div><div class="title">${s.name}</div><div class="meta">目標：${s.goal||"今日の目標"}</div></div>
        <span class="pill">${val} pt</span>
      </div>
      <div class="points">${[0,1,2,3].map(n=>`<button class="${val===n?'selected':''}" onclick="setPoint(${s.id},${n})">${n===0?'0':"⭐".repeat(n)}</button>`).join("")}</div>`;
    box.appendChild(div);
  });

  const list=document.getElementById("subjectList");
  list.innerHTML=subjects.length?"":'<div class="empty">科目なし</div>';
  subjects.forEach(s=>{
    const div=document.createElement("div");
    div.className="subject";
    div.innerHTML=`<div class="subjectTop"><div><div class="title">${s.name}</div><div class="meta">${s.goal||""}</div></div><button class="secondary" onclick="removeSubject(${s.id})">削除</button></div>`;
    list.appendChild(div);
  });
}

function renderShop(){
  const p=getPet();
  [["shopGrid",shopItems,"shop"],["dressGrid",dressItems,"dress"]].forEach(([grid,items,type])=>{
    const box=document.getElementById(grid);
    box.innerHTML="";
    items.forEach(i=>{
      const owned=p.items.includes(i.id);
      const div=document.createElement("div");
      div.className="item";
      div.innerHTML=`<span class="emoji">${i.emoji}</span><b>${i.name}</b><br><span class="price">🪙${i.price}</span><br>${owned?'<span class="owned">もってる</span>':`<button onclick="buyItem('${i.id}','${type}')">買う</button>`}`;
      box.appendChild(div);
    });
  });
}

function renderBook(){
  const p=getPet();
  const book=document.getElementById("bookGrid");
  book.innerHTML="";
  cats.forEach(c=>{
    const got=p.book.find(x=>x.id===c.id);
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<span class="emoji">${got?c.emoji:"❔"}</span><b>${got?c.name:"？？？"}</b>`;
    book.appendChild(div);
  });
}

function render(){renderPet();renderRoom();renderSubjects();renderShop();renderBook();}
render();
