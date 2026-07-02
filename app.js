const TASK_KEY = "makopet_v22_tasks";
const STATE_KEY = "makopet_v22_state";

const defaultTasks = [
  { id: 1, name: "📗 こくご", point: 0 },
  { id: 2, name: "🔢 さんすう", point: 0 },
  { id: 3, name: "✏️ 漢字", point: 0 },
  { id: 4, name: "ABC 英語", point: 0 },
  { id: 5, name: "📖 読書", point: 0 },
  { id: 6, name: "🪥 歯みがき", point: 0 }
];

const rewards = [
  { point: 10, text: "10ptで ごはん🍎" },
  { point: 30, text: "30ptで プレゼント🎁" },
  { point: 100, text: "100ptで 新しいたまご🥚" }
];

function load(key, def){
  try { return JSON.parse(localStorage.getItem(key)) ?? def; }
  catch { return def; }
}
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

let tasks = load(TASK_KEY, defaultTasks);
let state = load(STATE_KEY, {
  totalPoints: 0,
  todayPoints: 0,
  friend: 50,
  hunger: 70,
  streak: 0,
  cats: ["🐱"],
  currentCat: "🐱",
  lastDate: ""
});

function today(){ return new Date().toISOString().slice(0,10); }

function updateStreak(){
  if(state.lastDate !== today()){
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    state.streak = state.lastDate === yesterday ? state.streak + 1 : 1;
    state.lastDate = today();
    tasks.forEach(t => t.point = 0);
    state.todayPoints = 0;
  }
}

function render(){
  updateStreak();
  document.getElementById("todayPoints").textContent = state.todayPoints;
  document.getElementById("friend").textContent = state.friend;
  document.getElementById("hunger").textContent = state.hunger;
  document.getElementById("streak").textContent = state.streak;

  const next = nextReward();
  document.getElementById("nextReward").textContent = next.text;
  document.getElementById("rewardFill").style.width = Math.min(100, state.todayPoints / next.point * 100) + "%";

  const taskBox = document.getElementById("tasks");
  taskBox.innerHTML = "";
  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `
      <div class="taskName" onclick="editTask(${task.id})">${task.name}</div>
      <div class="stars">
        ${[0,1,2,3].map(n => `<button class="${task.point===n?'on':''}" onclick="setPoint(${task.id},${n})">${n}</button>`).join("")}
      </div>
      <button class="delBtn" onclick="deleteTask(${task.id})">×</button>
    `;
    taskBox.appendChild(div);
  });

  document.getElementById("collection").textContent = state.cats.join(" ");

  save(TASK_KEY, tasks);
  save(STATE_KEY, state);
}

function nextReward(){
  if(state.todayPoints < 10) return rewards[0];
  if(state.todayPoints < 30) return rewards[1];
  return rewards[2];
}

function setPoint(id, point){
  const task = tasks.find(t => t.id === id);
  if(!task) return;
  const diff = point - task.point;
  task.point = point;
  if(diff > 0){
    state.todayPoints += diff;
    state.totalPoints += diff;
    state.friend = Math.min(100, state.friend + diff * 2);
    if(point === 3){
      say("すごいにゃ！<br>3ポイント達成✨");
      sparkle(38, 34, "✨");
    }else{
      say("がんばったね！<br>えらいにゃ〜♡");
    }
    heart();
    checkMilestone();
  }else{
    state.todayPoints = Math.max(0, state.todayPoints + diff);
    say("記録を直したにゃ");
  }
  render();
}

function addTask(){
  const name = prompt("追加するやることは？\n例：ピアノ、お手伝い、着替え");
  if(!name) return;
  tasks.push({ id: Date.now(), name: "✨ " + name, point: 0 });
  say("追加したにゃ！");
  sparkle(18, 66, "✨");
  render();
}

function editTask(id){
  const task = tasks.find(t => t.id === id);
  if(!task) return;
  const name = prompt("名前を変更する？", task.name);
  if(!name) return;
  task.name = name;
  say("名前を変えたにゃ");
  render();
}

function deleteTask(id){
  const task = tasks.find(t => t.id === id);
  if(!task) return;
  if(!confirm(task.name + " を削除する？")) return;
  tasks = tasks.filter(t => t.id !== id);
  say("削除したにゃ");
  render();
}

function feed(){
  if(state.todayPoints < 10){
    say("10ポイントで<br>ごはんが食べられるにゃ");
    sparkle(49, 38, "🍎");
    return;
  }
  state.todayPoints -= 10;
  state.hunger = Math.min(100, state.hunger + 25);
  state.friend = Math.min(100, state.friend + 5);
  say("もぐもぐ…<br>おいしいにゃ♡");
  sparkle(47, 38, "🍎");
  heart();
  render();
}

function present(){
  if(state.todayPoints < 30){
    say("30ポイントで<br>プレゼントが届くにゃ🎁");
    sparkle(60, 35, "🎁");
    return;
  }
  state.todayPoints -= 30;
  state.friend = Math.min(100, state.friend + 12);
  say("プレゼント<br>うれしいにゃ🎁");
  sparkle(48, 35, "🎁");
  heart();
  render();
}

function newEgg(){
  if(state.todayPoints < 100){
    say("100ポイントで<br>新しいたまご発見にゃ🥚");
    sparkle(58, 32, "🥚");
    return;
  }
  state.todayPoints -= 100;
  const pool = ["🐱","😺","😸","😻","🐈","🐈‍⬛","😽"];
  const cat = pool[Math.floor(Math.random()*pool.length)];
  state.currentCat = cat;
  if(!state.cats.includes(cat)) state.cats.push(cat);
  say("新しい子に<br>出会えたにゃ！🥚");
  sparkle(48, 35, "✨");
  heart();
  render();
}

function say(text){ document.getElementById("bubble").innerHTML = text; }

function heart(){
  const fx = document.getElementById("heartFx");
  fx.classList.remove("hidden");
  void fx.offsetWidth;
  setTimeout(() => fx.classList.add("hidden"), 950);
}

function sparkle(x, y, char="✨"){
  const layer = document.getElementById("sparkLayer");
  for(let i=0;i<5;i++){
    const s = document.createElement("div");
    s.className = "spark";
    s.textContent = char;
    s.style.left = (x + (Math.random()*10-5)) + "%";
    s.style.top = (y + (Math.random()*10-5)) + "%";
    layer.appendChild(s);
    setTimeout(()=>s.remove(), 950);
  }
}

function checkMilestone(){
  if(state.todayPoints === 10) {
    say("🍎 ごはんゲット！<br>すごいにゃ♡");
    sparkle(47, 35, "🍎");
  }
  if(state.todayPoints === 30) {
    say("🎁 プレゼントまで<br>到達したにゃ！");
    sparkle(47, 35, "🎁");
  }
  if(state.todayPoints === 100) {
    say("🥚 新しいたまごを<br>見つけたにゃ！");
    sparkle(47, 35, "🥚");
  }
}

function resetData(){
  if(!confirm("データをリセットする？")) return;
  localStorage.removeItem(TASK_KEY);
  localStorage.removeItem(STATE_KEY);
  tasks = JSON.parse(JSON.stringify(defaultTasks));
  state = { totalPoints:0, todayPoints:0, friend:50, hunger:70, streak:0, cats:["🐱"], currentCat:"🐱", lastDate:"" };
  say("リセットしたにゃ");
  render();
}

setInterval(() => {
  state.hunger = Math.max(0, state.hunger - 1);
  if(state.hunger < 30) say("おなかすいたにゃ…");
  render();
}, 60000);

render();
